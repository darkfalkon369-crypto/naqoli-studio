import { NextResponse } from "next/server";
import { publishVideo } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id نامعتبر" }, { status: 400 });
  const row = await publishVideo(id, true);
  if (!row) return NextResponse.json({ error: "ویدئو پیدا نشد" }, { status: 404 });
  return NextResponse.json(row);
}
