// app/api/settings/warehouses/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// PUT - Actualizar depósito
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, type, address, phone, email, isActive } = body;

    // Verificar que el warehouse existe y pertenece a la empresa
    const existing = await prisma.warehouse.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Depósito no encontrado" },
        { status: 404 }
      );
    }

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: {
        name,
        type,
        address: address || null,
        phone: phone || null,
        email: email || null,
        isActive,
      },
    });

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error("Error al actualizar depósito:", error);
    return NextResponse.json(
      { error: "Error al actualizar depósito" },
      { status: 500 }
    );
  }
}

// PATCH - Actualizar estado del depósito
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { isActive } = body;

    const warehouse = await prisma.warehouse.update({
      where: {
        id,
        companyId: session.user.companyId,
      },
      data: {
        isActive,
      },
    });

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar depósito
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    // Verificar que el warehouse existe y pertenece a la empresa
    const existing = await prisma.warehouse.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Depósito no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si tiene inventario
    const inventoryCount = await prisma.inventoryItem.count({
      where: { warehouseId: id },
    });

    if (inventoryCount > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un depósito con inventario" },
        { status: 400 }
      );
    }

    await prisma.warehouse.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar depósito:", error);
    return NextResponse.json(
      { error: "Error al eliminar depósito" },
      { status: 500 }
    );
  }
}