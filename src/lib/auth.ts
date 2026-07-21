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
// Behind the HTTPS reverse proxy (Caddy), the browser is on https:// but the
// app may see http internally. If NEXTAUTH_URL is misconfigured to http://, v5
// picks the NON-secure cookie name while the browser expects the `__Secure-`
// one — so the first login's cookie isn't recognised on the redirect and the
// user has to log in twice. Two things guard against this, and BOTH must hold:
//   1. NEXTAUTH_URL/AUTH_URL point at the public https:// origin (.env.docker).
//   2. We force secure cookies + a fixed __Secure- cookie name in production
//      here, so the cookie the browser gets is deterministic.
// Historically only (2) was in place while the env still said http://localhost,
// which is exactly what caused the login → instant logout → works-on-retry bug.
const isProd = process.env.NODE_ENV === "production";

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  // Required in production behind a public IP / reverse proxy. Without it,
  // NextAuth v5 rejects every host except localhost with `UntrustedHost`.
  trustHost: true,
  useSecureCookies: isProd,
  cookies: {
    sessionToken: {
      name: isProd ? "__Secure-authjs.session-token" : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
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
