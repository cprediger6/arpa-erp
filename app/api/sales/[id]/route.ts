// app/api/sales/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener una venta específica
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

    const sale = await prisma.sale.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
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
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
            variant: true,
          },
        },
        payments: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que el usuario tenga acceso a esta venta
    if (session.user.role === "SALES" && sale.userId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes acceso a esta venta" },
        { status: 403 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error al obtener venta:", error);
    return NextResponse.json(
      { error: "Error al obtener venta" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar una venta
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

    // Solo ADMIN y SUPERVISOR pueden eliminar
    const allowedRoles = ["ADMIN", "SUPERVISOR"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar ventas" },
        { status: 403 }
      );
    }

    // Solo se pueden eliminar ventas pendientes
    if (sale.status !== "PENDING") {
      return NextResponse.json(
        { error: "Solo se pueden eliminar ventas pendientes" },
        { status: 400 }
      );
    }

    // Eliminar venta (los detalles se eliminan en cascada)
    await prisma.sale.delete({
      where: { id },
    });

    // Registrar auditoría
    await prisma.audit.create({
      data: {
        userId: session.user.id,
        action: "DELETE",
        module: "SALES",
        recordId: id,
        before: sale,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({ message: "Venta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar venta:", error);
    return NextResponse.json(
      { error: "Error al eliminar venta" },
      { status: 500 }
    );
  }
}