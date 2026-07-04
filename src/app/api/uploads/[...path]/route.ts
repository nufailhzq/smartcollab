import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const filePathArray = params.path;

  // Reject path-traversal before joining — no segment may be ".." or contain a
  // slash that could escape the uploads root.
  if (filePathArray.some((seg) => seg === ".." || seg.includes("/") || seg.includes("\\"))) {
    return new NextResponse("File Not Found", { status: 404 });
  }

  // In Docker the app_uploads volume is mounted at /app/public/uploads; locally
  // the files live under <cwd>/public/uploads. Try the Docker path first, then
  // fall back to the local one so this route works in both environments.
  const dockerDir = "/app/public/uploads";
  const localDir = path.join(process.cwd(), "public", "uploads");
  const candidate = path.join(dockerDir, ...filePathArray);
  const fullPath = fs.existsSync(candidate)
    ? candidate
    : path.join(localDir, ...filePathArray);

  try {
    if (!fs.existsSync(fullPath)) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();

    // Map extension → content type. PDFs/images/office docs get a correct type
    // so the browser can render them INLINE instead of downloading.
    const TYPES: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".svg": "image/svg+xml",
      ".pdf": "application/pdf",
      ".txt": "text/plain; charset=utf-8",
      ".doc": "application/msword",
      ".docx":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ".xls": "application/vnd.ms-excel",
      ".xlsx":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ".ppt": "application/vnd.ms-powerpoint",
      ".pptx":
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
    };
    const contentType = TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        // Inline so PDFs/images open in the browser tab rather than downloading.
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[PROXY CRASH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}