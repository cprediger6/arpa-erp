// app/api/currencies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener una moneda específica
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const currency = await prisma.currency.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!currency) {
      return NextResponse.json(
        { error: "Moneda no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(currency);
  } catch (error) {
    console.error("Error al obtener moneda:", error);
    return NextResponse.json(
      { error: "Error al obtener moneda" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar moneda
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, symbol, decimalPlaces, exchangeRate, isBase, isActive } = body;

    // Verificar que la moneda existe
    const currency = await prisma.currency.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!currency) {
      return NextResponse.json(
        { error: "Moneda no encontrada" },
        { status: 404 }
      );
    }

    // Si se está estableciendo como base, desmarcar las demás
    if (isBase && !currency.isBase) {
      await prisma.currency.updateMany({
        where: { companyId: session.user.companyId },
        data: { isBase: false },
      });
      
      // Actualizar la empresa
      await prisma.company.update({
        where: { id: session.user.companyId },
        data: { currency: code.toUpperCase() },
      });
    }

    const updated = await prisma.currency.update({
      where: { id },
      data: {
        code: code.toUpperCase(),
        name,
        symbol,
        decimalPlaces: decimalPlaces || 2,
        exchangeRate: exchangeRate || 1,
        isBase: isBase || false,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al actualizar moneda:", error);
    return NextResponse.json(
      { error: "Error al actualizar moneda" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar moneda
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id } = await params;

    const currency = await prisma.currency.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!currency) {
      return NextResponse.json(
        { error: "Moneda no encontrada" },
        { status: 404 }
      );
    }

    // No permitir eliminar la moneda base
    if (currency.isBase) {
      return NextResponse.json(
        { error: "No se puede eliminar la moneda base" },
        { status: 400 }
      );
    }

    await prisma.currency.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Moneda eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar moneda:", error);
    return NextResponse.json(
      { error: "Error al eliminar moneda" },
      { status: 500 }
    );
  }
}