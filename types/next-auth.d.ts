// types/next-auth.d.ts
import NextAuth from "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
    companyId: string;
    companyName: string;
    permissions: any[]; // Cambia 'any[]' por tu tipo real si tienes un esquema de permisos estricto
  }

  interface Session {
    user: {
      id: string;
      role: string;
      companyId: string;
      companyName: string;
      permissions: any[];
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    companyId: string;
    companyName: string;
    permissions: any[];
  }
}