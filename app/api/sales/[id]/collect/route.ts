// app/api/sales/[id]/collect/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export async function POST(
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
    const { paymentMethod, transactionCode, amount, reference } = body;

    // Verificar que la venta existe
    const sale = await prisma.sale.findFirst({
      where: {
        id,
        companyId: session.user.companyId,
      },
      include: {
        client: true,
        company: true,
      },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Venta no encontrada" },
        { status: 404 }
      );
    }

    // Verificar que la venta esté en estado INVOICED o DELIVERED
    if (sale.status !== "INVOICED" && sale.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "La venta debe estar facturada o entregada para cobrar" },
        { status: 400 }
      );
    }

    // Validar método de pago
    const validPaymentMethods = ["CASH", "CREDIT_CARD", "DEBIT_CARD", "TRANSFER", "DIGITAL_WALLET"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { error: "Método de pago inválido" },
        { status: 400 }
      );
    }

    // Para pagos digitales, validar código de transacción
    const digitalMethods = ["CREDIT_CARD", "DEBIT_CARD", "TRANSFER", "DIGITAL_WALLET"];
    if (digitalMethods.includes(paymentMethod) && !transactionCode) {
      return NextResponse.json(
        { error: "El código de transacción es requerido para pagos digitales" },
        { status: 400 }
      );
    }

    // Para pagos digitales, verificar que el código no esté duplicado
    if (digitalMethods.includes(paymentMethod) && transactionCode) {
      const existingPayment = await prisma.payment.findFirst({
        where: {
          reference: transactionCode,
          saleId: { not: id },
        },
      });

      if (existingPayment) {
        return NextResponse.json(
          { error: "El código de transacción ya fue utilizado" },
          { status: 400 }
        );
      }
    }

    // Calcular monto a cobrar (si no se especifica, cobrar el total)
    const amountToCollect = amount || sale.total;

    // Crear el pago
    const payment = await prisma.payment.create({
      data: {
        type: paymentMethod,
        amount: amountToCollect,
        reference: transactionCode || reference || null,
        paymentDate: new Date(),
        saleId: sale.id,
      },
    });

    // Verificar si el pago cubre el total
    const totalPaid = await prisma.payment.aggregate({
      where: { saleId: sale.id },
      _sum: { amount: true },
    });

    const totalPaidAmount = totalPaid._sum.amount || 0;

    // Si el pago cubre el total, cambiar estado a COLLECTED
    let statusUpdate = {};
    if (totalPaidAmount >= sale.total) {
      statusUpdate = { status: "COLLECTED" };
    }

    // Actualizar la venta
    const updatedSale = await prisma.sale.update({
      where: { id: sale.id },
      data: statusUpdate,
      include: {
        client: true,
        payments: true,
      },
    });

    // Registrar auditoría
    await prisma.audit.create({
      data: {
        userId: session.user.id,
        action: "COLLECT",
        module: "SALES",
        recordId: sale.id,
        before: { status: sale.status, total: sale.total },
        after: { status: updatedSale.status, payment: payment },
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      sale: updatedSale,
      payment,
      message: totalPaidAmount >= sale.total 
        ? "Venta cobrada completamente" 
        : "Pago registrado parcialmente",
    });
  } catch (error) {
    console.error("Error al procesar cobro:", error);
    return NextResponse.json(
      { error: "Error al procesar cobro" },
      { status: 500 }
    );
  }
}