import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Safe resolution for Next.js standalone mode inside Docker containers
  const baseUploadsDir = fs.existsSync("/app/uploads")
    ? "/app/uploads"
    : path.join(process.cwd(), "uploads");

  // params.path arrives as an array, e.g., ["avatars", "filename.png"]
  const fullPath = path.join(baseUploadsDir, ...params.path);

  try {
    if (!fs.existsSync(fullPath)) {
      console.error("== PROXY 404 == File missing at path:", fullPath);
      return new NextResponse("File Not Found", { status: 404 });
    }

    // Read file stream data
    const fileBuffer = fs.readFileSync(fullPath);

    // Dynamic Header Content-Type detection
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
    console.error("== PROXY CRASH == Exception thrown:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}