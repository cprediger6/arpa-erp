// app/api/settings/locations/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// PUT - Actualizar ubicación
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { aisle, shelf, level, position, barcode, warehouseId } = body;

    // Verificar que la ubicación pertenece a la empresa
    const existing = await prisma.location.findFirst({
      where: {
        id,
        warehouse: {
          companyId: session.user.companyId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    const location = await prisma.location.update({
      where: { id },
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
    console.error("Error al actualizar ubicación:", error);
    return NextResponse.json(
      { error: "Error al actualizar ubicación" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar ubicación
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = params;

    // Verificar que la ubicación pertenece a la empresa
    const existing = await prisma.location.findFirst({
      where: {
        id,
        warehouse: {
          companyId: session.user.companyId,
        },
      },
      include: {
        _count: {
          select: {
            inventory: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Ubicación no encontrada" },
        { status: 404 }
      );
    }

    if (existing._count.inventory > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar una ubicación con inventario" },
        { status: 400 }
      );
    }

    await prisma.location.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar ubicación:", error);
    return NextResponse.json(
      { error: "Error al eliminar ubicación" },
      { status: 500 }
    );
  }
}