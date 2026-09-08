import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import {
  AUTH_COOKIE,
  authToken,
  getAuthSecret,
  hashPassword,
  isStrongEnough,
  verifyPassword,
} from "@/lib/auth";
import { addLog, getSettings } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

/** GET → { configured, authed } */
export async function GET(req: Request) {
  const secret = getAuthSecret();
  const s = await getSettings();
  const authed =
    !!secret && req.headers.get("cookie")?.includes(`${AUTH_COOKIE}=${authToken(secret)}`);
  return NextResponse.json({ configured: Boolean(s.adminPasswordHash), authed });
}

/** POST → { action: "setup" | "login" | "logout" } */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = String(body.action ?? "");
  const secret = getAuthSecret();
  if (!secret) {
    return NextResponse.json({ error: "AUTH_SECRET missing" }, { status: 500 });
  }

  if (action === "logout") {
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, "", { maxAge: 0, path: "/" });
    return res;
  }

  const password = String(body.password ?? "");

  if (action === "setup") {
    const s = await getSettings();
    if (s.adminPasswordHash) {
      return NextResponse.json({ error: "رمز ادمین قبلاً تنظیم شده است" }, { status: 409 });
    }
    if (!isStrongEnough(password)) {
      return NextResponse.json({ error: "رمز باید حداقل ۸ کاراکتر باشد" }, { status: 400 });
    }
    await db
      .update(settings)
      .set({ adminPasswordHash: hashPassword(password) })
      .where(eq(settings.id, 1));
    await addLog("engine", "info", "رمز عبور ادمین برای اولین بار تنظیم شد 🔐");
    const res = NextResponse.json({ ok: true, configured: true });
    res.cookies.set(AUTH_COOKIE, authToken(secret), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  }

  if (action === "change-password") {
    const authed = req.headers
      .get("cookie")
      ?.includes(`${AUTH_COOKIE}=${authToken(secret)}`);
    if (!authed) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (!isStrongEnough(password)) {
      return NextResponse.json({ error: "رمز باید حداقل ۸ کاراکتر باشد" }, { status: 400 });
    }
    await db
      .update(settings)
      .set({ adminPasswordHash: hashPassword(password) })
      .where(eq(settings.id, 1));
    await addLog("engine", "info", "رمز عبور ادمین تغییر کرد 🔐");
    return NextResponse.json({ ok: true });
  }

  if (action === "login") {
    const s = await getSettings();
    if (!s.adminPasswordHash) {
      return NextResponse.json({ error: "ابتدا رمز ادمین را تنظیم کنید" }, { status: 409 });
    }
    if (!verifyPassword(password, s.adminPasswordHash)) {
      await addLog("engine", "error", "یک تلاش ناموفق برای ورود به پنل ثبت شد ⛔");
      return NextResponse.json({ error: "رمز عبور اشتباه است" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set(AUTH_COOKIE, authToken(secret), {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  }

  return NextResponse.json({ error: "action نامعتبر" }, { status: 400 });
}
