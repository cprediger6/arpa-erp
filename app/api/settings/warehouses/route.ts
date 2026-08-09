// app/api/settings/warehouses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener todos los depósitos
export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const warehouses = await prisma.warehouse.findMany({
      where: {
        companyId: session.user.companyId,
      },
      include: {
        locations: {
          include: {
            _count: {
              select: {
                inventory: true,
              },
            },
          },
        },
        _count: {
          select: {
            inventory: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(warehouses);
  } catch (error) {
    console.error("Error al obtener depósitos:", error);
    return NextResponse.json(
      { error: "Error al obtener depósitos" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo depósito
export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, type, address, phone, email, isActive } = body;

    // Validar datos requeridos
    if (!name || !type) {
      return NextResponse.json(
        { error: "Nombre y tipo son requeridos" },
        { status: 400 }
      );
    }

    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        type,
        address: address || null,
        phone: phone || null,
        email: email || null,
        isActive: isActive ?? true,
        companyId: session.user.companyId,
      },
    });

    return NextResponse.json(warehouse);
  } catch (error) {
    console.error("Error al crear depósito:", error);
    return NextResponse.json(
      { error: "Error al crear depósito" },
      { status: 500 }
    );
  }
}