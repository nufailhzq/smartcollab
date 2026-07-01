import nodemailer from "nodemailer";

// ─────────────────────────────────────────────────────────────────────────────
// Email delivery (nodemailer + SMTP).
//
// Configure via env vars:
//   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS,
//   SMTP_SECURE ("true" for port 465), MAIL_FROM (e.g. "SmartCollab <no-reply@…>")
//   APP_URL (public base, e.g. https://143.198.214.99) — used to build links.
//
// When SMTP is NOT configured, we DON'T fail: the email body (and any link/code
// it contains) is logged to the server console so the flow still works for a
// demo. Swap in real SMTP creds and it sends for real, no code change.
// ─────────────────────────────────────────────────────────────────────────────

export function isSmtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function appUrl(): string {
  return (process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
}

let cachedTransport: nodemailer.Transporter | null = null;
function transport(): nodemailer.Transporter {
  if (cachedTransport) return cachedTransport;
  cachedTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cachedTransport;
}

type MailInput = { to: string; subject: string; text: string; html?: string };

/**
 * Send an email, or log it when SMTP isn't configured. Never throws — returns
 * whether it was actually delivered so callers can decide messaging (we keep
 * responses generic to avoid leaking which emails exist).
 */
export async function sendMail({ to, subject, text, html }: MailInput): Promise<{ sent: boolean }> {
  if (!isSmtpConfigured()) {
    console.warn(
      `[mailer] SMTP not configured — email NOT sent.\n  to: ${to}\n  subject: ${subject}\n  body:\n${text}`,
    );
    return { sent: false };
  }
  try {
    await transport().sendMail({
      from: process.env.MAIL_FROM ?? "SmartCollab <no-reply@smartcollab.local>",
      to,
      subject,
      text,
      html: html ?? text,
    });
    return { sent: true };
  } catch (err) {
    console.error(`[mailer] send failed to ${to}:`, err);
    return { sent: false };
  }
}
