import CredentialsProvider from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: { email },
        });

        if (!user) {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          merchantId: user.merchantId,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.merchantId =
          (user as { merchantId?: string }).merchantId ?? token.merchantId;
        token.role = (user as { role?: string }).role ?? token.role;
      }

      if (!token.id && token.email) {
        const dbUser = await prisma.user.findFirst({
          where: { email: token.email },
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.merchantId = dbUser.merchantId;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.merchantId = token.merchantId as string;
        session.user.role = token.role as string;
      }

      return session;
    },
  },
};
