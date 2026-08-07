// app/api/inventory/update-stock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { productId, quantity, type, warehouseId, reference } = body;

    if (!productId || !quantity || !type) {
      return NextResponse.json(
        { error: "Producto, cantidad y tipo son requeridos" },
        { status: 400 }
      );
    }

    // ✅ Buscar el inventario del producto
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        productId,
        warehouseId: warehouseId || undefined,
      },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        { error: "Producto no encontrado en inventario" },
        { status: 404 }
      );
    }

    // ✅ Actualizar stock según el tipo
    let newStock = inventoryItem.currentStock;
    let newAvailable = inventoryItem.availableStock;

    if (type === "SALE" || type === "EXIT") {
      if (inventoryItem.availableStock < quantity) {
        return NextResponse.json(
          { error: "Stock insuficiente" },
          { status: 400 }
        );
      }
      newStock = inventoryItem.currentStock - quantity;
      newAvailable = inventoryItem.availableStock - quantity;
    } else if (type === "ENTRY" || type === "RETURN") {
      newStock = inventoryItem.currentStock + quantity;
      newAvailable = inventoryItem.availableStock + quantity;
    }

    // ✅ Actualizar en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar inventario
      const updated = await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          currentStock: newStock,
          availableStock: newAvailable,
        },
      });

      // Registrar movimiento
      const movement = await tx.inventoryMovement.create({
        data: {
          type: type === "SALE" ? "EXIT" : type,
          quantity,
          unitCost: inventoryItem.lastCost || 0,
          totalCost: (inventoryItem.lastCost || 0) * quantity,
          reference: reference || null,
          description: `Movimiento automático por ${type}`,
          inventoryItemId: inventoryItem.id,
          userId: session.user.id,
        },
      });

      // Registrar Kardex
      await tx.kardex.create({
        data: {
          movementId: movement.id,
          inventoryItemId: inventoryItem.id,
          quantityIn: type === "ENTRY" || type === "RETURN" ? quantity : 0,
          quantityOut: type === "SALE" || type === "EXIT" ? quantity : 0,
          balance: newStock,
          unitCost: inventoryItem.lastCost || 0,
          totalCost: (inventoryItem.lastCost || 0) * quantity,
          balanceCost: (inventoryItem.lastCost || 0) * newStock,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      stock: result,
      message: `Stock actualizado correctamente`,
    });
  } catch (error: any) {
    console.error("❌ Error al actualizar stock:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar stock" },
      { status: 500 }
    );
  }
}