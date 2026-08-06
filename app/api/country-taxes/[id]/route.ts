// app/api/country-taxes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// PUT - Actualizar impuesto por país
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para editar impuestos" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { country, taxName, taxRate, description, isActive } = body;

    const tax = await prisma.countryTax.update({
      where: { id },
      data: {
        country,
        taxName,
        taxRate,
        description: description || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(tax);
  } catch (error) {
    console.error("Error al actualizar impuesto:", error);
    return NextResponse.json(
      { error: "Error al actualizar impuesto" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar impuesto por país
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para eliminar impuestos" },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;

    await prisma.countryTax.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Impuesto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar impuesto:", error);
    return NextResponse.json(
      { error: "Error al eliminar impuesto" },
      { status: 500 }
    );
  }
}