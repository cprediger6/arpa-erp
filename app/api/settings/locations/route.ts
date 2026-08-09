// app/api/settings/locations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// POST - Crear ubicación
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { warehouseId, aisle, shelf, level, position, barcode } = body;

    // Verificar que el warehouse pertenece a la empresa
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

    const location = await prisma.location.create({
      data: {
        aisle,
        shelf,
        level,
        position,
        barcode: barcode || null,
        warehouseId,
      },
    });

    return NextResponse.json(location);
  } catch (error) {
    console.error("Error al crear ubicación:", error);
    return NextResponse.json(
      { error: "Error al crear ubicación" },
      { status: 500 }
    );
  }
}