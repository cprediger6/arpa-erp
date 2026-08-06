// app/api/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import { SecurityService } from "@/lib/services/security.service";

// 💡 Agregamos explícitamente el tipo de retorno ': Promise<Response>'
export async function GET(req: NextRequest): Promise<Response> {
  try {
    const auth = await requireAuth(req);
    
    // 💡 Nos aseguramos de retornar una Response válida si no está autenticado
    if (!auth.authenticated) {
      return auth.response || NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Obtener el token de sesión actual de la cookie
    // En NextAuth v5, en producción puede llamarse '__Host-next-auth.session-token'
    const sessionToken = 
      req.cookies.get('next-auth.session-token')?.value || 
      req.cookies.get('__Host-next-auth.session-token')?.value || 
      '';

    const sessions = await SecurityService.getActiveSessions(auth.session.user.id);

    // Marcar la sesión actual comparando con el token de la cookie
    const sessionsWithCurrent = sessions.map((s: any) => ({
      ...s,
      isCurrent: s.sessionToken === sessionToken,
    }));

    return NextResponse.json({
      success: true,
      data: sessionsWithCurrent,
    });
  } catch (error) {
    console.error("Error obteniendo sesiones:", error);
    return NextResponse.json(
      { error: "Error al obtener sesiones activas" },
      { status: 500 }
    );
  }
}