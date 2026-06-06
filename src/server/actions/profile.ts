"use server";

import path from "node:path";
import { promises as fs } from "node:fs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ALLOWED_AVATAR_TYPES, MAX_AVATAR_BYTES, updateContactSchema } from "@/schemas/profile";
import type { ActionResult } from "@/schemas/common";

const UPLOAD_DIR_REL = "public/uploads/avatars";
const PUBLIC_URL_BASE = "/uploads/avatars";

async function safeDeleteOldAvatar(publicPath: string | null) {
  if (!publicPath) return;
  if (!publicPath.startsWith(PUBLIC_URL_BASE + "/")) return;
  const filename = publicPath.slice(PUBLIC_URL_BASE.length + 1);
  if (filename.includes("/") || filename.includes("..")) return;
  try {
    await fs.unlink(path.join(process.cwd(), UPLOAD_DIR_REL, filename));
  } catch {
    /* missing file is fine */
  }
}

export async function uploadAvatar(formData: FormData): Promise<ActionResult<{ avatarPath: string }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Sila pilih fail imej." };
  }

  if (!(ALLOWED_AVATAR_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Format tidak disokong. Gunakan PNG, JPG, atau WEBP." };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { ok: false, error: "Saiz imej melebihi 3MB." };
  }

  // Armor: Explicitly extract and verify the buffer BEFORE writing
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength === 0) {
    return { ok: false, error: "Imej kosong atau rosak semasa dimuat naik. Sila cuba lagi." };
  }
  const buffer = Buffer.from(bytes);

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const filename = `u${session.user.id}-${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const abs = path.join(process.cwd(), UPLOAD_DIR_REL);
  
  await fs.mkdir(abs, { recursive: true });
  
  // DIAGNOSTIC LOG: This will force the server to print exactly where it is saving the file
  console.log("!!! SAVING FILE TO THIS EXACT LOCATION !!! ->", path.join(abs, filename));
  
  await fs.writeFile(path.join(abs, filename), buffer);

  const publicPath = `${PUBLIC_URL_BASE}/${filename}`;

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarPath: true },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarPath: publicPath },
  });

  if (existing?.avatarPath && existing.avatarPath !== publicPath) {
    await safeDeleteOldAvatar(existing.avatarPath);
  }

  revalidatePath("/student/profil");
  revalidatePath("/lecturer/profil");
  revalidatePath("/student");
  revalidatePath("/lecturer");
  revalidatePath("/", "layout");

  return { ok: true, data: { avatarPath: publicPath } };
}

export async function updateContact(raw: unknown): Promise<ActionResult<{ phone: string | null }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = updateContactSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const phone = parsed.data.phone?.trim() || null;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone },
  });

  revalidatePath("/student/profil");
  revalidatePath("/lecturer/profil");
  revalidatePath("/student/kursus");
  return { ok: true, data: { phone } };
}

export async function removeAvatar(): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const existing = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { avatarPath: true },
  });

  if (existing?.avatarPath) {
    await safeDeleteOldAvatar(existing.avatarPath);
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarPath: null },
  });

  revalidatePath("/student/profil");
  revalidatePath("/lecturer/profil");
  revalidatePath("/", "layout");
  return { ok: true };
}