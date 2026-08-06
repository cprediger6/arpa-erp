// app/api/settings/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener configuración de reportes
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede ver configuración de reportes
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para ver esta configuración" },
      { status: 403 }
    );
  }

  try {
    // Buscar configuración existente o crear por defecto
    let settings = await prisma.setting.findUnique({
      where: { companyId: session.user.companyId },
    });

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          companyId: session.user.companyId,
          defaultCostMethod: "FIFO",
          allowNegativeInventory: false,
          taxIncluded: false,
          currency: "USD",
          timezone: "UTC",
        },
      });
    }

    // Reportes disponibles del sistema
    const reports = [
      {
        id: "sales-report",
        name: "Reporte de Ventas",
        description: "Análisis detallado de ventas por período",
        category: "Ventas",
        icon: "DollarSign",
        defaultEnabled: true,
      },
      {
        id: "purchases-report",
        name: "Reporte de Compras",
        description: "Análisis de compras y proveedores",
        category: "Compras",
        icon: "ShoppingCart",
        defaultEnabled: true,
      },
      {
        id: "inventory-report",
        name: "Reporte de Inventario",
        description: "Estado y valorización del inventario",
        category: "Inventario",
        icon: "Package",
        defaultEnabled: true,
      },
      {
        id: "profit-report",
        name: "Reporte de Ganancias",
        description: "Análisis de rentabilidad y márgenes",
        category: "Financiero",
        icon: "TrendingUp",
        defaultEnabled: true,
      },
      {
        id: "clients-report",
        name: "Reporte de Clientes",
        description: "Análisis de clientes y compras",
        category: "Clientes",
        icon: "Users",
        defaultEnabled: true,
      },
      {
        id: "suppliers-report",
        name: "Reporte de Proveedores",
        description: "Análisis de proveedores y compras",
        category: "Compras",
        icon: "Truck",
        defaultEnabled: false,
      },
      {
        id: "tax-report",
        name: "Reporte de Impuestos",
        description: "Resumen de impuestos pagados y cobrados",
        category: "Financiero",
        icon: "Receipt",
        defaultEnabled: false,
      },
      {
        id: "products-report",
        name: "Reporte de Productos",
        description: "Análisis de productos más y menos vendidos",
        category: "Productos",
        icon: "Package",
        defaultEnabled: true,
      },
    ];

    // Obtener configuración de reportes de la base de datos
    let reportSettings = await prisma.reportSetting.findMany({
      where: { companyId: session.user.companyId },
    });

    // Si no hay configuración, crear por defecto
    if (reportSettings.length === 0) {
      const defaultReports = reports.map(r => ({
        companyId: session.user.companyId,
        reportId: r.id,
        enabled: r.defaultEnabled,
        config: {},
      }));
      
      await prisma.reportSetting.createMany({
        data: defaultReports,
      });
      
      reportSettings = await prisma.reportSetting.findMany({
        where: { companyId: session.user.companyId },
      });
    }

    // Combinar datos
    const reportConfigs = reports.map(report => {
      const setting = reportSettings.find(s => s.reportId === report.id);
      return {
        ...report,
        enabled: setting?.enabled ?? report.defaultEnabled,
        config: setting?.config || {},
      };
    });

    return NextResponse.json({
      reports: reportConfigs,
      settings: {
        defaultCurrency: settings.currency,
        defaultTimezone: settings.timezone,
        defaultCostMethod: settings.defaultCostMethod,
        allowNegativeInventory: settings.allowNegativeInventory,
        taxIncluded: settings.taxIncluded,
      },
    });
  } catch (error) {
    console.error("Error al obtener configuración de reportes:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración de reportes
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para modificar esta configuración" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { reports, settings } = body;

    // Actualizar configuración de reportes
    if (reports && Array.isArray(reports)) {
      for (const report of reports) {
        await prisma.reportSetting.upsert({
          where: {
            companyId_reportId: {
              companyId: session.user.companyId,
              reportId: report.id,
            },
          },
          update: {
            enabled: report.enabled,
            config: report.config || {},
          },
          create: {
            companyId: session.user.companyId,
            reportId: report.id,
            enabled: report.enabled,
            config: report.config || {},
          },
        });
      }
    }

    // Actualizar configuración general
    if (settings) {
      await prisma.setting.update({
        where: { companyId: session.user.companyId },
        data: {
          currency: settings.defaultCurrency,
          timezone: settings.defaultTimezone,
          defaultCostMethod: settings.defaultCostMethod,
          allowNegativeInventory: settings.allowNegativeInventory,
          taxIncluded: settings.taxIncluded,
        },
      });
    }

    return NextResponse.json({ message: "Configuración actualizada exitosamente" });
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    return NextResponse.json(
      { error: "Error al actualizar configuración" },
      { status: 500 }
    );
  }
}