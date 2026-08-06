// app/api/auth/login-attempts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener intentos de login
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Solo ADMIN puede ver todos los intentos
  // Otros roles solo ven sus propios intentos
  const isAdmin = session.user.role === "ADMIN";

  try {
    const where = isAdmin ? {} : { userId: session.user.id };

    const loginAttempts = await prisma.loginAttempt.findMany({
      where,
      include: isAdmin ? {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      } : undefined,
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    // Formatear datos para el frontend
    const formattedAttempts = loginAttempts.map((attempt) => ({
      id: attempt.id,
      email: attempt.email,
      ip: attempt.ipAddress,
      location: attempt.location || "Ubicación desconocida",
      timestamp: attempt.timestamp.toISOString().replace("T", " ").slice(0, 19),
      status: attempt.status as "success" | "failed" | "blocked",
    }));

    return NextResponse.json(formattedAttempts);
  } catch (error) {
    console.error("Error al obtener intentos de login:", error);
    return NextResponse.json(
      { error: "Error al obtener intentos de login" },
      { status: 500 }
    );
  }
}