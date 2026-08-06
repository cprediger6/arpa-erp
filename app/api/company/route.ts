// app/api/company/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener datos de la empresa
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const company = await prisma.company.findUnique({
      where: {
        id: session.user.companyId,
      },
      include: {
        settings: true,
        currencies: {
          where: { isActive: true },
          orderBy: { isBase: "desc" },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error al obtener empresa:", error);
    return NextResponse.json(
      { error: "Error al obtener empresa" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar datos de la empresa
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede editar la empresa
  if (session.user.role !== "ADMIN") {
    return NextResponse.json(
      { error: "No tienes permisos para editar la empresa" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const {
      name,
      ruc,
      address,
      phone,
      email,
      website,
      currency,
      timezone,
      country,
      taxRate,
      logo,
      defaultCostMethod,
      allowNegativeInventory,
      taxIncluded,
    } = body;

    // Verificar que la empresa existe
    const existing = await prisma.company.findUnique({
      where: { id: session.user.companyId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404 }
      );
    }

    // Actualizar empresa
    const company = await prisma.company.update({
      where: { id: session.user.companyId },
      data: {
        name: name || existing.name,
        ruc: ruc || existing.ruc,
        address: address !== undefined ? address : existing.address,
        currency: currency || existing.currency,
        timezone: timezone || existing.timezone,
        country: country || existing.country,
        taxRate: taxRate !== undefined ? taxRate : existing.taxRate,
      },
    });

    // Actualizar o crear settings
    if (defaultCostMethod || allowNegativeInventory !== undefined || taxIncluded !== undefined) {
      await prisma.setting.upsert({
        where: { companyId: session.user.companyId },
        update: {
          defaultCostMethod: defaultCostMethod || "FIFO",
          allowNegativeInventory: allowNegativeInventory ?? false,
          taxIncluded: taxIncluded ?? false,
          currency: currency || existing.currency,
          timezone: timezone || existing.timezone,
        },
        create: {
          companyId: session.user.companyId,
          defaultCostMethod: defaultCostMethod || "FIFO",
          allowNegativeInventory: allowNegativeInventory ?? false,
          taxIncluded: taxIncluded ?? false,
          currency: currency || existing.currency,
          timezone: timezone || existing.timezone,
        },
      });
    }

    // Registrar auditoría
    await prisma.audit.create({
      data: {
        userId: session.user.id,
        action: "UPDATE",
        module: "COMPANY",
        recordId: company.id,
        before: existing,
        after: company,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      },
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Error al actualizar empresa:", error);
    return NextResponse.json(
      { error: "Error al actualizar empresa" },
      { status: 500 }
    );
  }
}