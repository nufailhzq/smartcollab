import path from "node:path";
import { promises as fs } from "node:fs";
import { randomBytes } from "node:crypto";
import {
  ALLOWED_CHAT_IMAGE_TYPES,
  ALLOWED_CHAT_VIDEO_TYPES,
  MAX_CHAT_FILE_BYTES,
  MAX_CHAT_IMAGE_BYTES,
  MAX_CHAT_VIDEO_BYTES,
  type AttachmentType,
} from "@/schemas/chat";

export const CHAT_UPLOAD_DIR_REL = "public/uploads/chat";
export const CHAT_PUBLIC_URL_BASE = "/api/uploads/chat"; // Kept matching our new API route setup

export type ChatAttachment = {
  path: string;
  type: AttachmentType;
  name: string;
  size: string;
};

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function classifyType(declared: string, mime: string): AttachmentType {
  if (declared === "image" || mime.startsWith("image/")) return "image";
  if (declared === "video" || mime.startsWith("video/")) return "video";
  return "file";
}

/**
 * Save the uploaded file to /public/uploads/chat and return the metadata used
 * by the Message row. The caller picks a `declaredType` ("image" | "video" |
 * "file") so a generic ".pdf" picker doesn't get misclassified by a quirky
 * MIME. Validation always runs against the actual MIME + size.
 */
export async function saveChatAttachment(
  file: File,
  declaredType: AttachmentType,
): Promise<{ ok: true; data: ChatAttachment } | { ok: false; error: string }> {
  const type = classifyType(declaredType, file.type);

  if (type === "image") {
    if (!(ALLOWED_CHAT_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      return { ok: false, error: "Format imej tidak disokong (PNG, JPG, WEBP, GIF)." };
    }
    if (file.size > MAX_CHAT_IMAGE_BYTES) {
      return { ok: false, error: "Saiz imej melebihi 5MB." };
    }
  } else if (type === "video") {
    if (!(ALLOWED_CHAT_VIDEO_TYPES as readonly string[]).includes(file.type)) {
      return { ok: false, error: "Format video tidak disokong (MP4, WEBM, MOV)." };
    }
    if (file.size > MAX_CHAT_VIDEO_BYTES) {
      return { ok: false, error: "Saiz video melebihi 25MB." };
    }
  } else {
    if (file.size > MAX_CHAT_FILE_BYTES) {
      return { ok: false, error: "Saiz fail melebihi 10MB." };
    }
  }

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext || "bin"}`;
  
  // Save using Next.js runtime process tracking directory configurations
  const abs = path.join(process.cwd(), CHAT_UPLOAD_DIR_REL);
  await fs.mkdir(abs, { recursive: true });
  await fs.writeFile(path.join(abs, filename), Buffer.from(await file.arrayBuffer()));

  return {
    ok: true,
    data: {
      path: `${CHAT_PUBLIC_URL_BASE}/${filename}`,
      type,
      name: file.name,
      size: prettySize(file.size),
    },
  };
}

export async function deleteChatAttachment(publicPath: string | null) {
  if (!publicPath) return;
  if (!publicPath.startsWith(CHAT_PUBLIC_URL_BASE + "/")) return;
  const filename = publicPath.slice(CHAT_PUBLIC_URL_BASE.length + 1);
  if (filename.includes("/") || filename.includes("..")) return;
  try {
    await fs.unlink(path.join(process.cwd(), CHAT_UPLOAD_DIR_REL, filename));
  } catch {
    /* missing file is fine */
  }
}