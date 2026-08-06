// lib/auth/auth.ts (versión mejorada)
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// Variable global para almacenar la IP y User-Agent temporalmente
let currentLoginContext: { ip: string; userAgent: string } | null = null;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 1. Buscar el usuario
        const user = await prisma.user.findUnique({
          where: { email },
          include: { 
            company: true,
            permissions: true
          },
        });

        // 2. Validar contraseña
        let status: "success" | "failed" = "failed";
        let userId = user?.id || null;

        if (!user || !user.password) {
          // Registrar intento fallido (usuario no existe)
          await prisma.loginAttempt.create({
            data: {
              email,
              userId: null,
              ipAddress: currentLoginContext?.ip || "unknown",
              location: "unknown",
              userAgent: currentLoginContext?.userAgent || "unknown",
              status: "failed",
              timestamp: new Date(),
            },
          });
          return null;
        }

        // 3. Validar contraseña
        const passwordsMatch = await bcrypt.compare(password, user.password);

        if (!passwordsMatch) {
          // Incrementar intentos fallidos
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: {
                increment: 1,
              },
            },
          });

          // Registrar intento fallido
          await prisma.loginAttempt.create({
            data: {
              email,
              userId: user.id,
              ipAddress: currentLoginContext?.ip || "unknown",
              location: "unknown",
              userAgent: currentLoginContext?.userAgent || "unknown",
              status: "failed",
              timestamp: new Date(),
            },
          });

          return null;
        }

        // 4. Login exitoso
        status = "success";

        // Resetear intentos fallidos
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: 0,
            lastLogin: new Date(),
          },
        });

        // Registrar intento exitoso
        await prisma.loginAttempt.create({
          data: {
            email,
            userId: user.id,
            ipAddress: currentLoginContext?.ip || "unknown",
            location: "unknown",
            userAgent: currentLoginContext?.userAgent || "unknown",
            status: "success",
            timestamp: new Date(),
          },
        });

        // 5. Limpiar el contexto
        currentLoginContext = null;

        // 6. Retornar el objeto mapeado
        const userAny = user as any;

        return {
          id: userAny.id,
          email: userAny.email,
          name: `${userAny.name} ${userAny.lastName}`.trim(),
          role: userAny.role,
          companyId: userAny.companyId || "",
          companyName: userAny.company?.name || "",
          permissions: userAny.permissions || [],
        };
      },
    }),
  ],
  // ✅ Usar el callback para capturar IP y User-Agent
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile, email, credentials }) {
      // Aquí puedes capturar información adicional
      return true;
    },
  },
});