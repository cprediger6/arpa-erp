// app/api/reports/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";
import { startOfMonth, endOfMonth, subMonths, format, startOfWeek, endOfWeek } from "date-fns";
import { es } from "date-fns/locale";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const allowedRoles = ["ADMIN", "ACCOUNTING"];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: "No tienes permisos para ver reportes" },
        { status: 403 }
      );
    }

    // ✅ Obtener configuración de reportes
    const reportSettings = await prisma.reportSetting.findMany({
      where: { companyId: session.user.companyId },
    });

    // ✅ Crear un mapa de reportes habilitados
    const enabledReports = new Map();
    reportSettings.forEach(setting => {
      enabledReports.set(setting.reportId, setting.enabled);
    });

    // ✅ Función para verificar si un reporte está habilitado
    const isReportEnabled = (reportId: string) => {
      // Si no hay configuración, por defecto está habilitado
      if (enabledReports.size === 0) return true;
      return enabledReports.get(reportId) !== false;
    };

    const now = new Date();
    const fromDate = startOfMonth(subMonths(now, 5));
    const toDate = endOfMonth(now);

    // Inicializar respuesta
    const response: any = {
      summary: {
        totalSales: 0,
        totalPurchases: 0,
        profit: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
      },
      monthlySales: [],
      topProducts: [],
      slowProducts: [],
      statusCount: {
        PENDING: 0,
        COLLECTED: 0,
        DELIVERED: 0,
        CANCELLED: 0,
      },
      lowStockProducts: [],
      highStockProducts: [],
      inventoryTrend: [],
      recentSales: [],
      // ✅ Indicar qué reportes están habilitados
      enabledReports: {
        sales: isReportEnabled("sales-report"),
        purchases: isReportEnabled("purchases-report"),
        inventory: isReportEnabled("inventory-report"),
        profit: isReportEnabled("profit-report"),
        clients: isReportEnabled("clients-report"),
        suppliers: isReportEnabled("suppliers-report"),
        tax: isReportEnabled("tax-report"),
        products: isReportEnabled("products-report"),
      },
    };

    // ✅ Solo ejecutar consultas si los reportes están habilitados
    const fetchSales = isReportEnabled("sales-report");
    const fetchPurchases = isReportEnabled("purchases-report");
    const fetchInventory = isReportEnabled("inventory-report");
    const fetchProducts = isReportEnabled("products-report");

    // 1. Ventas
    if (fetchSales) {
      const sales = await prisma.sale.findMany({
        where: {
          companyId: session.user.companyId,
          status: { not: "CANCELLED" },
          saleDate: {
            gte: fromDate,
            lte: toDate,
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
          saleDate: "desc",
        },
      });

      // Calcular ventas por mes
      const monthlySales = [];
      for (let i = 5; i >= 0; i--) {
        const month = subMonths(now, i);
        const start = startOfMonth(month);
        const end = endOfMonth(month);
        
        const monthSales = sales.filter(
          (sale) => new Date(sale.saleDate) >= start && new Date(sale.saleDate) <= end
        );

        monthlySales.push({
          name: format(month, "MMM", { locale: es }),
          value: monthSales.reduce((acc, sale) => acc + sale.total, 0),
          count: monthSales.length,
        });
      }

      // Top productos
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

      const slowProducts = Array.from(productSales.values())
        .sort((a, b) => a.quantity - b.quantity)
        .slice(0, 5);

      const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);

      const statusCount = {
        PENDING: sales.filter((s) => s.status === "PENDING").length,
        COLLECTED: sales.filter((s) => s.status === "COLLECTED").length,
        DELIVERED: sales.filter((s) => s.status === "DELIVERED").length,
        CANCELLED: sales.filter((s) => s.status === "CANCELLED").length,
      };

      response.summary.totalSales = totalSales;
      response.summary.totalOrders = sales.length;
      response.summary.pendingOrders = statusCount.PENDING;
      response.summary.completedOrders = statusCount.COLLECTED;
      response.summary.cancelledOrders = statusCount.CANCELLED;
      response.monthlySales = monthlySales;
      response.topProducts = topProducts;
      response.slowProducts = slowProducts;
      response.statusCount = statusCount;
      response.recentSales = sales.slice(0, 10);
    }

    // 2. Compras
    if (fetchPurchases) {
      const purchases = await prisma.purchase.findMany({
        where: {
          companyId: session.user.companyId,
          status: { not: "CANCELLED" },
          purchaseDate: {
            gte: fromDate,
            lte: toDate,
          },
        },
      });
      response.summary.totalPurchases = purchases.reduce((acc, purchase) => acc + purchase.total, 0);
    }

    // 3. Inventario y Productos
    if (fetchInventory || fetchProducts) {
      const products = await prisma.product.findMany({
        where: {
          companyId: session.user.companyId,
          isActive: true,
        },
        include: {
          inventory: {
            include: {
              warehouse: true,
            },
          },
          variants: true,
        },
      });

      response.summary.profit = response.summary.totalSales - response.summary.totalPurchases;

      // Stock crítico
      if (fetchInventory) {
        const lowStockProducts = products
          .filter((p) => {
            const totalStock = p.inventory?.reduce((sum, inv) => sum + inv.currentStock, 0) || 0;
            return totalStock < 10 && totalStock > 0;
          })
          .map((p) => ({
            name: p.name,
            sku: p.sku,
            stock: p.inventory?.reduce((sum, inv) => sum + inv.currentStock, 0) || 0,
          }))
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 10);

        const highStockProducts = products
          .filter((p) => {
            const totalStock = p.inventory?.reduce((sum, inv) => sum + inv.currentStock, 0) || 0;
            return totalStock > 100;
          })
          .map((p) => ({
            name: p.name,
            sku: p.sku,
            stock: p.inventory?.reduce((sum, inv) => sum + inv.currentStock, 0) || 0,
          }))
          .sort((a, b) => b.stock - a.stock)
          .slice(0, 5);

        response.lowStockProducts = lowStockProducts;
        response.highStockProducts = highStockProducts;

        // Tendencia de inventario
        const inventoryTrend = [];
        for (let i = 3; i >= 0; i--) {
          const week = subMonths(now, i);
          const startWeek = startOfWeek(week);
          const endWeek = endOfWeek(week);
          
          const weekSales = response.recentSales?.filter(
            (sale: any) => new Date(sale.saleDate) >= startWeek && new Date(sale.saleDate) <= endWeek
          ) || [];
          const weekTotal = weekSales.reduce((acc: number, sale: any) => acc + sale.total, 0);

          inventoryTrend.push({
            name: `Sem ${4 - i}`,
            value: weekTotal,
            count: weekSales.length,
          });
        }
        response.inventoryTrend = inventoryTrend;
      }
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("❌ Error en reportes:", error);
    return NextResponse.json(
      { error: "Error al obtener datos de reportes" },
      { status: 500 }
    );
  }
}