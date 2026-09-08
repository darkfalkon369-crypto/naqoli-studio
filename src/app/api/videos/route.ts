import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { addLog, createVideo } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const status = new URL(req.url).searchParams.get("status");
  const rows = status
    ? await db.select().from(videos).where(eq(videos.status, status)).orderBy(desc(videos.createdAt))
    : await db.select().from(videos).orderBy(desc(videos.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const row = await createVideo(
    {
      category: body.category,
      title: body.title,
      voiceStyle: body.voiceStyle,
      durationSec: body.durationSec,
    },
    body.origin === "telegram" ? "telegram" : "studio"
  );
  return NextResponse.json(row);
}

export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "id نامعتبر" }, { status: 400 });
  const [v] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!v) return NextResponse.json({ error: "پیدا نشد" }, { status: 404 });
  await db.delete(videos).where(eq(videos.id, id));
  await addLog("engine", "info", `ویدئوی «${v.title}» توسط ادمین حذف شد 🗑️`);
  return NextResponse.json({ ok: true });
}
