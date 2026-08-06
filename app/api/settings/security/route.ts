// app/api/settings/security/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { SecurityService } from "@/lib/services/security.service";
import { z } from "zod";

const SecuritySettingsSchema = z.object({
  twoFactorAuth: z.boolean().optional(),
  sessionTimeout: z.number().min(5).max(480).optional(),
  maxLoginAttempts: z.number().min(3).max(10).optional(),
  requireStrongPassword: z.boolean().optional(),
  passwordExpiryDays: z.number().min(30).max(365).optional(),
  preventPasswordReuse: z.boolean().optional(),
  blockSuspiciousIPs: z.boolean().optional(),
  loginNotifications: z.boolean().optional(),
  sessionConcurrency: z.boolean().optional(),
  forceLogoutAfterDays: z.number().min(1).max(90).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para continuar." },
        { status: 401 }
      );
    }

    const settings = await SecurityService.getSettings(session.user.companyId);

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error obteniendo settings de seguridad:", error);
    return NextResponse.json(
      {
        error: "Error al obtener configuración de seguridad",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.companyId) {
      return NextResponse.json(
        { error: "No autorizado. Inicie sesión para continuar." },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validar los datos con Zod
    const validatedData = SecuritySettingsSchema.parse(body);

    const settings = await SecurityService.updateSettings(
      session.user.companyId,
      validatedData
    );

    return NextResponse.json({
      success: true,
      data: settings,
      message: "Configuración de seguridad actualizada correctamente",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // ✅ CORRECCIÓN: usar 'issues' en lugar de 'errors'
      const errorMessages = (error.issues || []).map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: errorMessages,
        },
        { status: 400 }
      );
    }
 
    console.error("Error actualizando settings de seguridad:", error);
    return NextResponse.json(
      {
        error: "Error al actualizar configuración de seguridad",
        details: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}