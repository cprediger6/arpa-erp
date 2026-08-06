// app/api/warehouses/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const warehouses = await prisma.warehouse.findMany({
      where: {
        companyId: session.user.companyId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            inventory: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(warehouses);
  } catch (error) {
    console.error("Error al obtener almacenes:", error);
    return NextResponse.json(
      { error: "Error al obtener almacenes" },
      { status: 500 }
    );
  }
}