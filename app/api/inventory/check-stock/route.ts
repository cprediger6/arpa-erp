// app/api/inventory/check-stock/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        { error: "ProductId es requerido" },
        { status: 400 }
      );
    }

    // Buscar todos los items de inventario del producto
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        productId,
        product: {
          companyId: session.user.companyId,
        },
      },
      include: {
        warehouse: true,
        variant: true,
      },
    });

    const totalStock = inventoryItems.reduce((sum, item) => sum + item.currentStock, 0);
    const totalAvailable = inventoryItems.reduce((sum, item) => sum + item.availableStock, 0);

    return NextResponse.json({
      productId,
      totalStock,
      totalAvailable,
      items: inventoryItems.map(item => ({
        id: item.id,
        warehouseId: item.warehouseId,
        warehouseName: item.warehouse.name,
        variantId: item.variantId,
        variantName: item.variant?.name || "Principal",
        currentStock: item.currentStock,
        availableStock: item.availableStock,
        reservedStock: item.reservedStock,
      })),
    });
  } catch (error) {
    console.error("❌ Error al verificar stock:", error);
    return NextResponse.json(
      { error: "Error al verificar stock" },
      { status: 500 }
    );
  }
}