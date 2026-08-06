// lib/auth/api-auth.ts 
import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth"; // Importa el método nativo que definiste en lib/auth/auth.ts

// 💡 Definimos tipos estrictos para que TypeScript NUNCA infiera un 'null' en la respuesta
export type AuthResult =
  | { authenticated: true; session: any; response: null }
  | { authenticated: false; session: null; response: NextResponse };

export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  try {
    // 1. Llamamos al método nativo de Next-Auth v5 para obtener la sesión
    const session = await auth();

    // 2. Si no existe la sesión o no tiene usuario, denegamos el acceso inmediatamente
    if (!session || !session.user) {
      return {
        authenticated: false,
        session: null,
        response: NextResponse.json(
          { error: "No autorizado. Sesión inválida o expirada." },
          { status: 401 }
        ),
      };
    }

    // 3. Si todo está correcto, devolvemos la sesión y marcamos response como null de forma segura
    return {
      authenticated: true,
      session: session,
      response: null,
    };
  } catch (error) {
    console.error("Error en el helper requireAuth:", error);
    return {
      authenticated: false,
      session: null,
      response: NextResponse.json(
        { error: "Error interno del servidor de autenticación" },
        { status: 500 }
      ),
    };
  }
}