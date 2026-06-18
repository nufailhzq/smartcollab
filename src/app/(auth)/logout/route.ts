import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

export async function POST(request: Request) {
  // An idle-timeout logout posts reason=idle so the login page can explain why.
  // A reopen-after-tab-close posts reason=closed — same effect (clear session,
  // redirect to /login) but silent, so we don't forward it to the URL.
  let reason: string | null = null;
  try {
    const form = await request.formData();
    const r = form.get("reason");
    if (typeof r === "string" && (r === "idle" || r === "closed")) reason = r;
  } catch {
    /* no body — manual logout */
  }

  // signOut mutates the session cookie (expires it) via next/headers' cookie
  // store. Because we return our OWN NextResponse below instead of letting the
  // framework emit its default response, those Set-Cookie headers would be
  // dropped — leaving the JWT cookie alive and the user still "logged in".
  // We therefore snapshot the cookie store after signOut and replay every
  // auth/session cookie onto the redirect response so the clear actually lands.
  await signOut({ redirect: false });

  // Prefer the public URL the user came in on, fall back to NEXTAUTH_URL,
  // and only as a last resort use the request origin (which behind a proxy
  // is the internal container origin — safe but not pretty).
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  let base =
    forwardedHost && forwardedProto
      ? `${forwardedProto}://${forwardedHost}`
      : null;
  if (!base) base = process.env.NEXTAUTH_URL || null;
  if (!base) base = new URL(request.url).origin;

  const target = new URL("/login", base);
  // Only the idle timeout surfaces a notice on the login page.
  if (reason === "idle") target.searchParams.set("reason", reason);
  const response = NextResponse.redirect(target);

  // Replay the (now-expired) auth cookies onto the response we actually return,
  // so the browser drops the session. Auth.js v5 cookie names are prefixed
  // `authjs.` (and `__Secure-authjs.` over HTTPS).
  const store = cookies();
  for (const cookie of store.getAll()) {
    if (/authjs|next-auth/i.test(cookie.name)) {
      response.cookies.set(cookie.name, cookie.value, {
        path: "/",
        expires: new Date(0),
        maxAge: 0,
      });
    }
  }

  return response;
}
