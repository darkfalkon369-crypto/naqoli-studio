import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { addLog } from "@/lib/pipeline";
import { fetchRealStats } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

export const REASON_FA: Record<string, string> = {
  ok: "آمار واقعی از تیک‌تاک دریافت شد",
  not_found: "این نام کاربری در تیک‌تاک پیدا نشد",
  captcha: "تیک‌تاک از آی‌پی این سرور چالش تأیید (کپچا) خواست — آمار واقعی از این سرور قابل دریافت نیست",
  blocked: "تیک‌تاک درخواست این سرور را مسدود کرد — آمار واقعی از این آی‌پی ممکن نیست",
  timeout: "پاسخ تیک‌تاک بیش از حد طول کشید",
  network: "خطای شبکه در ارتباط با تیک‌تاک",
};

/** Fetch REAL follower/video counts from TikTok and store them. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  const [acc] = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  if (!acc) return NextResponse.json({ error: "حساب پیدا نشد" }, { status: 404 });

  const result = await fetchRealStats(acc.username, acc.sessionCookie || undefined);

  if (result.reason !== "ok" || !result.profile) {
    return NextResponse.json({
      ok: false,
      reason: result.reason,
      message: REASON_FA[result.reason] ?? REASON_FA.blocked,
    });
  }

  const p = result.profile;
  await db
    .update(accounts)
    .set({
      followers: p.followerCount,
      videosCount: p.videoCount,
      displayName: p.displayName || acc.displayName,
      avatar: p.avatar || acc.avatar,
      statsSource: "real",
      statsUpdatedAt: new Date(),
    })
    .where(eq(accounts.id, acc.id));

  await addLog(
    "tiktok",
    "info",
    `آمار واقعی @${acc.username} از تیک‌تاک دریافت شد: ${p.followerCount} دنبال‌کننده، ${p.videoCount} ویدئو ✅`
  );

  return NextResponse.json({
    ok: true,
    reason: "ok",
    followers: p.followerCount,
    videosCount: p.videoCount,
    hearts: p.heartCount,
    message: REASON_FA.ok,
  });
}
