import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: process.env.NEXTAUTH_SECRET,

    trustHost: true,

    session: {
        strategy: "jwt",
    },

    providers: [
        Credentials({
            async authorize(credentials) {

                if (!credentials?.email || !credentials.password)
                    return null;

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email as string
                    },
                    include: {
                        company: true,
                        permissions: true
                    }
                });

                if (!user)
                    return null;

                const valid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!valid)
                    return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    companyId: user.companyId,
                    companyName: user.company.name,
                    permissions: user.permissions
                };
            }
        })
    ],

    callbacks: {

        async jwt({ token, user }) {

            if (user) {

                token.id = user.id;
                token.role = user.role;
                token.companyId = user.companyId;
                token.companyName = user.companyName;
                token.permissions = user.permissions;

            }

            return token;

        },

        async session({ session, token }) {

            if (session.user) {

                session.user.id = token.id as string;
                session.user.role = token.role as string;
                session.user.companyId = token.companyId as string;
                session.user.companyName = token.companyName as string;
                session.user.permissions = token.permissions;

            }

            return session;

        }

    }

});