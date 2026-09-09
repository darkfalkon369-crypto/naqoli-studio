import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { addLog } from "@/lib/pipeline";
import { fetchRealStats } from "@/lib/tiktok";
import { loginWithPassword } from "@/lib/tiktok-browser";

export const dynamic = "force-dynamic";
// headless login can take a while
export const maxDuration = 90;

const STATUS_FA: Record<string, string> = {
  invalid: "نام کاربری یا رمز عبور اشتباه است",
  captcha: "تیک‌تاک کپچا خواست — از آی‌پی سرور رد نمی‌شود",
  twofactor: "حساب تأیید دومرحله‌ای دارد و از این روش وارد نمی‌شود",
  timeout: "تیک‌تاک پاسخ نداد — احتمالاً محدودیت آی‌پی سرور",
};

/**
 * Direct username/password login. The password is used once inside the
 * headless browser and NEVER stored — only the captured session cookie is.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const username = String(body.username ?? "").trim().replace(/^@/, "");
  const password = String(body.password ?? "");

  if (!username || !password) {
    return NextResponse.json(
      { error: "نام کاربری و رمز عبور هر دو لازم هستند" },
      { status: 400 }
    );
  }

  await addLog("tiktok", "info", `تلاش ورود مستقیم برای @${username} آغاز شد (رمز ثبت نمی‌شود)`);

  const result = await loginWithPassword(username, password);

  if (result.status !== "ok" || !result.sessionCookie) {
    const message = STATUS_FA[result.status] ?? result.detail ?? "خطا در ورود";
    await addLog("tiktok", "error", `ورود مستقیم @${username} ناموفق بود: ${message}`);
    return NextResponse.json({
      ok: false,
      status: result.status,
      message: result.detail ?? message,
    });
  }

  // success — try to pull real profile data with the fresh session
  const stats = await fetchRealStats(username, result.sessionCookie);
  const profile = stats.reason === "ok" ? stats.profile : undefined;
  const finalUsername = profile?.username ?? username;

  const existing = await db
    .select()
    .from(accounts)
    .where(eq(accounts.username, finalUsername))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(accounts)
      .set({
        loginMethod: "password",
        sessionCookie: result.sessionCookie,
        avatar: profile?.avatar ?? existing[0].avatar,
        displayName: profile?.displayName ?? existing[0].displayName,
        followers: profile ? profile.followerCount : existing[0].followers,
        videosCount: profile ? profile.videoCount : existing[0].videosCount,
        statsSource: profile ? "real" : existing[0].statsSource,
        statsUpdatedAt: profile ? new Date() : existing[0].statsUpdatedAt,
        status: "active",
      })
      .where(eq(accounts.id, existing[0].id));
  } else {
    await db.insert(accounts).values({
      username: finalUsername,
      displayName: profile?.displayName ?? username,
      loginMethod: "password",
      sessionCookie: result.sessionCookie,
      avatar: profile?.avatar ?? "",
      followers: profile?.followerCount ?? 0,
      videosCount: profile?.videoCount ?? 0,
      statsSource: profile ? "real" : "none",
      statsUpdatedAt: profile ? new Date() : null,
      status: "active",
    });
  }

  await addLog(
    "tiktok",
    "info",
    `ورود مستقیم @${finalUsername} موفق بود — نشست ذخیره شد${profile ? " و آمار واقعی دریافت شد" : ""} ✅`
  );

  return NextResponse.json({
    ok: true,
    status: "ok",
    account: {
      username: finalUsername,
      displayName: profile?.displayName ?? username,
      avatar: profile?.avatar ?? "",
      followers: profile?.followerCount ?? 0,
    },
    message: "ورود موفق — نشست حساب ذخیره شد و رمز عبور شما هیچ‌جا ثبت نشد",
  });
}
