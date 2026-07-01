import { createHash, randomBytes } from "node:crypto";

// Shared helpers for the forgot-password reset link.
// We only ever persist the SHA-256 hash; the raw token lives in the emailed URL.

export const RESET_LINK_TTL_MIN = 30; // reset link valid for 30 minutes

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Opaque URL-safe token for the forgot-password reset link. */
export function generateResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: sha256(raw) };
}

export function expiryFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}
