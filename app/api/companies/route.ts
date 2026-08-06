// app/api/companies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener todas las empresas
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Solo los administradores pueden ver todas las empresas
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "No tienes permisos para ver empresas" },
        { status: 403 }
      );
    }

    const companies = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            warehouses: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error("Error al obtener empresas:", error);
    return NextResponse.json(
      { error: "Error al obtener empresas" },
      { status: 500 }
    );
  }
}

// POST - Crear una nueva empresa
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Solo los administradores pueden crear empresas
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "No tienes permisos para crear empresas" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, ruc, address, currency, timezone, country, taxRate } = body;

    // Validaciones
    if (!name || !ruc) {
      return NextResponse.json(
        { error: "Nombre y RUC son requeridos" },
        { status: 400 }
      );
    }

    // Verificar si ya existe una empresa con ese RUC
    const existing = await prisma.company.findUnique({
      where: { ruc },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una empresa con ese RUC" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name,
        ruc,
        address: address || "",
        currency: currency || "USD",
        timezone: timezone || "America/Panama",
        country: country || "Panama",
        taxRate: taxRate || 0,
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Error al crear empresa:", error);
    return NextResponse.json(
      { error: "Error al crear empresa" },
      { status: 500 }
    );
  }
}