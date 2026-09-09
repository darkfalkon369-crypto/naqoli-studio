import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { addLog } from "@/lib/pipeline";
import { validateSession } from "@/lib/tiktok";

export const dynamic = "force-dynamic";

/**
 * Connect a TikTok account with a web session cookie (no developer
 * approval needed). The session is validated against TikTok when
 * possible; otherwise it is stored and marked as unvalidated.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "connect");

  if (action === "connect") {
    const username = String(body.username ?? "").trim().replace(/^@/, "");
    const sessionCookie = String(body.sessionCookie ?? "").trim();
    if (!username || !sessionCookie) {
      return NextResponse.json(
        { error: "نام کاربری و Session ID هر دو لازم هستند" },
        { status: 400 }
      );
    }

    const { profile, reason } = await validateSession(username, sessionCookie);
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
          loginMethod: "session",
          sessionCookie,
          avatar: profile?.avatar ?? existing[0].avatar,
          displayName: profile?.displayName ?? existing[0].displayName,
          status: "active",
        })
        .where(eq(accounts.id, existing[0].id));
    } else {
      await db.insert(accounts).values({
        username: finalUsername,
        displayName: profile?.displayName ?? username,
        loginMethod: "session",
        sessionCookie,
        avatar: profile?.avatar ?? "",
        status: "active",
      });
    }

    await addLog(
      "tiktok",
      "info",
      profile
        ? `حساب @${finalUsername} با نشست وب متصل و اعتبارسنجی شد ✅`
        : `حساب @${finalUsername} با نشست وب ذخیره شد (نتیجه بررسی: ${reason})`
    );

    return NextResponse.json({
      ok: true,
      validated: Boolean(profile),
      reason,
      account: {
        username: finalUsername,
        displayName: profile?.displayName ?? username,
        avatar: profile?.avatar ?? "",
      },
    });
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
