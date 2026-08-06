// app/api/inventory/movements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener movimientos de inventario
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || "";
    const warehouseId = searchParams.get("warehouseId") || "";
    const type = searchParams.get("type") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      inventoryItem: {
        product: {
          companyId: session.user.companyId,
        },
      },
    };

    if (productId) {
      where.inventoryItem.productId = productId;
    }

    if (warehouseId) {
      where.inventoryItem.warehouseId = warehouseId;
    }

    if (type) {
      where.type = type;
    }

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        inventoryItem: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            warehouse: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sourceWarehouse: true,
        targetWarehouse: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("❌ Error al obtener movimientos:", error);
    return NextResponse.json(
      { error: "Error al obtener movimientos" },
      { status: 500 }
    );
  }
}

// POST - Crear un movimiento de inventario
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      console.error("❌ No hay sesión o usuario");
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!session.user.id) {
      console.error("❌ Usuario sin ID:", session.user);
      return NextResponse.json(
        { error: "Usuario no válido" },
        { status: 401 }
      );
    }

    console.log("👤 Usuario ID:", session.user.id);
    console.log("👤 Usuario role:", session.user.role);

    // Restringir: solo ADMIN, SUPERVISOR y WAREHOUSE pueden hacer movimientos
    const allowedRoles = ["ADMIN", "SUPERVISOR", "WAREHOUSE"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tienes permisos para realizar movimientos de inventario" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      type,
      productId,
      variantId,
      warehouseId,
      quantity,
      unitCost,
      reference,
      description,
      sourceWarehouseId,
      targetWarehouseId,
    } = body;

    console.log("📦 Datos recibidos:", { 
      type, 
      productId, 
      warehouseId, 
      quantity, 
      unitCost,
      reference 
    });

    // Validaciones
    if (!type || !productId || !warehouseId || !quantity) {
      return NextResponse.json(
        { error: "Tipo, producto, almacén y cantidad son requeridos" },
        { status: 400 }
      );
    }

    if (quantity <= 0) {
      return NextResponse.json(
        { error: "La cantidad debe ser mayor a 0" },
        { status: 400 }
      );
    }

    const validTypes = ["ENTRY", "EXIT", "TRANSFER", "ADJUSTMENT", "PRODUCTION", "RETURN", "WASTE", "INTERNAL", "LOAN", "DONATION"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Tipo de movimiento inválido" },
        { status: 400 }
      );
    }

    // Verificar que el producto existe
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        companyId: session.user.companyId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    // Verificar que el almacén existe
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        companyId: session.user.companyId,
        isActive: true,
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: "Almacén no encontrado" },
        { status: 404 }
      );
    }

    // Para transferencias, verificar almacenes origen y destino
    if (type === "TRANSFER") {
      if (!sourceWarehouseId || !targetWarehouseId) {
        return NextResponse.json(
          { error: "Para transferencias se requiere almacén origen y destino" },
          { status: 400 }
        );
      }

      const sourceWarehouse = await prisma.warehouse.findFirst({
        where: {
          id: sourceWarehouseId,
          companyId: session.user.companyId,
          isActive: true,
        },
      });

      if (!sourceWarehouse) {
        return NextResponse.json(
          { error: "Almacén origen no encontrado" },
          { status: 404 }
        );
      }

      const targetWarehouse = await prisma.warehouse.findFirst({
        where: {
          id: targetWarehouseId,
          companyId: session.user.companyId,
          isActive: true,
        },
      });

      if (!targetWarehouse) {
        return NextResponse.json(
          { error: "Almacén destino no encontrado" },
          { status: 404 }
        );
      }
    }

    // Realizar el movimiento con transacción
    const result = await prisma.$transaction(async (tx) => {
      // Buscar o crear el item de inventario
      let inventoryItem = await tx.inventoryItem.findFirst({
        where: {
          productId,
          warehouseId,
          variantId: variantId || null,
        },
      });

      if (!inventoryItem) {
        // Crear item de inventario si no existe
        inventoryItem = await tx.inventoryItem.create({
          data: {
            productId,
            variantId: variantId || null,
            warehouseId,
            currentStock: 0,
            availableStock: 0,
            reservedStock: 0,
            transitStock: 0,
            costMethod: "AVERAGE",
          },
        });
        console.log("✅ Item de inventario creado:", inventoryItem.id);
      }

      // Calcular nuevo stock
      let newCurrentStock = inventoryItem.currentStock;
      let newAvailableStock = inventoryItem.availableStock;

      switch (type) {
        case "ENTRY":
        case "PRODUCTION":
        case "RETURN":
          newCurrentStock += quantity;
          newAvailableStock += quantity;
          break;
        case "EXIT":
        case "WASTE":
        case "LOAN":
        case "DONATION":
          if (inventoryItem.availableStock < quantity) {
            throw new Error(`Stock insuficiente. Disponible: ${inventoryItem.availableStock}, Requerido: ${quantity}`);
          }
          newCurrentStock -= quantity;
          newAvailableStock -= quantity;
          break;
        case "ADJUSTMENT":
          newCurrentStock = quantity;
          newAvailableStock = quantity;
          break;
        case "TRANSFER":
          // Para transferencias, se maneja en dos pasos
          break;
      }

      // Actualizar stock (para todos excepto TRANSFER)
      if (type !== "TRANSFER") {
        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            currentStock: newCurrentStock,
            availableStock: newAvailableStock,
            lastCost: unitCost || inventoryItem.lastCost,
          },
        });
        console.log("✅ Stock actualizado:", { newCurrentStock, newAvailableStock });
      }

      // Para transferencias, actualizar ambos almacenes
      if (type === "TRANSFER") {
        // 1. Quitar del origen
        const sourceItem = await tx.inventoryItem.findFirst({
          where: {
            productId,
            warehouseId: sourceWarehouseId,
            variantId: variantId || null,
          },
        });

        if (sourceItem) {
          if (sourceItem.availableStock < quantity) {
            throw new Error(`Stock insuficiente en origen. Disponible: ${sourceItem.availableStock}`);
          }
          await tx.inventoryItem.update({
            where: { id: sourceItem.id },
            data: {
              currentStock: sourceItem.currentStock - quantity,
              availableStock: sourceItem.availableStock - quantity,
            },
          });
        } else {
          throw new Error("No hay stock en el almacén origen");
        }

        // 2. Agregar al destino
        let targetItem = await tx.inventoryItem.findFirst({
          where: {
            productId,
            warehouseId: targetWarehouseId,
            variantId: variantId || null,
          },
        });

        if (!targetItem) {
          targetItem = await tx.inventoryItem.create({
            data: {
              productId,
              variantId: variantId || null,
              warehouseId: targetWarehouseId,
              currentStock: 0,
              availableStock: 0,
              reservedStock: 0,
              transitStock: 0,
              costMethod: "AVERAGE",
            },
          });
        }

        await tx.inventoryItem.update({
          where: { id: targetItem.id },
          data: {
            currentStock: targetItem.currentStock + quantity,
            availableStock: targetItem.availableStock + quantity,
          },
        });
      }

      // Crear el movimiento
      const movementData = {
        type,
        quantity,
        unitCost: unitCost || 0,
        totalCost: (unitCost || 0) * quantity,
        reference: reference || null,
        description: description || null,
        inventoryItemId: inventoryItem.id,
        userId: session.user.id,
      };

      console.log("📝 Creando movimiento:", movementData);

      const newMovement = await tx.inventoryMovement.create({
        data: movementData,
      });

      // Crear registro en Kardex
      await tx.kardex.create({
        data: {
          movementId: newMovement.id,
          inventoryItemId: inventoryItem.id,
          quantityIn: type === "ENTRY" || type === "PRODUCTION" || type === "RETURN" ? quantity : 0,
          quantityOut: type === "EXIT" || type === "WASTE" || type === "LOAN" || type === "DONATION" ? quantity : 0,
          balance: type === "TRANSFER" ? inventoryItem.currentStock : newCurrentStock,
          unitCost: unitCost || 0,
          totalCost: (unitCost || 0) * quantity,
          balanceCost: (unitCost || 0) * (type === "TRANSFER" ? inventoryItem.currentStock : newCurrentStock),
        },
      });

      return await tx.inventoryMovement.findUnique({
        where: { id: newMovement.id },
        include: {
          inventoryItem: {
            include: {
              product: true,
              warehouse: true,
            },
          },
          user: true,
          sourceWarehouse: true,
          targetWarehouse: true,
        },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error al crear movimiento:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear movimiento" },
      { status: 500 }
    );
  }
}