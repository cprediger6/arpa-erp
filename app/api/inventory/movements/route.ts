// app/api/inventory/movements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener movimientos
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || "";

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

    const movements = await prisma.inventoryMovement.findMany({
      where,
      include: {
        inventoryItem: {
          include: {
            product: true,
            warehouse: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
        sourceWarehouse: true,
        targetWarehouse: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error al obtener movimientos:", error);
    return NextResponse.json(
      { error: "Error al obtener movimientos" },
      { status: 500 }
    );
  }
}

// POST - Crear movimiento
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPERVISOR", "WAREHOUSE"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para realizar movimientos" },
      { status: 403 }
    );
  }

  try {
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
    } = body;

    console.log("📦 Recibiendo movimiento:", { type, productId, warehouseId, quantity });

    // Validaciones
    if (!type || !productId || !warehouseId || !quantity) {
      return NextResponse.json(
        { error: "Tipo, producto, almacén y cantidad son requeridos" },
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

    // Buscar o crear el item de inventario
    let inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        productId,
        warehouseId,
        variantId: variantId || null,
      },
    });

    if (!inventoryItem) {
      inventoryItem = await prisma.inventoryItem.create({
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
    }

    // Calcular nuevo stock
    let newCurrentStock = inventoryItem.currentStock;
    let newAvailableStock = inventoryItem.availableStock;

    switch (type) {
      case "ENTRY":
      case "PRODUCTION":
      case "RETURN":
        newCurrentStock = inventoryItem.currentStock + quantity;
        newAvailableStock = inventoryItem.availableStock + quantity;
        break;
      case "EXIT":
      case "WASTE":
        if (inventoryItem.availableStock < quantity) {
          return NextResponse.json(
            { error: `Stock insuficiente. Disponible: ${inventoryItem.availableStock}` },
            { status: 400 }
          );
        }
        newCurrentStock = inventoryItem.currentStock - quantity;
        newAvailableStock = inventoryItem.availableStock - quantity;
        break;
      case "ADJUSTMENT":
        newCurrentStock = quantity;
        newAvailableStock = quantity;
        break;
      default:
        return NextResponse.json(
          { error: "Tipo de movimiento inválido" },
          { status: 400 }
        );
    }

    // Actualizar stock
    await prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        currentStock: newCurrentStock,
        availableStock: newAvailableStock,
        lastCost: unitCost || inventoryItem.lastCost,
      },
    });

    // Crear movimiento
    const movement = await prisma.inventoryMovement.create({
      data: {
        type,
        quantity,
        unitCost: unitCost || 0,
        totalCost: (unitCost || 0) * quantity,
        reference: reference || null,
        description: description || null,
        inventoryItemId: inventoryItem.id,
        userId: session.user.id,
      },
    });

    // Crear Kardex
    await prisma.kardex.create({
      data: {
        movementId: movement.id,
        inventoryItemId: inventoryItem.id,
        quantityIn: ["ENTRY", "PRODUCTION", "RETURN"].includes(type) ? quantity : 0,
        quantityOut: ["EXIT", "WASTE"].includes(type) ? quantity : 0,
        balance: newCurrentStock,
        unitCost: unitCost || 0,
        totalCost: (unitCost || 0) * quantity,
        balanceCost: (unitCost || 0) * newCurrentStock,
      },
    });

    // Obtener el movimiento completo
    const result = await prisma.inventoryMovement.findUnique({
      where: { id: movement.id },
      include: {
        inventoryItem: {
          include: {
            product: true,
            warehouse: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
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