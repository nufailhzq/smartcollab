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

  // signOut clears the Auth.js session server-side. It mutates the next/headers
  // cookie store, but because we return our OWN NextResponse below (to control
  // the redirect base behind a proxy) rather than the framework's default
  // response, that Set-Cookie would be dropped. We therefore also delete the
  // auth cookies explicitly on the response we return (see below).
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
  // 303 See Other — NOT the default 307. A 307 preserves the POST method, so
  // the browser would re-POST to /login (a GET-only page) and effectively just
  // reload the current page without logging out. 303 forces a follow-up GET.
  const response = NextResponse.redirect(target, 303);

  // Clear the session cookie on the response we actually return. We can't rely
  // on reading the cookie back from the store (signOut already deleted it
  // there, so it may be absent), so we expire every known Auth.js v5 cookie
  // name variant deterministically — both the dev (`authjs.`) and HTTPS
  // (`__Secure-authjs.`) prefixes, plus any legacy `next-auth.` names. Any name
  // not present in the browser is simply a harmless no-op Set-Cookie.
  const AUTH_COOKIE_NAMES = [
    "authjs.session-token",
    "__Secure-authjs.session-token",
    "authjs.csrf-token",
    "__Host-authjs.csrf-token",
    "authjs.callback-url",
    "__Secure-authjs.callback-url",
    // Legacy NextAuth v4 names, in case an old cookie lingers.
    "next-auth.session-token",
    "__Secure-next-auth.session-token",
    "next-auth.csrf-token",
    "next-auth.callback-url",
    "__Secure-next-auth.callback-url",
  ];
  // Also catch anything the store DID surface (e.g. chunked .0/.1 tokens).
  const store = cookies();
  const dynamicNames = store
    .getAll()
    .map((c) => c.name)
    .filter((n) => /authjs|next-auth/i.test(n));

  for (const name of new Set([...AUTH_COOKIE_NAMES, ...dynamicNames])) {
    // A bare delete() emits `Set-Cookie: name=; Max-Age=0` WITHOUT the Secure
    // flag. Browsers REJECT any `__Secure-`/`__Host-`-prefixed Set-Cookie that
    // lacks Secure — so the real production session cookie
    // (`__Secure-authjs.session-token`) was never actually cleared, and logout
    // appeared to do nothing. We therefore expire each name with explicit,
    // prefix-valid attributes. We clear both a secure and a non-secure variant
    // so it works over HTTPS (prod) and plain HTTP (local) alike.
    const base = { path: "/", expires: new Date(0), maxAge: 0 as const };
    response.cookies.set(name, "", { ...base, secure: true, httpOnly: true });
    response.cookies.set(name, "", { ...base, secure: false, httpOnly: true });
  }

  return response;
}
