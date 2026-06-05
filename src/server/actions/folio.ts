"use server";

import path from "node:path";
import { promises as fs } from "node:fs";
import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyMany, notifyUser } from "@/lib/notifications";
import { z } from "zod";
import {
  ALLOWED_POST_IMAGE_TYPES,
  MAX_POST_IMAGE_BYTES,
  POST_MAX_IMAGES,
  POST_MAX_LENGTH,
  addCommentSchema,
  createPostSchema,
  deleteCommentSchema,
  deletePostSchema,
  extractMentionedMatrics,
  reactionSchema,
  repostSchema,
} from "@/schemas/folio";
import type { ActionResult } from "@/schemas/common";

const UPLOAD_DIR_REL = "public/uploads/folio";
const PUBLIC_URL_BASE = "/uploads/folio";

function bumpCaches() {
  revalidatePath("/folio");
  revalidatePath("/folio/cari");
  revalidatePath("/student");
}

async function saveImage(file: File): Promise<
  { ok: true; path: string } | { ok: false; error: string }
> {
  if (!(ALLOWED_POST_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: "Format imej tidak disokong. Gunakan PNG, JPG, WEBP, atau GIF." };
  }
  if (file.size > MAX_POST_IMAGE_BYTES) {
    return { ok: false, error: "Saiz imej melebihi 5MB." };
  }
  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext || "bin"}`;
  const abs = path.join(process.cwd(), UPLOAD_DIR_REL);
  await fs.mkdir(abs, { recursive: true });
  await fs.writeFile(path.join(abs, filename), Buffer.from(await file.arrayBuffer()));
  return { ok: true, path: `${PUBLIC_URL_BASE}/${filename}` };
}

async function deleteImageFile(publicPath: string) {
  if (!publicPath.startsWith(PUBLIC_URL_BASE + "/")) return;
  const filename = publicPath.slice(PUBLIC_URL_BASE.length + 1);
  if (filename.includes("/") || filename.includes("..")) return;
  try {
    await fs.unlink(path.join(process.cwd(), UPLOAD_DIR_REL, filename));
  } catch {
    /* missing file is fine */
  }
}

export async function createFolioPost(formData: FormData): Promise<ActionResult<{ postId: number }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  // Folio Connect is open to students and lecturers. Admins remain read-only.
  if (session.user.role !== "STUDENT" && session.user.role !== "LECTURER") {
    return { ok: false, error: "Hanya pelajar dan pensyarah boleh menghantar pos." };
  }

  const parsed = createPostSchema.safeParse({
    content: String(formData.get("content") ?? ""),
    visibility: String(formData.get("visibility") ?? "PUBLIC"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const files = formData.getAll("images").filter((v): v is File => v instanceof File && v.size > 0);
  if (files.length > POST_MAX_IMAGES) {
    return { ok: false, error: `Maksimum ${POST_MAX_IMAGES} imej setiap pos.` };
  }

  if (parsed.data.content.length === 0 && files.length === 0) {
    return { ok: false, error: "Pos tidak boleh kosong." };
  }

  if (parsed.data.content.length > POST_MAX_LENGTH) {
    return { ok: false, error: `Pos melebihi ${POST_MAX_LENGTH} aksara.` };
  }

  // Persist uploaded images first so we can attach paths to the post in one tx.
  const savedPaths: string[] = [];
  for (const file of files) {
    const r = await saveImage(file);
    if (!r.ok) {
      // best-effort rollback of already-uploaded files
      for (const p of savedPaths) await deleteImageFile(p);
      return { ok: false, error: r.error };
    }
    savedPaths.push(r.path);
  }

  // Resolve @matric mentions to real user IDs.
  const matrics = extractMentionedMatrics(parsed.data.content);
  const mentionedUsers = matrics.length
    ? await prisma.user.findMany({
        where: { matricNum: { in: matrics } },
        select: { id: true, matricNum: true },
      })
    : [];

  const post = await prisma.folioPost.create({
    data: {
      authorId: session.user.id,
      content: parsed.data.content,
      visibility: parsed.data.visibility,
      images: {
        create: savedPaths.map((p, i) => ({ imagePath: p, position: i })),
      },
      mentions: {
        create: mentionedUsers.map((u) => ({
          mentionedUserId: u.id,
          matricNum: u.matricNum!,
        })),
      },
    },
    select: { id: true },
  });

  // Notify mentioned students (excluding self).
  const mentionTargets = mentionedUsers
    .map((u) => u.id)
    .filter((id) => id !== session.user.id);
  if (mentionTargets.length > 0) {
    try {
      await notifyMany(mentionTargets, {
        title: `${session.user.name} menyebut anda di Folio Connect`,
        message: parsed.data.content.slice(0, 140),
        link: `/folio/pos/${post.id}`,
      });
    } catch (err) {
      console.error("Folio mention notification fan-out failed:", err);
    }
  }

  bumpCaches();
  return { ok: true, data: { postId: post.id } };
}

export async function deleteFolioPost(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = deletePostSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const post = await prisma.folioPost.findUnique({
    where: { id: parsed.data.postId },
    include: { images: true },
  });
  if (!post) return { ok: false, error: "Pos tidak wujud." };

  // Only the post's author may delete it via this path. Admin removals go
  // through `adminDeleteFolioPost` so the author gets a reason notification.
  if (post.authorId !== session.user.id) {
    return { ok: false, error: "Anda hanya boleh padam pos anda sendiri." };
  }

  await prisma.folioPost.delete({ where: { id: post.id } });
  for (const img of post.images) {
    await deleteImageFile(img.imagePath);
  }

  bumpCaches();
  return { ok: true };
}

export async function toggleRepost(raw: unknown): Promise<ActionResult<{ reposted: boolean }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT" && session.user.role !== "LECTURER") {
    return { ok: false, error: "Hanya pelajar dan pensyarah boleh repost." };
  }

  const parsed = repostSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const parent = await prisma.folioPost.findUnique({
    where: { id: parsed.data.postId },
    select: { id: true, authorId: true, isRepost: true, content: true },
  });
  if (!parent) return { ok: false, error: "Pos tidak wujud." };
  if (parent.isRepost) {
    return { ok: false, error: "Tidak boleh repost sesuatu yang sudah repost." };
  }
  if (parent.authorId === session.user.id) {
    return { ok: false, error: "Anda tidak boleh repost pos sendiri." };
  }

  const existing = await prisma.folioPost.findFirst({
    where: { authorId: session.user.id, parentId: parent.id, isRepost: true },
    select: { id: true },
  });

  if (existing) {
    await prisma.folioPost.delete({ where: { id: existing.id } });
    bumpCaches();
    return { ok: true, data: { reposted: false } };
  }

  await prisma.folioPost.create({
    data: {
      authorId: session.user.id,
      content: "",
      visibility: "PUBLIC",
      parentId: parent.id,
      isRepost: true,
    },
  });

  try {
    if (parent.authorId !== session.user.id) {
      await notifyMany([parent.authorId], {
        title: `${session.user.name} berkongsi pos anda`,
        message: parent.content.slice(0, 140) || "Pos anda telah dikongsi semula.",
        link: `/folio/pos/${parent.id}`,
      });
    }
  } catch (err) {
    console.error("Folio repost notification failed:", err);
  }

  bumpCaches();
  return { ok: true, data: { reposted: true } };
}

export async function addFolioComment(
  input: FormData | { postId: number; content: string },
): Promise<ActionResult<{ commentId: number }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT" && session.user.role !== "LECTURER") {
    return { ok: false, error: "Hanya pelajar dan pensyarah boleh memberi komen." };
  }

  // Comments now optionally carry an image attachment (gif/jpg/png/webp).
  // To keep the existing object-call sites working, accept both shapes.
  let postIdRaw: unknown;
  let contentRaw: unknown;
  let attachment: File | null = null;

  if (input instanceof FormData) {
    postIdRaw = Number(input.get("postId"));
    contentRaw = String(input.get("content") ?? "");
    const f = input.get("image");
    if (f instanceof File && f.size > 0) attachment = f;
  } else {
    postIdRaw = input?.postId;
    contentRaw = input?.content;
  }

  const parsed = addCommentSchema.safeParse({
    postId: postIdRaw,
    // Allow empty text when an image is present — re-check below.
    content: attachment ? (contentRaw || "📷") : contentRaw,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const post = await prisma.folioPost.findUnique({
    where: { id: parsed.data.postId },
    select: { id: true, authorId: true, isRepost: true, parentId: true, content: true },
  });
  if (!post) return { ok: false, error: "Pos tidak wujud." };

  // Comments attach to the original post — a repost row should forward to its parent.
  const targetPostId = post.isRepost && post.parentId ? post.parentId : post.id;

  // Save attachment first; defensively reject anything that isn't an image
  // type (the helper enforces gif/jpg/png/webp; videos are not on the list).
  let imagePath: string | null = null;
  if (attachment) {
    const saved = await saveImage(attachment);
    if (!saved.ok) return { ok: false, error: saved.error };
    imagePath = saved.path;
  }

  const comment = await prisma.folioComment.create({
    data: {
      postId: targetPostId,
      authorId: session.user.id,
      content: parsed.data.content,
      imagePath,
    },
    select: { id: true },
  });

  try {
    const target = post.isRepost && post.parentId
      ? (await prisma.folioPost.findUnique({
          where: { id: post.parentId },
          select: { authorId: true, content: true },
        }))
      : { authorId: post.authorId, content: post.content };

    if (target && target.authorId !== session.user.id) {
      await notifyMany([target.authorId], {
        title: `${session.user.name} mengomen pos anda`,
        message: parsed.data.content.slice(0, 140),
        link: `/folio/pos/${targetPostId}`,
      });
    }
  } catch (err) {
    console.error("Folio comment notification failed:", err);
  }

  bumpCaches();
  revalidatePath(`/folio/pos/${targetPostId}`);
  return { ok: true, data: { commentId: comment.id } };
}

export async function deleteFolioComment(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = deleteCommentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const comment = await prisma.folioComment.findUnique({
    where: { id: parsed.data.commentId },
    select: {
      id: true,
      authorId: true,
      postId: true,
      imagePath: true,
      post: { select: { authorId: true } },
    },
  });
  if (!comment) return { ok: false, error: "Komen tidak wujud." };

  // Comment author, post author, and admins can delete.
  const allowed =
    comment.authorId === session.user.id ||
    comment.post.authorId === session.user.id ||
    session.user.role === "ADMIN";
  if (!allowed) return { ok: false, error: "Tidak dibenarkan." };

  await prisma.folioComment.delete({ where: { id: comment.id } });
  if (comment.imagePath) await deleteImageFile(comment.imagePath);
  bumpCaches();
  revalidatePath(`/folio/pos/${comment.postId}`);
  return { ok: true };
}

export async function toggleFolioReaction(
  raw: unknown,
): Promise<ActionResult<{ added: boolean }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "STUDENT" && session.user.role !== "LECTURER") {
    return { ok: false, error: "Hanya pelajar dan pensyarah boleh memberi reaksi." };
  }

  const parsed = reactionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  const post = await prisma.folioPost.findUnique({
    where: { id: parsed.data.postId },
    select: { id: true, isRepost: true, parentId: true },
  });
  if (!post) return { ok: false, error: "Pos tidak wujud." };
  const targetPostId = post.isRepost && post.parentId ? post.parentId : post.id;

  const existing = await prisma.folioReaction.findUnique({
    where: {
      postId_userId_emoji: {
        postId: targetPostId,
        userId: session.user.id,
        emoji: parsed.data.emoji,
      },
    },
  });

  if (existing) {
    await prisma.folioReaction.delete({ where: { id: existing.id } });
    bumpCaches();
    revalidatePath(`/folio/pos/${targetPostId}`);
    return { ok: true, data: { added: false } };
  }

  await prisma.folioReaction.create({
    data: {
      postId: targetPostId,
      userId: session.user.id,
      emoji: parsed.data.emoji,
    },
  });
  bumpCaches();
  revalidatePath(`/folio/pos/${targetPostId}`);
  return { ok: true, data: { added: true } };
}

// ---------------------------------------------------------------------------
// Archive: post owner hides their post from feed/profile without deleting it.
// ---------------------------------------------------------------------------

const archiveSchema = z.object({
  postId: z.number().int().positive(),
  archive: z.boolean(),
});

export async function toggleArchiveFolioPost(
  raw: unknown,
): Promise<ActionResult<{ archived: boolean }>> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = archiveSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const post = await prisma.folioPost.findUnique({
    where: { id: parsed.data.postId },
    select: { id: true, authorId: true, archivedAt: true, isRepost: true },
  });
  if (!post) return { ok: false, error: "Pos tidak wujud." };
  if (post.authorId !== session.user.id) {
    return { ok: false, error: "Anda hanya boleh arkib pos anda sendiri." };
  }
  if (post.isRepost) {
    return { ok: false, error: "Repost tidak boleh diarkib — padam sahaja." };
  }

  await prisma.folioPost.update({
    where: { id: post.id },
    data: { archivedAt: parsed.data.archive ? new Date() : null },
  });

  bumpCaches();
  return { ok: true, data: { archived: parsed.data.archive } };
}

// ---------------------------------------------------------------------------
// Moderation: report a post (anyone) → admin can delete or dismiss
// ---------------------------------------------------------------------------

const reportSchema = z.object({
  postId: z.number().int().positive(),
  reason: z
    .string()
    .trim()
    .min(5, "Sila berikan sebab laporan (sekurang-kurangnya 5 aksara).")
    .max(800, "Sebab terlalu panjang."),
});

const adminDeleteSchema = z.object({
  postId: z.number().int().positive(),
  reason: z
    .string()
    .trim()
    .min(5, "Sila berikan sebab pemadaman (sekurang-kurangnya 5 aksara).")
    .max(800, "Sebab terlalu panjang."),
});

const dismissReportSchema = z.object({
  reportId: z.number().int().positive(),
});

/**
 * Anyone authenticated can report a post. Creates a PENDING report row and
 * notifies every active admin so they see the new entry in their queue.
 */
export async function reportFolioPost(raw: unknown): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };

  const parsed = reportSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const post = await prisma.folioPost.findUnique({
    where: { id: parsed.data.postId },
    select: { id: true, authorId: true, content: true },
  });
  if (!post) return { ok: false, error: "Pos tidak wujud." };
  if (post.authorId === session.user.id) {
    return { ok: false, error: "Anda tidak boleh melaporkan pos anda sendiri." };
  }

  // Block duplicate pending reports from the same user for the same post.
  const existing = await prisma.folioPostReport.findFirst({
    where: {
      postId: post.id,
      reporterId: session.user.id,
      status: "PENDING",
    },
    select: { id: true },
  });
  if (existing) {
    return { ok: false, error: "Anda sudah melaporkan pos ini." };
  }

  await prisma.folioPostReport.create({
    data: {
      postId: post.id,
      reporterId: session.user.id,
      reason: parsed.data.reason,
    },
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", isActive: true },
    select: { id: true },
  });
  if (admins.length > 0) {
    const snippet = post.content
      ? post.content.length > 60
        ? `${post.content.slice(0, 57)}…`
        : post.content
      : "(tanpa teks)";
    await notifyMany(
      admins.map((a) => a.id),
      {
        title: "Laporan Pos Baharu",
        message: `${session.user.name} melaporkan: "${snippet}"`,
        link: "/admin/laporan",
      },
    );
  }

  revalidatePath("/admin/laporan");
  return { ok: true };
}

/**
 * Admin removes a reported post and notifies the author with the stated
 * reason. Cascades delete every related report row.
 */
export async function adminDeleteFolioPost(
  raw: unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "ADMIN") {
    return { ok: false, error: "Hanya admin dibenarkan." };
  }

  const parsed = adminDeleteSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Input tidak sah." };
  }

  const post = await prisma.folioPost.findUnique({
    where: { id: parsed.data.postId },
    include: { images: true, author: { select: { id: true, name: true } } },
  });
  if (!post) return { ok: false, error: "Pos tidak wujud." };

  const snippet = post.content
    ? post.content.length > 80
      ? `${post.content.slice(0, 77)}…`
      : post.content
    : "(tanpa teks)";

  await prisma.folioPost.delete({ where: { id: post.id } });
  for (const img of post.images) {
    await deleteImageFile(img.imagePath);
  }

  // No `link` — the post is gone, so the notification is purely informational.
  await notifyUser(post.authorId, {
    title: "⚠️ Pos Anda Dipadam Oleh Admin",
    message: `Pos: "${snippet}"\n\nSebab: ${parsed.data.reason}`,
  });

  bumpCaches();
  revalidatePath("/admin/laporan");
  return { ok: true };
}

/**
 * Admin dismisses a single report — flips status to RESOLVED without
 * touching the post. Use when the report is invalid.
 */
export async function dismissFolioReport(
  raw: unknown,
): Promise<ActionResult> {
  const session = await auth();
  if (!session) return { ok: false, error: "Sesi tidak sah." };
  if (session.user.role !== "ADMIN") {
    return { ok: false, error: "Hanya admin dibenarkan." };
  }

  const parsed = dismissReportSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Input tidak sah." };

  await prisma.folioPostReport.update({
    where: { id: parsed.data.reportId },
    data: { status: "RESOLVED" },
  });

  revalidatePath("/admin/laporan");
  return { ok: true };
}
