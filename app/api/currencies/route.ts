// app/api/currencies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener todas las monedas
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const currencies = await prisma.currency.findMany({
      where: {
        companyId: session.user.companyId,
      },
      orderBy: [
        { isBase: "desc" },
        { code: "asc" },
      ],
    });

    return NextResponse.json(currencies);
  } catch (error) {
    console.error("Error al obtener monedas:", error);
    return NextResponse.json(
      { error: "Error al obtener monedas" },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva moneda
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code, name, symbol, decimalPlaces, exchangeRate, isBase, isActive } = body;

    // Validaciones
    if (!code || !name || !symbol) {
      return NextResponse.json(
        { error: "Código, nombre y símbolo son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una moneda con ese código
    const existing = await prisma.currency.findFirst({
      where: {
        code: code.toUpperCase(),
        companyId: session.user.companyId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una moneda con ese código" },
        { status: 400 }
      );
    }

    // Si es la moneda base, desmarcar las demás
    if (isBase) {
      await prisma.currency.updateMany({
        where: { companyId: session.user.companyId },
        data: { isBase: false },
      });
    }

    const currency = await prisma.currency.create({
      data: {
        code: code.toUpperCase(),
        name,
        symbol,
        decimalPlaces: decimalPlaces || 2,
        exchangeRate: exchangeRate || 1,
        isBase: isBase || false,
        isActive: isActive ?? true,
        companyId: session.user.companyId,
      },
    });

    // Si es la moneda base, actualizar la empresa
    if (isBase) {
      await prisma.company.update({
        where: { id: session.user.companyId },
        data: { currency: code.toUpperCase() },
      });
    }

    return NextResponse.json(currency, { status: 201 });
  } catch (error) {
    console.error("Error al crear moneda:", error);
    return NextResponse.json(
      { error: "Error al crear moneda" },
      { status: 500 }
    );
  }
}