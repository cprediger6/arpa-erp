// lib/auth/auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { 
            email: credentials.email as string 
          },
          include: { 
            company: true,
            permissions: true
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!passwordsMatch) {
          return null;
        }

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
});