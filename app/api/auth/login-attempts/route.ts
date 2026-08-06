// app/api/auth/login-attempts/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth"; // O desde donde importes tu sesión
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await auth();

    // ❌ EVITA: if (!session) return null;
    // 💡 CORRECCIÓN: Devolver un estado 401 (No Autorizado)
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "No autorizado" }, 
        { status: 401 }
      );
    }

    // Tu lógica para buscar los intentos de login...
    const attempts = await prisma.loginAttempt.findMany({
      orderBy: { timestamp: "desc" },
      take: 50,
    });

    // 💡 CORRECCIÓN: Devolver siempre la respuesta con los datos
    return NextResponse.json(attempts, { status: 200 });

  } catch (error) {
    console.error("Error al obtener intentos de login:", error);
    
    // 💡 CORRECCIÓN: Asegurar que el bloque catch devuelva un error HTTP 500
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}