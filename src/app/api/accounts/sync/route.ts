import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { getSettings } from "@/lib/pipeline";
import { fetchRealStats } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  const [acc] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  if (!acc) return NextResponse.json({ error: "حساب پیدا نشد" }, { status: 404 });

  const s = await getSettings();

  // REAL mode: pull the true numbers from TikTok
  if (!s.simulationMode) {
    const r = await fetchRealStats(acc.username, acc.sessionCookie || undefined);
    if (r.reason === "ok" && r.profile) {
      await db
        .update(accounts)
        .set({
          followers: r.profile.followerCount,
          videosCount: r.profile.videoCount,
          avatar: r.profile.avatar || acc.avatar,
          statsSource: "real",
          statsUpdatedAt: new Date(),
        })
        .where(eq(accounts.id, acc.id));
      return NextResponse.json({ mode: "real", ok: true, followers: r.profile.followerCount });
    }
    return NextResponse.json({ mode: "real", ok: false, reason: r.reason });
  }

  // DEMO mode: fabricated increment, clearly marked as simulated
  const gain = 80 + Math.floor(Math.random() * 420);
  await db
    .update(accounts)
    .set({
      followers: acc.followers + gain,
      statsSource: "sim",
      statsUpdatedAt: new Date(),
    })
    .where(eq(accounts.id, acc.id));
  return NextResponse.json({ mode: "sim", ok: true, gain });
}
