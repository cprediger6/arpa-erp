// lib/auth/auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔍 Authorize llamado con:", credentials?.email);
        
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Credenciales faltantes");
          return null;
        }

        try {
          const email = credentials.email as string;
          const password = credentials.password as string;

          console.log("🔍 Buscando usuario:", email);

          const user = await prisma.user.findUnique({
            where: { email },
            include: { 
              company: true, 
              permissions: true 
            }
          });

          if (!user) {
            console.log("❌ Usuario no encontrado:", email);
            return null;
          }

          console.log("✅ Usuario encontrado:", user.email);

          const isValid = await bcrypt.compare(password, user.password);
          console.log("🔐 Contraseña válida:", isValid);

          if (!isValid) {
            console.log("❌ Contraseña incorrecta");
            return null;
          }

          console.log("✅ Usuario autorizado:", user.email);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId,
            companyName: user.company.name,
            permissions: user.permissions
          };
        } catch (error) {
          console.error("❌ Error en authorize:", error);
          return null;
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("🔐 JWT callback:", { token, user });
      if (user) {
        token.role = user.role;
        token.companyId = user.companyId;
        token.companyName = user.companyName;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("📝 Session callback:", { session, token });
      if (session.user) {
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        session.user.companyName = token.companyName as string;
        session.user.permissions = token.permissions as any[];
      }
      return session;
    }
  }
});