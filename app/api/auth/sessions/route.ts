// app/api/auth/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

// GET - Obtener sesiones activas
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Obtener sesiones activas del usuario
    const userSessions = await prisma.userSession.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActive: "desc" },
    });

    // Obtener IP actual
    const currentIp = request.headers.get("x-forwarded-for") || 
                     request.headers.get("x-real-ip") || 
                     "unknown";

    // Marcar la sesión actual
    const sessionsWithCurrent = userSessions.map((s) => ({
      ...s,
      isCurrent: s.ipAddress === currentIp || s.id === session.user.id,
    }));

    return NextResponse.json(sessionsWithCurrent);
  } catch (error) {
    console.error("Error al obtener sesiones:", error);
    return NextResponse.json(
      { error: "Error al obtener sesiones" },
      { status: 500 }
    );
  }
}

// DELETE - Cerrar sesión (específica o todas)
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("id");
    const action = searchParams.get("action");

    // ✅ Si action es "all", cerrar todas las sesiones
    if (action === "all") {
      // Desactivar todas las sesiones excepto la actual
      const cookieHeader = request.headers.get("cookie") || "";
      const sessionTokenMatch = cookieHeader.match(/next-auth.session-token=([^;]+)/);
      const currentSessionToken = sessionTokenMatch?.[1] || "";

      await prisma.userSession.updateMany({
        where: {
          userId: session.user.id,
          isActive: true,
          sessionToken: { not: currentSessionToken },
        },
        data: { isActive: false },
      });

      return NextResponse.json({ success: true, message: "Todas las sesiones cerradas" });
    }

    // ✅ Si hay sessionId, cerrar una sesión específica
    if (sessionId) {
      // Verificar que la sesión pertenece al usuario
      const userSession = await prisma.userSession.findFirst({
        where: {
          id: sessionId,
          userId: session.user.id,
        },
      });

      if (!userSession) {
        return NextResponse.json(
          { error: "Sesión no encontrada" },
          { status: 404 }
        );
      }

      // Desactivar la sesión
      await prisma.userSession.update({
        where: { id: sessionId },
        data: { isActive: false },
      });

      return NextResponse.json({ success: true, message: "Sesión cerrada" });
    }

    // ✅ Si no se especifica nada, devolver error
    return NextResponse.json(
      { error: "Se requiere un ID de sesión o action=all" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error al cerrar sesión:", error);
    return NextResponse.json(
      { error: "Error al cerrar sesión" },
      { status: 500 }
    );
  }
}