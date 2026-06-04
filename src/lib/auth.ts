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

/**
 * Throttled last-seen pinger. The session callback fires on every request,
 * so we cap writes to one per user every 5 minutes — enough resolution for
 * lecturers to spot dormant students without hammering MySQL.
 */
const LAST_SEEN_THROTTLE_MS = 5 * 60 * 1000;
const lastSeenCache = new Map<number, number>();
function touchLastSeen(userId: number) {
  const now = Date.now();
  const previous = lastSeenCache.get(userId);
  if (previous && now - previous < LAST_SEEN_THROTTLE_MS) return;
  lastSeenCache.set(userId, now);
  // Fire and forget; swallow failures so login flow never trips on a write.
  prisma.user
    .update({ where: { id: userId }, data: { lastSeenAt: new Date(now) } })
    .catch(() => {
      lastSeenCache.delete(userId);
    });
}

// JWT strategy is required when using the Credentials provider in Auth.js v5.
// The HTTP-only signed cookie is refresh-stable, so login survives F5 — same
// guarantee the spec asks for. The Prisma adapter still backs OAuth providers
// (and exposes Account/Session/VerificationToken if we add them later).
export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Required in production behind a public IP / reverse proxy. Without it,
  // NextAuth v5 rejects every host except localhost with `UntrustedHost`.
  // Auth.js automatically validates against NEXTAUTH_URL when set.
  trustHost: true,
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
        // Fire-and-forget last-seen ping (throttled per-user in memory).
        touchLastSeen(token.uid as number);
      }
      return session;
    },
  },
});
