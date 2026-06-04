"use server";

import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthError } from "next-auth";
import { z } from "zod";

const inputSchema = z.object({
  matric: z.string().trim().min(3, "No. matrik diperlukan."),
  password: z.string().min(3, "Kata laluan diperlukan."),
});

export type LoginResult =
  | { ok: true; name: string | null }
  | { ok: false; error: string };

export async function loginAction(raw: unknown): Promise<LoginResult> {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const matric = parsed.data.matric.toUpperCase();

  try {
    await signIn("credentials", {
      matric,
      password: parsed.data.password,
      redirect: false,
    });

    // Pull the display name so the loader can greet the user. Failing here
    // shouldn't break login — fall back to no name.
    const user = await prisma.user
      .findUnique({ where: { matricNum: matric }, select: { name: true } })
      .catch(() => null);

    return { ok: true, name: user?.name ?? null };
  } catch (err) {
    if (err instanceof AuthError) {
      if (err.type === "CredentialsSignin") {
        return { ok: false, error: "No. matrik atau kata laluan salah." };
      }
      return { ok: false, error: "Ralat pengesahan. Sila cuba lagi." };
    }
    throw err;
  }
}
