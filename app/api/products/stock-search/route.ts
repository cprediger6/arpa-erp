// app/api/products/stock-search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const includeStock = searchParams.get("includeStock") === "true";

    const products = await prisma.product.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { sku: { contains: search, mode: "insensitive" } },
          { barcode: { contains: search, mode: "insensitive" } },
          { model: { contains: search, mode: "insensitive" } },
          { brand: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        category: true,
        variants: true,
        inventory: {
          where: {
            warehouse: {
              isActive: true,
            },
          },
          include: {
            warehouse: true,
          },
        },
      },
      take: 20,
    });

    // Si se solicita incluir stock, devolver información detallada
    if (includeStock) {
      const results = products.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        barcode: product.barcode,
        images: product.images,
        category: product.category,
        variants: product.variants,
        inventory: product.inventory.map((inv) => ({
          currentStock: inv.currentStock,
          availableStock: inv.availableStock,
          reservedStock: inv.reservedStock,
          warehouse: {
            id: inv.warehouse.id,
            name: inv.warehouse.name,
          },
        })),
      }));

      return NextResponse.json(results);
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error en búsqueda de stock:", error);
    return NextResponse.json(
      { error: "Error al buscar productos" },
      { status: 500 }
    );
  }
}