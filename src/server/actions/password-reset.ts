"use server";

import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail, appUrl } from "@/lib/mailer";
import {
  generateResetToken,
  generateSixDigitCode,
  sha256,
  expiryFromNow,
  RESET_LINK_TTL_MIN,
  CHANGE_CODE_TTL_MIN,
} from "@/lib/reset-tokens";
import {
  requestResetSchema,
  resetPasswordSchema,
  changePasswordWithCodeSchema,
} from "@/schemas/password-reset";
import type { ActionResult } from "@/schemas/common";

// ─────────────────────────────────────────────────────────────────────────────
// Forgot-password (public, no session): email a single-use reset LINK, then let
// the user set a new password from that link. Responses are intentionally
// GENERIC (never reveal whether an account/email exists) to avoid enumeration.
// ─────────────────────────────────────────────────────────────────────────────

export async function requestPasswordReset(raw: unknown): Promise<ActionResult> {
  const parsed = requestResetSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const id = parsed.data.identifier.trim();
  // Accept matric (case-insensitive upper) or email.
  const user = await prisma.user.findFirst({
    where: {
      isActive: true,
      OR: [{ matricNum: id.toUpperCase() }, { email: id.toLowerCase() }],
    },
    select: { id: true, name: true, email: true },
  });

  // Only send if the account exists AND has an email on file. Either way we
  // return the same generic message.
  if (user?.email) {
    const { raw: token, hash } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hash, expiresAt: expiryFromNow(RESET_LINK_TTL_MIN) },
    });
    const link = `${appUrl()}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Tetapan Semula Kata Laluan — SmartCollab",
      text:
        `Hai ${user.name},\n\n` +
        `Anda (atau seseorang) memohon menetapkan semula kata laluan akaun SmartCollab anda.\n\n` +
        `Klik pautan berikut untuk menetapkan kata laluan baharu (sah selama ${RESET_LINK_TTL_MIN} minit):\n${link}\n\n` +
        `Jika anda tidak memohon ini, abaikan e-mel ini — kata laluan anda kekal tidak berubah.`,
    });
  }

  return { ok: true };
}

export async function resetPassword(raw: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const hash = sha256(parsed.data.token);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!row || row.usedAt || row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Pautan tidak sah atau telah tamat tempoh. Sila mohon semula." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
    // Invalidate any other outstanding reset tokens for this user.
    prisma.passwordResetToken.updateMany({
      where: { userId: row.userId, usedAt: null, id: { not: row.id } },
      data: { usedAt: new Date() },
    }),
  ]);

  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile "change password" (requires session): email a 6-digit CODE to the
// logged-in user, who enters it + a new password on their profile page.
// ─────────────────────────────────────────────────────────────────────────────

export async function requestChangePasswordCode(): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true },
  });
  if (!user) return { ok: false, error: "Pengguna tidak wujud." };
  if (!user.email) {
    return {
      ok: false,
      error: "Akaun anda tiada e-mel. Sila hubungi pentadbir untuk menetapkan semula kata laluan.",
    };
  }

  const { raw: code, hash } = generateSixDigitCode();
  await prisma.$transaction([
    // Only one active code at a time — invalidate any prior unused ones.
    prisma.passwordChangeCode.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordChangeCode.create({
      data: { userId: user.id, codeHash: hash, expiresAt: expiryFromNow(CHANGE_CODE_TTL_MIN) },
    }),
  ]);

  await sendMail({
    to: user.email,
    subject: "Kod Tukar Kata Laluan — SmartCollab",
    text:
      `Hai ${user.name},\n\n` +
      `Kod pengesahan untuk menukar kata laluan SmartCollab anda ialah:\n\n` +
      `    ${code}\n\n` +
      `Kod ini sah selama ${CHANGE_CODE_TTL_MIN} minit. Jangan kongsi kod ini dengan sesiapa.\n\n` +
      `Jika anda tidak memohon ini, abaikan e-mel ini.`,
  });

  return { ok: true };
}

export async function changePasswordWithCode(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = changePasswordWithCodeSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const codeHash = sha256(parsed.data.code);
  const row = await prisma.passwordChangeCode.findFirst({
    where: { userId: session.user.id, codeHash, usedAt: null },
    orderBy: { createdAt: "desc" },
    select: { id: true, expiresAt: true },
  });
  if (!row || row.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "Kod tidak sah atau telah tamat tempoh. Sila minta kod baharu." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } }),
    prisma.passwordChangeCode.update({ where: { id: row.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
}
