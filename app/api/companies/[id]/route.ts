// app/api/companies/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener una empresa específica
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

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        },
        warehouses: {
          select: {
            id: true,
            name: true,
            type: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
            users: true,
            warehouses: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error al obtener empresa:", error);
    return NextResponse.json(
      { error: "Error al obtener empresa" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar empresa
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
    const { name, ruc, address, currency, timezone, country, taxRate } = body;

    // Verificar que la empresa existe
    const existing = await prisma.company.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si el RUC ya está en uso por otra empresa
    if (ruc && ruc !== existing.ruc) {
      const duplicate = await prisma.company.findUnique({
        where: { ruc },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: "Ya existe una empresa con ese RUC" },
          { status: 400 }
        );
      }
    }

    const company = await prisma.company.update({
      where: { id },
      data: {
        name: name || existing.name,
        ruc: ruc || existing.ruc,
        address: address !== undefined ? address : existing.address,
        currency: currency || existing.currency,
        timezone: timezone || existing.timezone,
        country: country || existing.country,
        taxRate: taxRate !== undefined ? taxRate : existing.taxRate,
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error al actualizar empresa:", error);
    return NextResponse.json(
      { error: "Error al actualizar empresa" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar empresa
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

    // Verificar que la empresa existe
    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            products: true,
            warehouses: true,
            purchases: true,
            sales: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Verificar si tiene datos asociados
    const hasData = company._count.users > 0 || 
                    company._count.products > 0 || 
                    company._count.warehouses > 0 ||
                    company._count.purchases > 0 ||
                    company._count.sales > 0;

    if (hasData) {
      return NextResponse.json(
        { error: "No se puede eliminar la empresa porque tiene datos asociados" },
        { status: 400 }
      );
    }

    await prisma.company.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Empresa eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar empresa:", error);
    return NextResponse.json(
      { error: "Error al eliminar empresa" },
      { status: 500 }
    );
  }
}