import { NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  const filename = params.filename;
  if (!filename || filename.includes("/") || filename.includes("..")) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const rootDir = process.cwd();
  // Folio post/comment images are SAVED to public/uploads/folio (singular) by
  // src/server/actions/folio.ts. This proxy route is /folios (plural), so read
  // from the singular save dir here.
  const pathsToTry = [
    "/app/public/uploads/folio/" + filename, // Direct volume target inside container
    path.join(rootDir, "public/uploads/folio", filename),
    path.join(rootDir, "../public/uploads/folio", filename),
    path.join(rootDir, ".next/standalone/public/uploads/folio", filename)
  ];

  for (const filePath of pathsToTry) {
    try {
      const buffer = await fs.readFile(filePath);
      const ext = filename.split(".").pop()?.toLowerCase();

      let mimeType = "application/octet-stream";
      if (ext === "png") mimeType = "image/png";
      else if (ext === "jpg" || ext === "jpeg") mimeType = "image/jpeg";
      else if (ext === "webp") mimeType = "image/webp";
      else if (ext === "gif") mimeType = "image/gif";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      continue;
    }
  }
  return new NextResponse("Not Found", { status: 404 });
}