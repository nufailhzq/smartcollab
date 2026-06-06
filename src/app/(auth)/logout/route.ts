import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

export async function POST(request: Request) {
  // An idle-timeout logout posts reason=idle so the login page can explain why.
  let reason: string | null = null;
  try {
    const form = await request.formData();
    const r = form.get("reason");
    if (typeof r === "string" && r === "idle") reason = "idle";
  } catch {
    /* no body — manual logout */
  }

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
  if (reason) target.searchParams.set("reason", reason);
  return NextResponse.redirect(target);
}
