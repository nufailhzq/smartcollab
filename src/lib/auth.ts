import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";

const credSchema = z.object({
  matric: z.string().min(3),
  password: z.string().min(3),
});

// JWT strategy is required when using the Credentials provider in Auth.js v5.
// The HTTP-only signed cookie is refresh-stable, so login survives F5 — same
// guarantee the spec asks for. The Prisma adapter still backs OAuth providers
// (and exposes Account/Session/VerificationToken if we add them later).
export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        matric: { label: "Matric", type: "text" },
        password: { label: "Kata laluan", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { matric, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { matricNum: matric },
        });
        if (!user || !user.isActive) return null;

        // Support legacy plaintext while migrating; once import-script runs,
        // every passwordHash starts with $2 (bcrypt).
        const ok = user.passwordHash.startsWith("$2")
          ? await bcrypt.compare(password, user.passwordHash)
          : password === user.passwordHash;
        if (!ok) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email ?? undefined,
          role: user.role,
          matricNum: user.matricNum,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // First sign-in: hydrate token from the user we just authorized.
      if (user) {
        token.uid = Number(user.id);
        token.role = user.role;
        token.matricNum = user.matricNum ?? null;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (token.uid) {
        session.user.id = token.uid as number;
        session.user.role = token.role as Role;
        session.user.matricNum = (token.matricNum as string | null) ?? null;
      }
      return session;
    },
  },
});
