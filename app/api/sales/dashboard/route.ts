// app/api/sales/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));

    // 📊 Obtener ventas del vendedor actual
    const sales = await prisma.sale.findMany({
      where: {
        userId: session.user.id,
        companyId: session.user.companyId,
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        details: {
          include: {
            product: true,
          },
        },
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 📈 Ventas del mes actual
    const currentMonthSales = sales.filter(
      (sale) => new Date(sale.createdAt) >= startOfCurrentMonth
    );

    // 📉 Ventas del mes anterior
    const lastMonthSales = sales.filter(
      (sale) =>
        new Date(sale.createdAt) >= startOfLastMonth &&
        new Date(sale.createdAt) < startOfCurrentMonth
    );

    // 💰 Total ventas
    const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
    const totalCurrentMonth = currentMonthSales.reduce((acc, sale) => acc + sale.total, 0);
    const totalLastMonth = lastMonthSales.reduce((acc, sale) => acc + sale.total, 0);

    // 📊 Ventas por mes (últimos 6 meses)
    const monthlySales = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      const monthSales = sales.filter(
        (sale) =>
          new Date(sale.createdAt) >= start &&
          new Date(sale.createdAt) <= end
      );

      monthlySales.push({
        month: format(month, "MMM", { locale: es }),
        value: monthSales.reduce((acc, sale) => acc + sale.total, 0),
        count: monthSales.length,
      });
    }

    // 🏆 Top 5 productos más vendidos
    const productSales = new Map();
    sales.forEach((sale) => {
      sale.details.forEach((detail) => {
        const key = detail.productId;
        if (!productSales.has(key)) {
          productSales.set(key, {
            name: detail.product.name,
            quantity: 0,
            total: 0,
          });
        }
        const current = productSales.get(key);
        current.quantity += detail.quantity;
        current.total += detail.total;
        productSales.set(key, current);
      });
    });

    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 📊 Estado de las ventas
    const statusCount = {
      PENDING: sales.filter((s) => s.status === "PENDING").length,
      QUOTE: sales.filter((s) => s.status === "QUOTE").length,
      ORDER: sales.filter((s) => s.status === "ORDER").length,
      RESERVED: sales.filter((s) => s.status === "RESERVED").length,
      INVOICED: sales.filter((s) => s.status === "INVOICED").length,
      DELIVERED: sales.filter((s) => s.status === "DELIVERED").length,
      COLLECTED: sales.filter((s) => s.status === "COLLECTED").length,
    };

    // 📈 Crecimiento porcentual
    const growth = totalLastMonth > 0
      ? ((totalCurrentMonth - totalLastMonth) / totalLastMonth) * 100
      : 0;

    // 🏅 Productividad del vendedor
    const productivity = {
      totalSales: sales.length,
      totalRevenue: totalSales,
      averageTicket: sales.length > 0 ? totalSales / sales.length : 0,
      uniqueClients: new Set(sales.map((s) => s.clientId)).size,
      conversionRate: sales.length > 0 ? (sales.filter((s) => s.status === "COLLECTED").length / sales.length) * 100 : 0,
    };

    return NextResponse.json({
      summary: {
        totalSales: totalSales,
        currentMonth: totalCurrentMonth,
        lastMonth: totalLastMonth,
        growth: growth,
        totalOrders: sales.length,
        pendingOrders: statusCount.PENDING,
        completedOrders: statusCount.COLLECTED,
      },
      monthlySales,
      topProducts,
      statusCount,
      productivity,
      recentSales: sales.slice(0, 10),
    });
  } catch (error) {
    console.error("Error en dashboard de ventas:", error);
    return NextResponse.json(
      { error: "Error al obtener datos del dashboard" },
      { status: 500 }
    );
  }
}