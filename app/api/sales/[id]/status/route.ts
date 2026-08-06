// app/api/sales/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

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
    const { status } = body;

    // Verificar que la venta existe
    const sale = await prisma.sale.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar permisos
    const allowedRoles = ["ADMIN", "SUPERVISOR", "SALES"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tienes permisos para cambiar el estado" },
        { status: 403 }
      );
    }

    // Si es SALES, no puede cambiar a COLLECTED o CANCELLED
    if (session.user.role === "SALES") {
      if (status === "COLLECTED" || status === "CANCELLED") {
        return NextResponse.json(
          { error: "No tienes permisos para este cambio de estado" },
          { status: 403 }
        );
      }
    }

    // Validar estado
    const validStatuses = ["PENDING", "QUOTE", "ORDER", "RESERVED", "INVOICED", "DELIVERED", "COLLECTED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Estado inválido" },
        { status: 400 }
      );
    }

    // Actualizar estado
    const updatedSale = await prisma.sale.update({
      where: { id },
      data: { status },
    });

    // Registrar auditoría
    await prisma.audit.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_STATUS",
        module: "SALES",
        recordId: updatedSale.id,
        before: { status: sale.status },
        after: { status: updatedSale.status },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado" },
      { status: 500 }
    );
  }
}