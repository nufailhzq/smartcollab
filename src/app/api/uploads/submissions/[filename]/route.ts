import { NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";
import { auth } from "@/lib/auth";

const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  zip: "application/zip",
  rar: "application/vnd.rar",
  txt: "text/plain",
};

export async function GET(
  _request: Request,
  { params }: { params: { filename: string } },
) {
  // Submitted files are private — only authenticated users may fetch them.
  const session = await auth();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const filename = params.filename;
  if (!filename || filename.includes("/") || filename.includes("..")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const rootDir = process.cwd();
  const pathsToTry = [
    "/app/public/uploads/submissions/" + filename,
    path.join(rootDir, "public/uploads/submissions", filename),
    path.join(rootDir, "../public/uploads/submissions", filename),
    path.join(rootDir, ".next/standalone/public/uploads/submissions", filename),
  ];

  // Original name lives after the "__" delimiter in the stored filename.
  const idx = filename.indexOf("__");
  const downloadName = idx >= 0 ? filename.slice(idx + 2) : filename;
  const ext = downloadName.split(".").pop()?.toLowerCase() ?? "";
  const mimeType = MIME_BY_EXT[ext] ?? "application/octet-stream";
  // PDFs and images can render inline; everything else downloads.
  const inline = mimeType.startsWith("image/") || mimeType === "application/pdf";

  for (const filePath of pathsToTry) {
    try {
      const buffer = await fs.readFile(filePath);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${encodeURIComponent(downloadName)}"`,
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      continue;
    }
  }

  return new NextResponse("Submission file not found on storage disk", { status: 404 });
}
