import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchStudents } from "@/server/queries/folio";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ hits: [] }, { status: 401 });

  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  if (q.trim().length === 0) return NextResponse.json({ hits: [] });

  const hits = await searchStudents(q, 10);
  return NextResponse.json({ hits });
}
