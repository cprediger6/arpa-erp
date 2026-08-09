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

    // Obtener todos los warehouses de la empresa
    const warehouses = await prisma.warehouse.findMany({
      where: { 
        companyId: session.user.companyId,
        isActive: true 
      },
      select: { 
        id: true, 
        name: true,
        type: true,
      },
    });

    // Obtener todos los items de inventario
    const inventoryItems = await prisma.inventoryItem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            internalCode: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            value: true,
          },
        },
        location: {
          select: {
            aisle: true,
            shelf: true,
            level: true,
            position: true,
          },
        },
        movements: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          include: {
            user: {
              select: {
                name: true,
                lastName: true,
              },
            },
            sourceWarehouse: {
              select: {
                name: true,
              },
            },
            targetWarehouse: {
              select: {
                name: true,
              },
            },
          },
        },
        kardex: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
      },
    });

    // Calcular totales generales
    const totalStock = inventoryItems.reduce((sum, item) => sum + item.currentStock, 0);
    const availableStock = inventoryItems.reduce((sum, item) => sum + item.availableStock, 0);
    const reservedStock = inventoryItems.reduce((sum, item) => sum + item.reservedStock, 0);
    const transitStock = inventoryItems.reduce((sum, item) => sum + item.transitStock, 0);

    // Agrupar por depósito
    const byWarehouse = warehouses.map(wh => {
      const items = inventoryItems
        .filter(item => item.warehouseId === wh.id)
        .map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          sku: item.product.sku,
          variantName: item.variant ? `${item.variant.name}: ${item.variant.value}` : undefined,
          variantId: item.variant?.id,
          currentStock: item.currentStock,
          availableStock: item.availableStock,
          reservedStock: item.reservedStock,
          transitStock: item.transitStock,
          location: item.location ? {
            aisle: item.location.aisle,
            shelf: item.location.shelf,
            level: item.location.level,
            position: item.location.position,
          } : undefined,
        }));

      return {
        warehouseId: wh.id,
        warehouseName: wh.name,
        warehouseType: wh.type,
        totalStock: items.reduce((sum, item) => sum + item.currentStock, 0),
        items,
      };
    }).filter(wh => wh.items.length > 0);

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
            product: {
              select: {
                id: true,
                name: true,
              },
            },
            warehouse: {
              select: {
                name: true,
              },
            },
            variant: {
              select: {
                name: true,
                value: true,
              },
            },
          },
        },
        user: {
          select: {
            name: true,
            lastName: true,
          },
        },
        sourceWarehouse: {
          select: {
            name: true,
          },
        },
        targetWarehouse: {
          select: {
            name: true,
          },
        },
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
            product: {
              select: {
                name: true,
              },
            },
            warehouse: {
              select: {
                name: true,
              },
            },
            variant: {
              select: {
                name: true,
                value: true,
              },
            },
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
      byWarehouse,
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