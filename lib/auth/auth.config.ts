// lib/auth/auth.config.ts
import type { NextAuthConfig } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      companyId: string;
      companyName: string;
      permissions: any;
    }
  }

  interface JWT {
    id?: string;
    role?: string;
    companyId?: string;
    companyName?: string;
    permissions?: any;
  }
}

export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.role = u.role;
        token.companyId = u.companyId;
        token.companyName = u.companyName;
        token.permissions = u.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
        session.user.companyName = token.companyName as string;
        session.user.permissions = token.permissions;
      }
      return session;
    },
  },
  providers: [],
  // No configurar cookies manualmente a menos que sea necesario
} satisfies NextAuthConfig;