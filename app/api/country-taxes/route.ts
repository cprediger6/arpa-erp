// app/api/country-taxes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener todos los impuestos por país
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const taxes = await prisma.countryTax.findMany({
      where: { isActive: true },
      orderBy: { country: "asc" },
    });

    return NextResponse.json(taxes);
  } catch (error) {
    console.error("Error al obtener impuestos:", error);
    return NextResponse.json(
      { error: "Error al obtener impuestos" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo impuesto por país (solo ADMIN)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para crear impuestos" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { country, taxName, taxRate, description } = body;

    if (!country || !taxName || taxRate === undefined) {
      return NextResponse.json(
        { error: "País, nombre y tasa de impuesto son requeridos" },
        { status: 400 }
      );
    }

    const existing = await prisma.countryTax.findUnique({
      where: { country },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un impuesto para este país" },
        { status: 400 }
      );
    }

    const tax = await prisma.countryTax.create({
      data: {
        country,
        taxName,
        taxRate,
        description: description || null,
      },
    });

    return NextResponse.json(tax, { status: 201 });
  } catch (error) {
    console.error("Error al crear impuesto:", error);
    return NextResponse.json(
      { error: "Error al crear impuesto" },
      { status: 500 }
    );
  }
}