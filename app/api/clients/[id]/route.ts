// app/api/clients/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener un cliente específico
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

    const client = await prisma.client.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        sales: {
          include: {
            details: {
              include: {
                product: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
        },
        contacts: true,
        documents: true,
        _count: {
          select: {
            sales: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    return NextResponse.json(
      { error: "Error al obtener cliente" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar cliente
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

    // Verificar que el cliente existe
    const existing = await prisma.client.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si el RUC ya está en uso por otro cliente
    if (ruc) {
      const duplicate = await prisma.client.findFirst({
        where: {
          ruc,
          companyId: session.user.companyId,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "Ya existe un cliente con ese RUC" },
          { status: 400 }
        );
      }
    }

    const client = await prisma.client.update({
      where: { id },
      data: {
        name: name || existing.name,
        email: email !== undefined ? email : existing.email,
        phone: phone !== undefined ? phone : existing.phone,
        ruc: ruc !== undefined ? ruc : existing.ruc,
        address: address !== undefined ? address : existing.address,
        contactPerson: contactPerson !== undefined ? contactPerson : existing.contactPerson,
        creditLimit: creditLimit !== undefined ? creditLimit : existing.creditLimit,
        paymentTerms: paymentTerms !== undefined ? paymentTerms : existing.paymentTerms,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return NextResponse.json(
      { error: "Error al actualizar cliente" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar cliente
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

    // Verificar que el cliente existe
    const client = await prisma.client.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        _count: {
          select: {
            sales: true,
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Cliente no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si tiene ventas asociadas
    if (client._count.sales > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar el cliente porque tiene ventas asociadas" },
        { status: 400 }
      );
    }

    await prisma.client.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Cliente eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar cliente:", error);
    return NextResponse.json(
      { error: "Error al eliminar cliente" },
      { status: 500 }
    );
  }
}