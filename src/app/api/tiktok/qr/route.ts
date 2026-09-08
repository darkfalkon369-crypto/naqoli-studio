import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { addLog } from "@/lib/pipeline";
import {
  checkQrLogin,
  exchangeCode,
  fetchProfile,
  startQrLogin,
} from "@/lib/tiktok";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");

  try {
    if (action === "start") {
      const qr = await startQrLogin();
      return NextResponse.json({ ok: true, ...qr });
    }

    if (action === "check") {
      const token = String(body.token ?? "");
      const ticket = String(body.ticket ?? "");
      if (!token) {
        return NextResponse.json({ error: "token نامعتبر" }, { status: 400 });
      }
      const result = await checkQrLogin(token, ticket);
      if (result.status !== "confirmed" || !result.code) {
        return NextResponse.json({ ok: true, status: result.status, error: result.error });
      }

      // Confirmed → exchange code, fetch profile, upsert the account
      const tokens = await exchangeCode(result.code);
      const profile = await fetchProfile(tokens.accessToken, tokens.openId);

      const existing = await db
        .select()
        .from(accounts)
        .where(eq(accounts.username, profile.username))
        .limit(1);
      const expiresAt = new Date(Date.now() + tokens.expiresIn * 1000);

      if (existing.length > 0) {
        await db
          .update(accounts)
          .set({
            loginMethod: "qr_oauth",
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiresAt: expiresAt,
            avatar: profile.avatar,
            displayName: profile.displayName,
            status: "active",
          })
          .where(eq(accounts.id, existing[0].id));
      } else {
        await db.insert(accounts).values({
          username: profile.username,
          displayName: profile.displayName,
          loginMethod: "qr_oauth",
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          tokenExpiresAt: expiresAt,
          avatar: profile.avatar,
          status: "active",
        });
      }

      await addLog(
        "tiktok",
        "info",
        `حساب @${profile.username} با لاگین رسمی کیوآر متصل شد و توکن دریافت کرد ✅`
      );
      return NextResponse.json({
        ok: true,
        status: "confirmed",
        account: { username: profile.username, displayName: profile.displayName, avatar: profile.avatar },
      });
    }

    return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "خطای ناشناخته";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
