"use server";

import path from "node:path";
import { promises as fs } from "node:fs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAllStudentsAndLecturers } from "@/lib/notifications";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  createBulletinSchema,
  deleteBulletinSchema,
  toggleBulletinSchema,
  updateBulletinSchema,
} from "@/schemas/bulletin";
import type { ActionResult } from "@/schemas/common";

const UPLOAD_DIR_REL = "public/uploads/bulletins";
const PUBLIC_URL_BASE = "/uploads/bulletins";

async function ensureAdmin(): Promise<{ ok: true; userId: number } | { ok: false; error: string }> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "ADMIN") return { ok: false, error: "Tidak dibenarkan." };
  return { ok: true, userId: session.user.id };
}

function bumpCaches() {
  revalidatePath("/admin/buletin");
  revalidatePath("/student");
  revalidatePath("/lecturer");
}

function truncate(s: string, n: number) {
  const cleaned = s.replace(/\s+/g, " ").trim();
  if (cleaned.length <= n) return cleaned;
  return cleaned.slice(0, n - 1).trimEnd() + "…";
}

async function notifyBulletinPublished(bulletin: { title: string; body: string }) {
  try {
    await notifyAllStudentsAndLecturers({
      title: `Buletin: ${truncate(bulletin.title, 60)}`,
      message: truncate(bulletin.body, 140),
      link: "bulletin",
    });
  } catch (err) {
    // Notification failure shouldn't abort the publish — log and continue.
    console.error("Failed to fan-out bulletin notifications:", err);
  }
}

function extractFormFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    body: String(formData.get("body") ?? ""),
    linkUrl: String(formData.get("linkUrl") ?? ""),
    linkLabel: String(formData.get("linkLabel") ?? ""),
    isActive: formData.get("isActive") === "true" || formData.get("isActive") === "on",
    isPinned: formData.get("isPinned") === "true" || formData.get("isPinned") === "on",
  };
}

async function saveUploadedImage(file: File | null): Promise<
  { ok: true; path: string | null } | { ok: false; error: string }
> {
  if (!file || file.size === 0) return { ok: true, path: null };

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Format imej tidak disokong. Gunakan PNG, JPG, WEBP, atau GIF." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "Saiz imej melebihi 5MB." };
  }

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext || "bin"}`;
  const abs = path.join(process.cwd(), UPLOAD_DIR_REL);
  await fs.mkdir(abs, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(abs, filename), buffer);

  return { ok: true, path: `${PUBLIC_URL_BASE}/${filename}` };
}

async function deleteImageFile(publicPath: string | null) {
  if (!publicPath) return;
  if (!publicPath.startsWith(PUBLIC_URL_BASE + "/")) return;
  const filename = publicPath.slice(PUBLIC_URL_BASE.length + 1);
  if (filename.includes("/") || filename.includes("..")) return;
  const abs = path.join(process.cwd(), UPLOAD_DIR_REL, filename);
  try {
    await fs.unlink(abs);
  } catch {
    // Silently ignore — file may have been removed externally.
  }
}

export async function createBulletin(formData: FormData): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const fields = extractFormFields(formData);
  const parsed = createBulletinSchema.safeParse(fields);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const file = formData.get("image");
  const upload = await saveUploadedImage(file instanceof File ? file : null);
  if (!upload.ok) return { ok: false, error: upload.error };

  const bulletin = await prisma.bulletin.create({
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      imagePath: upload.path,
      linkUrl: parsed.data.linkUrl,
      linkLabel: parsed.data.linkLabel,
      isActive: parsed.data.isActive,
      isPinned: parsed.data.isPinned,
      createdById: gate.userId,
    },
    select: { title: true, body: true, isActive: true },
  });

  if (bulletin.isActive) await notifyBulletinPublished(bulletin);

  bumpCaches();
  return { ok: true };
}

export async function updateBulletin(formData: FormData): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const fields = {
    ...extractFormFields(formData),
    bulletinId: Number(formData.get("bulletinId") ?? 0),
    keepImage: formData.get("keepImage") === "true",
  };
  const parsed = updateBulletinSchema.safeParse(fields);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const existing = await prisma.bulletin.findUnique({
    where: { id: parsed.data.bulletinId },
    select: { id: true, imagePath: true, isActive: true },
  });
  if (!existing) return { ok: false, error: "Buletin tidak wujud." };

  const file = formData.get("image");
  const upload = await saveUploadedImage(file instanceof File ? file : null);
  if (!upload.ok) return { ok: false, error: upload.error };

  let newImagePath = existing.imagePath;
  if (upload.path) {
    if (existing.imagePath) await deleteImageFile(existing.imagePath);
    newImagePath = upload.path;
  } else if (!parsed.data.keepImage) {
    if (existing.imagePath) await deleteImageFile(existing.imagePath);
    newImagePath = null;
  }

  const updated = await prisma.bulletin.update({
    where: { id: parsed.data.bulletinId },
    data: {
      title: parsed.data.title,
      body: parsed.data.body,
      imagePath: newImagePath,
      linkUrl: parsed.data.linkUrl,
      linkLabel: parsed.data.linkLabel,
      isActive: parsed.data.isActive,
      isPinned: parsed.data.isPinned,
    },
    select: { title: true, body: true },
  });

  // Fan out a notification only when the bulletin transitions from hidden → visible.
  if (!existing.isActive && parsed.data.isActive) {
    await notifyBulletinPublished(updated);
  }

  bumpCaches();
  return { ok: true };
}

export async function deleteBulletin(raw: unknown): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const parsed = deleteBulletinSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const existing = await prisma.bulletin.findUnique({
    where: { id: parsed.data.bulletinId },
    select: { imagePath: true },
  });
  if (!existing) return { ok: false, error: "Buletin tidak wujud." };

  await prisma.bulletin.delete({ where: { id: parsed.data.bulletinId } });
  if (existing.imagePath) await deleteImageFile(existing.imagePath);

  bumpCaches();
  return { ok: true };
}

export async function toggleBulletinFlag(raw: unknown): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return gate;

  const parsed = toggleBulletinSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const exists = await prisma.bulletin.findUnique({
    where: { id: parsed.data.bulletinId },
    select: { id: true, title: true, body: true, isActive: true },
  });
  if (!exists) return { ok: false, error: "Buletin tidak wujud." };

  await prisma.bulletin.update({
    where: { id: parsed.data.bulletinId },
    data: { [parsed.data.field]: parsed.data.value },
  });

  // Treat toggling Active off → on as a re-publish: notify recipients again.
  if (parsed.data.field === "isActive" && !exists.isActive && parsed.data.value) {
    await notifyBulletinPublished({ title: exists.title, body: exists.body });
  }

  bumpCaches();
  return { ok: true };
}
