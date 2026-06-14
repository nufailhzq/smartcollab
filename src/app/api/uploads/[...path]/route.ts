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

  // Exact target match for the app_uploads named volume mounted in Docker.
  const baseUploadsDir = "/app/public/uploads";
  const fullPath = path.join(baseUploadsDir, ...filePathArray);

  try {
    if (!fs.existsSync(fullPath)) {
      return new NextResponse("File Not Found", { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = "image/png";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    if (ext === ".gif") contentType = "image/gif";
    if (ext === ".webp") contentType = "image/webp";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[PROXY CRASH]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}