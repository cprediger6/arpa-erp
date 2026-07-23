// app/api/sales/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "";
    const clientId = searchParams.get("clientId") || "";

    const where: any = {
      companyId: session.user.companyId,
    };

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const sales = await prisma.sale.findMany({
      where,
      include: {
        client: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        details: {
          include: {
            product: true,
            variant: true,
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return NextResponse.json(
      { error: "Error al obtener ventas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      clientId,
      status,
      saleDate,
      deliveryDate,
      details,
      subtotal,
      discount,
      tax,
      total,
      notes,
    } = body;

    // Validaciones básicas
    if (!clientId) {
      return NextResponse.json(
        { error: "El cliente es requerido" },
        { status: 400 }
      );
    }

    if (!details || details.length === 0) {
      return NextResponse.json(
        { error: "La venta debe tener al menos un producto" },
        { status: 400 }
      );
    }

    // Generar número de venta
    const lastSale = await prisma.sale.findFirst({
      where: { companyId: session.user.companyId },
      orderBy: { number: "desc" },
    });

    const nextNumber = lastSale 
      ? (parseInt(lastSale.number.split('-')[1] || '0') + 1).toString().padStart(6, '0')
      : '000001';
    const number = `VEN-${nextNumber}`;

    // Crear la venta
    const sale = await prisma.sale.create({
      data: {
        number,
        status: status || "PENDING",
        clientId,
        userId: session.user.id,
        companyId: session.user.companyId,
        saleDate: saleDate ? new Date(saleDate) : new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        subtotal: subtotal || 0,
        discount: discount || 0,
        tax: tax || 0,
        total: total || 0,
        notes: notes || null,
        details: {
          create: details.map((detail: any) => ({
            productId: detail.productId,
            variantId: detail.variantId || null,
            quantity: detail.quantity,
            unitPrice: detail.unitPrice,
            discount: detail.discount || 0,
            total: (detail.unitPrice * detail.quantity) - (detail.discount || 0),
          })),
        },
      },
      include: {
        client: true,
        details: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    // Registrar auditoría
    await prisma.audit.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "SALES",
        recordId: sale.id,
        after: sale,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Error al crear venta:", error);
    return NextResponse.json(
      { error: "Error al crear venta" },
      { status: 500 }
    );
  }
}