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
    const { productId, warehouseId, type, quantity, unitCost, reference, description } = body;

    // Validar datos requeridos
    if (!productId || !warehouseId || !type || !quantity) {
      return NextResponse.json(
        { error: "Producto, depósito, tipo y cantidad son requeridos" },
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

    // Verificar que el warehouse existe
    const warehouse = await prisma.warehouse.findFirst({
      where: {
        id: warehouseId,
        companyId: session.user.companyId,
      },
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
      },
    });

    if (!inventoryItem) {
      // Crear InventoryItem si no existe
      inventoryItem = await prisma.inventoryItem.create({
        data: {
          productId,
          warehouseId,
          currentStock: 0,
          availableStock: 0,
          reservedStock: 0,
          transitStock: 0,
          costMethod: "FIFO",
        },
      });
    }

    // Calcular nuevo stock
    let newStock = inventoryItem.currentStock;
    let newAvailable = inventoryItem.availableStock;

    switch (type) {
      case "ENTRY":
        newStock += quantity;
        newAvailable += quantity;
        break;
      case "EXIT":
        if (newStock < quantity) {
          return NextResponse.json(
            { error: "Stock insuficiente" },
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