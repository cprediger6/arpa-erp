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
    const limit = parseInt(searchParams.get("limit") || "100");

    const where: any = {
      companyId: session.user.companyId,
    };

    if (session.user.role === "SALES") {
      where.userId = session.user.id;
    }

    if (status) where.status = status;
    if (clientId) where.clientId = clientId;

    const sales = await prisma.sale.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            ruc: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        details: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                value: true,
              },
            },
          },
        },
        payments: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    const summary = {
      totalSales: sales.length,
      totalAmount: sales.reduce((sum, sale) => sum + sale.total, 0),
      totalTax: sales.reduce((sum, sale) => sum + sale.tax, 0),
      statusCounts: {
        PENDING: sales.filter(s => s.status === "PENDING").length,
        COLLECTED: sales.filter(s => s.status === "COLLECTED").length,
        DELIVERED: sales.filter(s => s.status === "DELIVERED").length,
        CANCELLED: sales.filter(s => s.status === "CANCELLED").length,
      }
    };

    return NextResponse.json({
      data: sales,
      summary,
    });
  } catch (error) {
    console.error("Error al obtener ventas:", error);
    return NextResponse.json(
      { error: "Error al obtener ventas" },
      { status: 500 }
    );
  }
}

// app/api/sales/route.ts - Sección POST

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const allowedRoles = ["ADMIN", "SUPERVISOR", "SALES"];
  if (!allowedRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: "No tienes permisos para crear ventas" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      clientId,
      userId,
      saleDate,
      deliveryDate,
      details,
      subtotal,
      discount,
      notes,
      paymentMethod,
      paymentReference,
      transactionCode,
    } = body;

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

    // ✅ Método de pago obligatorio
    if (!paymentMethod) {
      return NextResponse.json(
        { error: "Debes seleccionar un método de pago" },
        { status: 400 }
      );
    }

    const digitalMethods = ["CREDIT_CARD", "DEBIT_CARD", "TRANSFER", "DIGITAL_WALLET"];
    if (digitalMethods.includes(paymentMethod) && !transactionCode) {
      return NextResponse.json(
        { error: "El código de transacción es requerido para pagos digitales" },
        { status: 400 }
      );
    }

    // ✅ Verificar stock y obtener/crear inventario
    const defaultWarehouse = await prisma.warehouse.findFirst({
      where: {
        companyId: session.user.companyId,
        isActive: true,
      },
    });

    if (!defaultWarehouse) {
      return NextResponse.json(
        { error: "No hay almacenes disponibles. Contacta al administrador." },
        { status: 400 }
      );
    }

    // ✅ Verificar stock antes de la transacción
    for (const detail of details) {
      let inventoryItem = await prisma.inventoryItem.findFirst({
        where: {
          productId: detail.productId,
          variantId: detail.variantId || null,
        },
      });

      if (!inventoryItem) {
        inventoryItem = await prisma.inventoryItem.create({
          data: {
            productId: detail.productId,
            variantId: detail.variantId || null,
            warehouseId: defaultWarehouse.id,
            currentStock: 0,
            availableStock: 0,
            reservedStock: 0,
            transitStock: 0,
            costMethod: "AVERAGE",
          },
        });
      }

      if (inventoryItem.availableStock < detail.quantity) {
        return NextResponse.json(
          { error: `Stock insuficiente para el producto. Disponible: ${inventoryItem.availableStock}, Requerido: ${detail.quantity}` },
          { status: 400 }
        );
      }
    }

    // ✅ Verificar código de transacción duplicado ANTES de la transacción
    if (digitalMethods.includes(paymentMethod) && transactionCode) {
      const existingPayment = await prisma.payment.findFirst({
        where: {
          reference: transactionCode,
        },
      });

      if (existingPayment) {
        return NextResponse.json(
          { error: "El código de transacción ya fue utilizado" },
          { status: 400 }
        );
      }
    }

    // Obtener la empresa y su configuración
    const company = await prisma.company.findUnique({
      where: { id: session.user.companyId },
      include: {
        settings: true,
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Obtener el impuesto según el país de la empresa
    const countryTax = await prisma.countryTax.findUnique({
      where: { country: company.country || "Panama" },
    });

    // Calcular impuestos
    const taxIncluded = company?.settings?.taxIncluded || false;
    let taxAmount = 0;
    let taxRate = 0;
    let taxName = "";

    if (countryTax && !taxIncluded) {
      taxRate = countryTax.taxRate;
      taxName = countryTax.taxName;
      const taxableAmount = subtotal - discount;
      taxAmount = (taxableAmount * taxRate) / 100;
    }

    const total = subtotal - discount + taxAmount;

    // ✅ Generar número de venta consecutivo
    const lastSale = await prisma.sale.findFirst({
      where: { companyId: session.user.companyId },
      orderBy: { number: "desc" },
    });

    let nextNumber = "000001";
    if (lastSale) {
      const lastNumber = lastSale.number.split('-')[1];
      if (lastNumber) {
        const num = parseInt(lastNumber, 10);
        if (!isNaN(num)) {
          nextNumber = (num + 1).toString().padStart(6, '0');
        }
      }
    }
    const number = `VEN-${nextNumber}`;

    // ✅ TRANSACCIÓN: Crear venta, actualizar inventario y registrar pago
    const result = await prisma.$transaction(async (tx) => {
      // 1. Crear la venta
      const sale = await tx.sale.create({
        data: {
          number,
          status: paymentMethod ? "COLLECTED" : "PENDING",
          clientId,
          userId: userId || session.user.id,
          companyId: session.user.companyId,
          saleDate: saleDate ? new Date(saleDate) : new Date(),
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
          subtotal: subtotal || 0,
          discount: discount || 0,
          tax: taxAmount,
          taxName: taxName,
          taxRate: taxRate,
          taxAmount: taxAmount,
          total: total,
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
          client: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              ruc: true,
            },
          },
          details: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
              variant: {
                select: {
                  id: true,
                  name: true,
                  value: true,
                },
              },
            },
          },
        },
      });

      // 2. ✅ Actualizar inventario
      for (const detail of details) {
        let inventoryItem = await tx.inventoryItem.findFirst({
          where: {
            productId: detail.productId,
            variantId: detail.variantId || null,
          },
        });

        if (!inventoryItem) {
          inventoryItem = await tx.inventoryItem.create({
            data: {
              productId: detail.productId,
              variantId: detail.variantId || null,
              warehouseId: defaultWarehouse.id,
              currentStock: 0,
              availableStock: 0,
              reservedStock: 0,
              transitStock: 0,
              costMethod: "AVERAGE",
            },
          });
        }

        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: {
            currentStock: {
              decrement: detail.quantity,
            },
            availableStock: {
              decrement: detail.quantity,
            },
          },
        });

        await tx.inventoryMovement.create({
          data: {
            type: "EXIT",
            quantity: detail.quantity,
            unitCost: inventoryItem.lastCost || 0,
            totalCost: (inventoryItem.lastCost || 0) * detail.quantity,
            description: `Venta ${number}`,
            inventoryItemId: inventoryItem.id,
            userId: session.user.id,
          },
        });

        const movement = await tx.inventoryMovement.findFirst({
          where: {
            inventoryItemId: inventoryItem.id,
            description: `Venta ${number}`,
          },
          orderBy: { createdAt: "desc" },
        });

        if (movement) {
          await tx.kardex.create({
            data: {
              movementId: movement.id,
              inventoryItemId: inventoryItem.id,
              quantityIn: 0,
              quantityOut: detail.quantity,
              balance: inventoryItem.currentStock - detail.quantity,
              unitCost: inventoryItem.lastCost || 0,
              totalCost: (inventoryItem.lastCost || 0) * detail.quantity,
              balanceCost: (inventoryItem.lastCost || 0) * (inventoryItem.currentStock - detail.quantity),
            },
          });
        }
      }

      // 3. ✅ Registrar pago (DENTRO de la transacción)
      if (paymentMethod) {
        await tx.payment.create({
          data: {
            type: paymentMethod,
            amount: total,
            reference: transactionCode || paymentReference || null,
            paymentDate: new Date(),
            saleId: sale.id,
          },
        });

        // Actualizar estado a COLLECTED
        await tx.sale.update({
          where: { id: sale.id },
          data: { status: "COLLECTED" },
        });
      }

      return sale;
    });

    // ✅ Auditoría (fuera de la transacción para no bloquear)
    await prisma.audit.create({
      data: {
        userId: session.user.id,
        action: "CREATE",
        module: "SALES",
        recordId: result.id,
        after: result,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json({
      message: "Venta creada exitosamente",
      sale: result,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error al crear venta:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear venta" },
      { status: 500 }
    );
  }
}