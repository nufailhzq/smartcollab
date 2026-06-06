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

  // Standalone mode path detection setup
  const rootDir = process.cwd();
  
  // We check standard layout path vs Docker standalone directory layouts
  const pathsToTry = [
    path.join(rootDir, "public/uploads/avatars", filename),
    path.join(rootDir, "../public/uploads/avatars", filename), // Standalone root location
    path.join(rootDir, ".next/standalone/public/uploads/avatars", filename)
  ];

  for (const filePath of pathsToTry) {
    try {
      const buffer = await fs.readFile(filePath);
      const ext = filename.split(".").pop()?.toLowerCase();
      
      let mimeType = "image/jpeg";
      if (ext === "png") mimeType = "image/png";
      else if (ext === "webp") mimeType = "image/webp";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      continue; // Try the next layout path if file is missing here
    }
  }

  // If the file is physically missing or was wiped by a container rebuild, 
  // return a 404 text string instead of breaking the browser img component layout
  return new NextResponse("File not found on server storage disk", { status: 404 });
}