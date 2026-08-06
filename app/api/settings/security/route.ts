// app/api/settings/security/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // ✅ Usar SQL directo para obtener la configuración
    const result = await prisma.$queryRaw`
      SELECT * FROM "SecuritySettings" 
      WHERE "companyId" = ${session.user.companyId}
      LIMIT 1
    `;

    // Si no existe, crearlo
    let securitySettings = (result as any[])?.[0];
    
    if (!securitySettings) {
      await prisma.$executeRaw`
        INSERT INTO "SecuritySettings" (
          id, "companyId", "twoFactorAuth", "loginNotifications",
          "sessionConcurrency", "requireStrongPassword", "passwordExpiryDays",
          "preventPasswordReuse", "forceLogoutAfterDays", "blockSuspiciousIPs",
          "sessionTimeout", "maxLoginAttempts", "createdAt", "updatedAt"
        ) VALUES (
          ${`sec_${Date.now()}`}, ${session.user.companyId}, false, true,
          true, true, 90,
          true, 30, false,
          30, 5, NOW(), NOW()
        )
        RETURNING *
      `;
      
      // Obtener el registro recién creado
      const newResult = await prisma.$queryRaw`
        SELECT * FROM "SecuritySettings" 
        WHERE "companyId" = ${session.user.companyId}
        LIMIT 1
      `;
      securitySettings = (newResult as any[])?.[0];
    }

    return NextResponse.json(securitySettings);
  } catch (error) {
    console.error("Error al obtener configuración de seguridad:", error);
    return NextResponse.json(
      { error: "Error al obtener configuración de seguridad" },
      { status: 500 }
    );
  }
}