// app/api/sales/[id]/cancel/route.ts
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

  // ✅ Solo ADMIN puede cancelar ventas
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para cancelar ventas. Solo ADMIN puede hacerlo." },
      { status: 403 }
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { cancellationReason } = body;

    // Verificar que la venta existe
    const sale = await prisma.sale.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        details: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // No se puede cancelar una venta ya cobrada
    if (sale.status === "COLLECTED") {
      return NextResponse.json(
        { error: "No se puede cancelar una venta ya cobrada" },
        { status: 400 }
      );
    }

    // No se puede cancelar una venta ya cancelada
    if (sale.status === "CANCELLED") {
      return NextResponse.json(
        { error: "La venta ya está cancelada" },
        { status: 400 }
      );
    }

    // Restaurar inventario (solo si se descontó)
    if (sale.status !== "PENDING") {
      for (const detail of sale.details) {
        const inventoryItem = await prisma.inventoryItem.findFirst({
          where: {
            productId: detail.productId,
          },
        });

        if (inventoryItem) {
          await prisma.inventoryItem.update({
            where: { id: inventoryItem.id },
            data: {
              currentStock: {
                increment: detail.quantity,
              },
              availableStock: {
                increment: detail.quantity,
              },
            },
          });

          await prisma.inventoryMovement.create({
            data: {
              type: "RETURN",
              quantity: detail.quantity,
              unitCost: 0,
              totalCost: 0,
              description: `Cancelación de venta ${sale.number}`,
              inventoryItemId: inventoryItem.id,
              userId: session.user.id,
            },
          });
        }
      }
    }

    // Actualizar estado a CANCELLED
    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        status: "CANCELLED",
        notes: sale.notes 
          ? `${sale.notes}\nCancelado: ${cancellationReason || 'Sin motivo especificado'}`
          : `Cancelado: ${cancellationReason || 'Sin motivo especificado'}`,
      },
    });

    // Registrar auditoría
    await prisma.audit.create({
      data: {
        userId: session.user.id,
        action: "CANCEL",
        module: "SALES",
        recordId: updatedSale.id,
        before: { status: sale.status },
        after: { status: "CANCELLED", reason: cancellationReason },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      message: "Venta cancelada exitosamente",
      sale: updatedSale,
    });
  } catch (error) {
    console.error("Error al cancelar venta:", error);
    return NextResponse.json(
      { error: "Error al cancelar venta" },
      { status: 500 }
    );
  }
}