// app/api/inventory/movements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      productId, 
      variantId, 
      warehouseId, 
      sourceWarehouseId, 
      targetWarehouseId,
      type, 
      quantity, 
      unitCost, 
      reference, 
      description,
      isTransfer 
    } = body;

    // Validar datos requeridos
    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: "Producto y cantidad son requeridos" },
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

    // Caso: Transferencia entre depósitos
    if (isTransfer) {
      if (!sourceWarehouseId || !targetWarehouseId) {
        return NextResponse.json(
          { error: "Depósito origen y destino son requeridos para transferencia" },
          { status: 400 }
        );
      }

      if (sourceWarehouseId === targetWarehouseId) {
        return NextResponse.json(
          { error: "El depósito origen y destino no pueden ser el mismo" },
          { status: 400 }
        );
      }

      // Verificar depósitos
      const [sourceWarehouse, targetWarehouse] = await Promise.all([
        prisma.warehouse.findFirst({
          where: { id: sourceWarehouseId, companyId: session.user.companyId },
        }),
        prisma.warehouse.findFirst({
          where: { id: targetWarehouseId, companyId: session.user.companyId },
        }),
      ]);

      if (!sourceWarehouse) {
        return NextResponse.json(
          { error: "Depósito origen no encontrado" },
          { status: 404 }
        );
      }

      if (!targetWarehouse) {
        return NextResponse.json(
          { error: "Depósito destino no encontrado" },
          { status: 404 }
        );
      }

      // Buscar o crear InventoryItem para origen
      let sourceInventory = await prisma.inventoryItem.findFirst({
        where: {
          productId,
          warehouseId: sourceWarehouseId,
          ...(variantId ? { variantId } : {}),
        },
      });

      if (!sourceInventory) {
        return NextResponse.json(
          { error: "No hay stock en el depósito origen" },
          { status: 400 }
        );
      }

      // Verificar stock en origen
      if (sourceInventory.availableStock < quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente en origen. Disponible: ${sourceInventory.availableStock}` },
          { status: 400 }
        );
      }

      // Buscar o crear InventoryItem para destino
      let targetInventory = await prisma.inventoryItem.findFirst({
        where: {
          productId,
          warehouseId: targetWarehouseId,
          ...(variantId ? { variantId } : {}),
        },
      });

      if (!targetInventory) {
        targetInventory = await prisma.inventoryItem.create({
          data: {
            productId,
            warehouseId: targetWarehouseId,
            variantId: variantId || null,
            currentStock: 0,
            availableStock: 0,
            reservedStock: 0,
            transitStock: 0,
            costMethod: "FIFO",
          },
        });
      }

      // Crear movimiento de TRANSFER
      const movement = await prisma.inventoryMovement.create({
        data: {
          type: "TRANSFER",
          quantity,
          unitCost: unitCost || 0,
          totalCost: (unitCost || 0) * quantity,
          reference: reference || null,
          description: description || `Transferencia de ${sourceWarehouse.name} a ${targetWarehouse.name}`,
          inventoryItemId: sourceInventory.id,
          sourceWarehouseId: sourceWarehouseId,
          targetWarehouseId: targetWarehouseId,
          userId: session.user.id,
        },
      });

      // Actualizar stock en origen (restar)
      await prisma.inventoryItem.update({
        where: { id: sourceInventory.id },
        data: {
          currentStock: sourceInventory.currentStock - quantity,
          availableStock: sourceInventory.availableStock - quantity,
          lastCost: unitCost || sourceInventory.lastCost,
        },
      });

      // Actualizar stock en destino (sumar)
      await prisma.inventoryItem.update({
        where: { id: targetInventory.id },
        data: {
          currentStock: targetInventory.currentStock + quantity,
          availableStock: targetInventory.availableStock + quantity,
          lastCost: unitCost || targetInventory.lastCost,
        },
      });

      // Crear registros en Kardex para ambos
      await prisma.kardex.create({
        data: {
          movementId: movement.id,
          inventoryItemId: sourceInventory.id,
          quantityIn: 0,
          quantityOut: quantity,
          balance: sourceInventory.currentStock - quantity,
          unitCost: unitCost || 0,
          totalCost: (unitCost || 0) * quantity,
          balanceCost: (sourceInventory.currentStock - quantity) * (unitCost || 0),
        },
      });

      await prisma.kardex.create({
        data: {
          movementId: movement.id,
          inventoryItemId: targetInventory.id,
          quantityIn: quantity,
          quantityOut: 0,
          balance: targetInventory.currentStock + quantity,
          unitCost: unitCost || 0,
          totalCost: (unitCost || 0) * quantity,
          balanceCost: (targetInventory.currentStock + quantity) * (unitCost || 0),
        },
      });

      return NextResponse.json({
        success: true,
        movement,
        sourceNewStock: sourceInventory.currentStock - quantity,
        targetNewStock: targetInventory.currentStock + quantity,
      });
    }

    // Caso: Movimiento normal (ENTRY, EXIT, etc.)
    // Verificar depósito
    if (!warehouseId) {
      return NextResponse.json(
        { error: "Depósito es requerido" },
        { status: 400 }
      );
    }

    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId: session.user.companyId },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: "Depósito no encontrado" },
        { status: 404 }
      );
    }

    // Buscar o crear InventoryItem
    let inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        productId,
        warehouseId,
        ...(variantId ? { variantId } : {}),
      },
    });

    if (!inventoryItem) {
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          productId,
          warehouseId,
          variantId: variantId || null,
          currentStock: 0,
          availableStock: 0,
          reservedStock: 0,
          transitStock: 0,
          costMethod: "FIFO",
        },
      });
    }

    // Calcular nuevo stock según tipo
    let newStock = inventoryItem.currentStock;
    let newAvailable = inventoryItem.availableStock;

    switch (type) {
      case "ENTRY":
        newStock += quantity;
        newAvailable += quantity;
        break;
      case "EXIT":
        if (inventoryItem.availableStock < quantity) {
          return NextResponse.json(
            { error: `Stock insuficiente. Disponible: ${inventoryItem.availableStock}` },
            { status: 400 }
          );
        }
        newStock -= quantity;
        newAvailable -= quantity;
        break;
      case "ADJUSTMENT":
        newStock = quantity;
        newAvailable = quantity;
        break;
      default:
        return NextResponse.json(
          { error: "Tipo de movimiento no válido" },
          { status: 400 }
        );
    }

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

    // Actualizar InventoryItem
    await prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: {
        currentStock: newStock,
        availableStock: newAvailable,
        lastCost: unitCost || inventoryItem.lastCost,
      },
    });

    // Crear registro en Kardex
    await prisma.kardex.create({
      data: {
        movementId: movement.id,
        inventoryItemId: inventoryItem.id,
        quantityIn: type === "ENTRY" ? quantity : 0,
        quantityOut: type === "EXIT" ? quantity : 0,
        balance: newStock,
        unitCost: unitCost || 0,
        totalCost: (unitCost || 0) * quantity,
        balanceCost: newStock * (unitCost || 0),
      },
    });

    return NextResponse.json({
      success: true,
      movement,
      newStock,
    });
  } catch (error) {
    console.error("Error al crear movimiento:", error);
    return NextResponse.json(
      { error: "Error al crear movimiento" },
      { status: 500 }
    );
  }
}