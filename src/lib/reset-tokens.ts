import { createHash, randomBytes, randomInt } from "node:crypto";

// Shared helpers for password-reset links and change-password codes.
// We only ever persist the SHA-256 hash; the raw value lives in the email.

export const RESET_LINK_TTL_MIN = 30; // reset link valid for 30 minutes
export const CHANGE_CODE_TTL_MIN = 10; // 6-digit code valid for 10 minutes

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Opaque URL-safe token for the forgot-password reset link. */
export function generateResetToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString("hex");
  return { raw, hash: sha256(raw) };
}

/** 6-digit numeric code for the profile change-password flow. */
export function generateSixDigitCode(): { raw: string; hash: string } {
  const raw = String(randomInt(0, 1_000_000)).padStart(6, "0");
  return { raw, hash: sha256(raw) };
}

export function expiryFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}
