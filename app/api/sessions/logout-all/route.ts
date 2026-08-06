// app/api/sessions/logout-all/route.ts 
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/api-auth";
import { SecurityService } from "@/lib/services/security.service";

// 💡 Agregamos explícitamente el tipo de retorno ': Promise<Response>'
export async function POST(req: NextRequest): Promise<Response> {
  try {
    const auth = await requireAuth(req);
    
    // 💡 Si no está autenticado, nos aseguramos de que haya una respuesta válida 
    // o enviamos un fallback 401 si 'auth.response' viniera vacío.
    if (!auth.authenticated) {
      return auth.response || NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { sessionToken } = await req.json();
    
    await SecurityService.revokeAllSessions(
      auth.session.user.id, 
      sessionToken || auth.session.user.id
    );
    
    return NextResponse.json({
      success: true,
      message: "Todas las sesiones cerradas correctamente"
    });
  } catch (error) {
    console.error("Error cerrando todas las sesiones:", error);
    return NextResponse.json(
      { error: "Error al cerrar todas las sesiones" },
      { status: 500 }
    );
  }
}