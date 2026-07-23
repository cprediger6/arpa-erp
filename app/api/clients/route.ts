// app/api/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener todos los clientes
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const clients = await prisma.client.findMany({
      where: {
        companyId: session.user.companyId,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { ruc: { contains: search, mode: "insensitive" } },
        ],
      },
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return NextResponse.json(
      { error: "Error al obtener clientes" },
      { status: 500 }
    );
  }
}

// POST - Crear un nuevo cliente
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      ruc, 
      address, 
      contactPerson, 
      creditLimit, 
      paymentTerms,
      isActive 
    } = body;

    // Validaciones
    if (!name) {
      return NextResponse.json(
        { error: "El nombre del cliente es requerido" },
        { status: 400 }
      );
    }

    // Verificar si ya existe un cliente con ese RUC
    if (ruc) {
      const existing = await prisma.client.findFirst({
        where: {
          ruc,
          companyId: session.user.companyId,
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Ya existe un cliente con ese RUC" },
          { status: 400 }
        );
      }
    }

    const client = await prisma.client.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        ruc: ruc || null,
        address: address || null,
        contactPerson: contactPerson || null,
        creditLimit: creditLimit || null,
        paymentTerms: paymentTerms || null,
        isActive: isActive ?? true,
        companyId: session.user.companyId,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return NextResponse.json(
      { error: "Error al crear cliente" },
      { status: 500 }
    );
  }
}