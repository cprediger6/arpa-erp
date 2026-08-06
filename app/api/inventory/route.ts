// app/api/inventory/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener resumen de inventario
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId") || "";

    // Construir el filtro
    const where: any = {
      product: {
        companyId: session.user.companyId,
        isActive: true,
      },
    };

    if (productId) {
      where.productId = productId;
    }

    // Obtener todos los items de inventario
    const inventoryItems = await prisma.inventoryItem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        warehouse: true,
        variant: true,
        movements: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        kardex: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    // Calcular totales
    const totalStock = inventoryItems.reduce((sum, item) => sum + item.currentStock, 0);
    const availableStock = inventoryItems.reduce((sum, item) => sum + item.availableStock, 0);
    const reservedStock = inventoryItems.reduce((sum, item) => sum + item.reservedStock, 0);
    const transitStock = inventoryItems.reduce((sum, item) => sum + item.transitStock, 0);

    // Obtener movimientos recientes (para la tabla de movimientos)
    const recentMovements = await prisma.inventoryMovement.findMany({
      where: {
        inventoryItem: {
          product: {
            companyId: session.user.companyId,
          },
        },
      },
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
      take: 20,
    });

    // Obtener datos de Kardex (últimos 20 registros)
    const recentKardex = await prisma.kardex.findMany({
      where: {
        inventoryItem: {
          product: {
            companyId: session.user.companyId,
          },
        },
      },
      include: {
        inventoryItem: {
          include: {
            product: true,
          },
        },
        movement: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    return NextResponse.json({
      totalStock,
      availableStock,
      reservedStock,
      transitStock,
      items: inventoryItems,
      movements: recentMovements,
      kardex: recentKardex,
    });
  } catch (error) {
    console.error("Error al obtener inventario:", error);
    return NextResponse.json(
      { error: "Error al obtener inventario" },
      { status: 500 }
    );
  }
}