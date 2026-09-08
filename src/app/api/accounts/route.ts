import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { addLog } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(accounts);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username ?? "").trim().replace(/^@/, "");
  const displayName = String(body.displayName ?? "").trim();
  if (!username) {
    return NextResponse.json({ error: "نام کاربری الزامی است" }, { status: 400 });
  }
  try {
    const [row] = await db
      .insert(accounts)
      .values({
        username,
        displayName: displayName || username,
        followers: 0,
        videosCount: 0,
        status: "active",
      })
      .returning();
    await addLog("tiktok", "info", `حساب جدید @${username} به ربات متصل شد و آماده انتشار است 🔗`);
    return NextResponse.json(row);
  } catch {
    return NextResponse.json({ error: "این حساب قبلاً متصل شده است" }, { status: 409 });
  }
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  const status = body.status === "paused" ? "paused" : "active";
  const [row] = await db
    .update(accounts)
    .set({ status })
    .where(eq(accounts.id, id))
    .returning();
  if (row) {
    await addLog(
      "tiktok",
      "info",
      status === "active"
        ? `انتشار روی @${row.username} دوباره فعال شد ▶️`
        : `انتشار روی @${row.username} موقتاً متوقف شد ⏸️`
    );
  }
  return NextResponse.json(row);
}
