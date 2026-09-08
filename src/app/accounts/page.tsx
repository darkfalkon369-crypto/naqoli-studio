"use client";

import { useEffect, useState } from "react";
import {
  IconCheck,
  IconFilm,
  IconKey,
  IconPlus,
  IconRefresh,
  IconTiktok,
  IconUsers,
  IconZap,
} from "@/components/icons";
import { Badge, Btn, Card, CardHead, Toggle, cn } from "@/components/ui";
import { api, bump, toast, useFetch } from "@/lib/api";
import { faCompact, faDate, faNum } from "@/lib/format";
import type { Account, BotSettings } from "@/lib/types";

export default function AccountsPage() {
  const { data: accounts } = useFetch<Account[]>("/api/accounts");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<number | null>(null);

  const totalFollowers = (accounts ?? []).reduce((a, x) => a + x.followers, 0);
  const totalVideos = (accounts ?? []).reduce((a, x) => a + x.videosCount, 0);

  async function connect() {
    if (!username.trim()) {
      toast("نام کاربری تیک‌تاک را وارد کنید");
      return;
    }
    setConnecting(true);
    try {
      await api("/api/accounts", {
        method: "POST",
        body: JSON.stringify({ username, displayName }),
      });
      toast(`🔗 حساب @${username} با موفقیت متصل شد`);
      setUsername("");
      setDisplayName("");
      bump();
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در اتصال");
    } finally {
      setConnecting(false);
    }
  }

  async function sync(a: Account) {
    setSyncing(a.id);
    await new Promise((r) => setTimeout(r, 900));
    const res = await api<Account & { gain: number }>("/api/accounts/sync", {
      method: "POST",
      body: JSON.stringify({ id: a.id }),
    });
    toast(`🔄 همگام‌سازی شد؛ ${faNum(res.gain)} دنبال‌کننده جدید!`);
    setSyncing(null);
    bump();
  }

  async function toggleStatus(a: Account, active: boolean) {
    await api("/api/accounts", {
      method: "PATCH",
      body: JSON.stringify({ id: a.id, status: active ? "active" : "paused" }),
    });
    bump();
  }

  return (
    <div className="space-y-5">
      {/* summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="animate-pop flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-100 text-teal-600">
            <IconUsers className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl">{faCompact(totalFollowers)}</p>
            <p className="text-[11px] text-ink-500">مجموع دنبال‌کننده‌ها</p>
          </div>
        </Card>
        <Card className="animate-pop flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-coral-100 text-coral-600">
            <IconFilm className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl">{faNum(totalVideos)}</p>
            <p className="text-[11px] text-ink-500">ویدئوی منتشرشده</p>
          </div>
        </Card>
        <Card className="animate-pop flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-sun-100 text-sun-600">
            <IconTiktok className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-2xl">{faNum(accounts?.length ?? 0)}</p>
            <p className="text-[11px] text-ink-500">حساب متصل به ربات</p>
          </div>
        </Card>
      </div>

      {/* connect form */}
      <Card className="animate-pop">
        <CardHead
          icon={<IconPlus className="h-5 w-5" />}
          title="اتصال حساب جدید"
          sub="ربات با مجوز انتشار، ویدئوها را خودکار آپلود می‌کند"
        />
        <div className="flex flex-wrap items-end gap-3 p-5">
          <div className="min-w-44 flex-1">
            <p className="mb-1.5 text-xs font-bold text-ink-700">نام کاربری تیک‌تاک</p>
            <input
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="kids_channel"
              className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 text-sm outline-none focus:border-coral-500 focus:bg-paper"
            />
          </div>
          <div className="min-w-44 flex-1">
            <p className="mb-1.5 text-xs font-bold text-ink-700">نام نمایشی</p>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="کانال کودک من"
              className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 text-sm outline-none focus:border-coral-500 focus:bg-paper"
            />
          </div>
          <Btn onClick={connect} disabled={connecting}>
            {connecting ? "در حال اتصال…" : "اتصال حساب"}
          </Btn>
        </div>
      </Card>

      <TikTokQrCard />
      <SessionCard />
      <AyrshareCard />

      {/* TikTok connection guide */}
      <Card className="animate-pop overflow-hidden">
        <CardHead
          icon={<IconTiktok className="h-5 w-5" />}
          title="راهنمای اتصال تیک‌تاک — آسان یا رسمی؟"
          sub="سه راه برای آپلود خودکار؛ صادقانه و شفاف"
        />
        <div className="grid gap-4 p-5 lg:grid-cols-3">
          <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
            <p className="text-sm font-bold text-teal-700">🟢 راه رسمی (پیشنهادی)</p>
            <p className="mt-1 text-[11px] font-bold text-ink-500">TikTok Content Posting API</p>
            <ol className="mt-2 space-y-1.5 text-[11px] leading-5 text-ink-700">
              <li>۱. در developers.tiktok.com حساب بسازید</li>
              <li>۲. اپلیکیشنی با دسترسی Content Posting API ثبت کنید</li>
              <li>۳. اپ را برای بررسی بفرستید (چند روز طول می‌کشد)</li>
              <li>۴. توکن‌ها را بگیرید و در .env سرور بگذارید</li>
              <li>۵. ری‌استارت سرویس — آپلود واقعاً خودکار می‌شود</li>
            </ol>
            <p className="mt-2 rounded-lg bg-paper p-2 text-[10px] leading-4 text-ink-500">
              💡 با حساب تجاری (Business) ویدئوها مستقیم منتشر می‌شوند؛ با حساب شخصی ابتدا
              «خصوصی/در بررسی» می‌خورند و باید دستی تأیید کنید.
            </p>
          </div>
          <div className="rounded-xl border border-sun-300/50 bg-sun-100/50 p-4">
            <p className="text-sm font-bold text-sun-600">🟡 راه آسان‌تر (سرویس واسط)</p>
            <p className="mt-1 text-[11px] font-bold text-ink-500">بدون دردسر تأیید اپ</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-ink-700">
              <li>• سرویس‌هایی مثل Ayrshare، Metricool یا Publer</li>
              <li>• خودشان مجوز تیک‌تاک را دارند؛ فقط یک API Key می‌گیرید</li>
              <li>• اتصال در چند دقیقه به‌جای چند روز</li>
              <li>• کلید را در .env می‌گذارید و ربات همان‌جا آپلود می‌کند</li>
            </ul>
            <p className="mt-2 rounded-lg bg-paper p-2 text-[10px] leading-4 text-ink-500">
              💰 معمولاً اشتراک ماهانه دارند، ولی سریع‌ترین راه برای شروع واقعی است.
            </p>
          </div>
          <div className="rounded-xl border border-[#fbd0cc] bg-[#fde3e1]/50 p-4">
            <p className="text-sm font-bold text-ruby-500">🔴 ورود مستقیم با یوزرنیم/رمز</p>
            <p className="mt-1 text-[11px] font-bold text-ink-500">توصیه نمی‌شود</p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-ink-700">
              <li>• خلاف قوانین تیک‌تاک است</li>
              <li>• کپچا، تأیید دومرحله‌ای و بلاک‌شدن مکرر نشست‌ها</li>
              <li>• ریسک بالای بن‌شدن دائمی حساب</li>
              <li>• نیاز به نگهداری مداوم و شکننده</li>
            </ul>
            <p className="mt-2 rounded-lg bg-paper p-2 text-[10px] leading-4 text-ink-500">
              ⛔ این پنل عمداً این روش را پیاده نمی‌کند تا حساب شما به خطر نیفتد.
            </p>
          </div>
        </div>
      </Card>

      {/* accounts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(accounts ?? []).map((a) => (
          <Card key={a.id} className="animate-pop overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line bg-cream/60 px-5 py-4">
              {a.avatar ? (
                <img
                  src={a.avatar}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-xl object-cover ring-2 ring-teal-100"
                />
              ) : (
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-900 font-display text-xl text-cream">
                  {a.displayName.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{a.displayName}</p>
                <p dir="ltr" className="truncate text-right text-[11px] text-ink-500">
                  @{a.username}
                </p>
              </div>
              {a.loginMethod === "qr_oauth" ? (
                <Badge tone="teal">
                  <IconCheck className="h-3 w-3" /> اتصال رسمی
                </Badge>
              ) : (
                <Badge tone="ink">اتصال دستی</Badge>
              )}
              {a.status === "active" ? (
                <Badge tone="leaf">فعال</Badge>
              ) : (
                <Badge tone="sun">متوقف موقت</Badge>
              )}
            </div>
            <div className="grid grid-cols-3 divide-x divide-line text-center">
              <div className="px-3 py-4">
                <p className="font-display text-xl">{faCompact(a.followers)}</p>
                <p className="mt-0.5 text-[10px] text-ink-500">دنبال‌کننده</p>
              </div>
              <div className="px-3 py-4">
                <p className="font-display text-xl">{faNum(a.videosCount)}</p>
                <p className="mt-0.5 text-[10px] text-ink-500">ویدئو</p>
              </div>
              <div className="px-3 py-4">
                <p className="font-display text-xl">{faDate(a.connectedAt)}</p>
                <p className="mt-0.5 text-[10px] text-ink-500">تاریخ اتصال</p>
              </div>
            </div>
            <div className="flex items-center gap-2 border-t border-line px-5 py-3.5">
              <Btn
                variant="soft"
                className="flex-1"
                onClick={() => sync(a)}
                disabled={syncing === a.id}
              >
                <IconRefresh className={cn("h-4 w-4", syncing === a.id && "animate-spin")} />
                {syncing === a.id ? "در حال همگام‌سازی…" : "همگام‌سازی آمار"}
              </Btn>
              <div className="flex items-center gap-2 rounded-lg border border-line bg-cream px-3 py-2">
                <span className="text-[10px] font-bold text-ink-500">انتشار خودکار</span>
                <Toggle
                  checked={a.status === "active"}
                  onChange={(vv) => toggleStatus(a, vv)}
                />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ═══════════════ Official TikTok QR login ═══════════════

type QrState = "idle" | "qr" | "expired";

function TikTokQrCard() {
  const { data: settings } = useFetch<BotSettings>("/api/settings");
  const [creds, setCreds] = useState({ key: "", secret: "" });
  const [state, setState] = useState<QrState>("idle");
  const [qrImg, setQrImg] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [qrTicket, setQrTicket] = useState("");
  const [scanStatus, setScanStatus] = useState("new");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // hydrate credential inputs once settings arrive
  useEffect(() => {
    if (settings) {
      setCreds((c) => ({
        key: c.key || settings.tiktokClientKey,
        secret: c.secret || settings.tiktokClientSecret,
      }));
    }
  }, [settings]);

  // poll the QR status
  useEffect(() => {
    if (state !== "qr" || !qrToken) return;
    const t = setInterval(async () => {
      try {
        const r = await api<{
          ok: boolean;
          status: string;
          error?: string;
          account?: { username: string };
        }>("/api/tiktok/qr", {
          method: "POST",
          body: JSON.stringify({ action: "check", token: qrToken, ticket: qrTicket }),
        });
        if (r.error) {
          setError(r.error);
          setState("expired");
          return;
        }
        setScanStatus(r.status);
        if (r.status === "confirmed") {
          setState("idle");
          toast(`🎉 حساب @${r.account?.username ?? ""} با لاگین رسمی متصل شد`);
          bump();
        } else if (r.status === "expired" || r.status === "utilised") {
          setState("expired");
        }
      } catch {
        /* transient network errors are retried on the next tick */
      }
    }, 2500);
    return () => clearInterval(t);
  }, [state, qrToken, qrTicket]);

  async function saveCredsAndStart() {
    setBusy(true);
    setError("");
    try {
      if (creds.key.trim() || creds.secret.trim()) {
        await api("/api/settings", {
          method: "PATCH",
          body: JSON.stringify({
            tiktokClientKey: creds.key.trim(),
            tiktokClientSecret: creds.secret.trim(),
          }),
        });
        bump();
      }
      const r = await api<{ ok: true; qrDataUrl: string; token: string; ticket: string }>(
        "/api/tiktok/qr",
        { method: "POST", body: JSON.stringify({ action: "start" }) }
      );
      setQrImg(r.qrDataUrl);
      setQrToken(r.token);
      setQrTicket(r.ticket);
      setScanStatus("new");
      setState("qr");
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در دریافت کد کیوآر");
    } finally {
      setBusy(false);
    }
  }

  const statusText: Record<string, string> = {
    new: "در انتظار اسکن با اپ تیک‌تاک…",
    scanned: "اسکن شد ✅ حالا تأیید را در اپ بزنید",
    confirmed: "متصل شد!",
  };

  return (
    <Card className="animate-pop overflow-hidden">
      <CardHead
        icon={<IconTiktok className="h-5 w-5" />}
        title="اتصال رسمی با لاگین کیوآر تیک‌تاک"
        sub="اسکن با اپ رسمی — بدون یوزرنیم/رمز، با مجوز رسمی توسعه‌دهنده"
        extra={<Badge tone="teal">OAuth رسمی</Badge>}
      />
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div className="space-y-4">
          <p className="text-xs leading-6 text-ink-700">
            برای لاگین کیوآر به یک اپ در <b dir="ltr">developers.tiktok.com</b> نیاز دارید
            (رایگان). ساخت اپ ۵ دقیقه است؛ دسترسی‌های <code dir="ltr" className="rounded bg-coral-50 px-1 text-[10px]">user.info.basic</code> و{" "}
            <code dir="ltr" className="rounded bg-coral-50 px-1 text-[10px]">video.publish</code> را
            برای آن فعال کنید.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-bold text-ink-700">Client Key</p>
              <input
                dir="ltr"
                value={creds.key}
                onChange={(e) => setCreds((c) => ({ ...c, key: e.target.value }))}
                placeholder="aw7nk86b7czitwc9"
                className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 font-mono text-xs outline-none focus:border-teal-500 focus:bg-paper"
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold text-ink-700">Client Secret</p>
              <input
                dir="ltr"
                value={creds.secret}
                onChange={(e) => setCreds((c) => ({ ...c, secret: e.target.value }))}
                placeholder="••••••••"
                className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 font-mono text-xs outline-none focus:border-teal-500 focus:bg-paper"
              />
            </div>
          </div>
          {error && (
            <p className="rounded-lg bg-[#fde3e1] px-3 py-2 text-xs font-bold text-ruby-500">
              {error}
            </p>
          )}
          <Btn variant="teal" onClick={saveCredsAndStart} disabled={busy} className="w-full">
            {busy
              ? "در حال دریافت کد…"
              : state === "expired"
                ? "دریافت کد کیوآر جدید"
                : "🔐 دریافت کد کیوآر ورود"}
          </Btn>
          {state === "qr" && (
            <p className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-center text-xs font-bold text-teal-700">
              {statusText[scanStatus] ?? scanStatus}
            </p>
          )}
        </div>

        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-cream/60 p-5">
          {state === "qr" && qrImg ? (
            <>
              <img src={qrImg} alt="کد کیوآر ورود تیک‌تاک" className="w-56 rounded-xl ring-1 ring-line" />
              <p className="text-center text-[11px] leading-5 text-ink-500">
                اپ تیک‌تاک را باز کنید ← بخش پروفایل ← آیکون کیوآر بالا ← اسکن این کد ← تأیید
              </p>
            </>
          ) : (
            <>
              <span className="animate-floaty text-5xl">📱</span>
              <p className="text-center text-xs leading-6 text-ink-500">
                کد کیوآر اینجا نمایش داده می‌شود.
                <br />
                با اپ تیک‌تاک اسکنش کنید تا حساب به ربات وصل شود.
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

// ═══════════════ Session cookie connection (no approval needed) ═══════════════

function SessionCard() {
  const [username, setUsername] = useState("");
  const [session, setSession] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ validated: boolean; username: string } | null>(null);
  const [error, setError] = useState("");

  async function connect() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const r = await api<{ ok: true; validated: boolean; account: { username: string } }>(
        "/api/tiktok/session",
        {
          method: "POST",
          body: JSON.stringify({ action: "connect", username, sessionCookie: session }),
        }
      );
      setResult({ validated: r.validated, username: r.account.username });
      toast(r.validated ? "✅ نشست تأیید و حساب متصل شد" : "حساب ذخیره شد — تأیید هنگام انتشار انجام می‌شود");
      bump();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در اتصال");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="animate-pop overflow-hidden">
      <CardHead
        icon={<IconKey className="h-5 w-5" />}
        title="اتصال سریع با نشست وب (بدون نیاز به تأیید)"
        sub="رایگان و فوری — کپی نشست مرورگر، بدون هیچ اپ توسعه‌دهنده‌ای"
        extra={<Badge tone="sun">غیررسمی</Badge>}
      />
      <div className="grid gap-5 p-5 lg:grid-cols-2">
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-bold text-ink-700">نام کاربری تیک‌تاک</p>
            <input
              dir="ltr"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="my_kids_channel"
              className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 text-sm outline-none focus:border-sun-400 focus:bg-paper"
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-bold text-ink-700">Session ID</p>
            <input
              dir="ltr"
              value={session}
              onChange={(e) => setSession(e.target.value)}
              placeholder="مقدار کوکی sessionid"
              className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 font-mono text-xs outline-none focus:border-sun-400 focus:bg-paper"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-[#fde3e1] px-3 py-2 text-xs font-bold text-ruby-500">{error}</p>
          )}
          {result && (
            <p className="rounded-lg border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700">
              {result.validated
                ? `✅ نشست @${result.username} تأیید شد و اتصال برقرار است`
                : `حساب @${result.username} ذخیره شد؛ اعتبارسنجی از این سرور ممکن نشد ولی نشست برای انتشار نگه داشته شد`}
            </p>
          )}
          <Btn variant="dark" onClick={connect} disabled={busy || !username || !session} className="w-full">
            {busy ? "در حال بررسی نشست…" : "🔗 اتصال با این نشست"}
          </Btn>
        </div>
        <div className="rounded-xl border border-sun-300/40 bg-sun-100/40 p-4">
          <p className="text-xs font-bold text-sun-600">📋 چطور Session ID بگیرم؟</p>
          <ol className="mt-2 space-y-1.5 text-[11px] leading-5 text-ink-700">
            <li>۱. در کامپیوتر وارد <b dir="ltr">tiktok.com</b> شوید (با همان حسابی که می‌خواهید وصل کنید)</li>
            <li>۲. کلید <b>F12</b> را بزنید تا ابزار توسعه‌دهنده باز شود</li>
            <li>۳. تب <b dir="ltr">Application</b> ← بخش <b dir="ltr">Cookies</b> ← <b dir="ltr">https://www.tiktok.com</b></li>
            <li>۴. کوکی <b dir="ltr">sessionid</b> را پیدا و مقدارش را کپی کنید</li>
            <li>۵. همین‌جا جای‌گذاری و «اتصال» را بزنید</li>
          </ol>
          <p className="mt-3 rounded-lg bg-paper p-2 text-[10px] leading-4 text-ink-500">
            ⚠️ این روش غیررسمی است؛ نشست هر چند وقت یک‌بار منقضی می‌شود و استفاده زیاد ممکن است
            نیازمند ورود مجدد شود. برای کار جدی و پایدار، مسیر رسمی یا سرویس واسط توصیه می‌شود.
          </p>
        </div>
      </div>
    </Card>
  );
}

// ═══════════════ Ayrshare relay (official, instant, paid) ═══════════════

function AyrshareCard() {
  const { data: settings } = useFetch<BotSettings>("/api/settings");
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings) setKey((k) => k || settings.ayrshareKey);
  }, [settings]);

  async function save() {
    setBusy(true);
    try {
      await api("/api/settings", { method: "PATCH", body: JSON.stringify({ ayrshareKey: key.trim() }) });
      toast("✅ کلید Ayrshare ذخیره شد");
      bump();
    } catch {
      toast("خطا در ذخیره کلید");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="animate-pop overflow-hidden">
      <CardHead
        icon={<IconZap className="h-5 w-5" />}
        title="انتشار از طریق سرویس واسط (Ayrshare)"
        sub="رسمی و فوری — بدون انتظار برای تأیید، فقط با یک کلید"
        extra={settings?.ayrshareKey ? <Badge tone="leaf">متصل</Badge> : <Badge tone="ink">بدون کلید</Badge>}
      />
      <div className="space-y-3 p-5">
        <p className="text-xs leading-6 text-ink-700">
          سرویس‌هایی مثل <b dir="ltr">Ayrshare</b> خودشان مجوز رسمی تیک‌تاک را دارند؛ شما فقط
          حساب‌تان را در سایت آن‌ها وصل می‌کنید و یک <b>API Key</b> می‌گیرید. از آن لحظه، ربات
          ویدئوها را از طریق آن‌ها واقعاً منتشر می‌کند — بدون هیچ انتظار برای تأیید.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-52 flex-1">
            <p className="mb-1.5 text-xs font-bold text-ink-700">API Key</p>
            <input
              dir="ltr"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="AYRSHARE-API-KEY"
              className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 font-mono text-xs outline-none focus:border-teal-500 focus:bg-paper"
            />
          </div>
          <Btn variant="teal" onClick={save} disabled={busy}>
            {busy ? "در حال ذخیره…" : "ذخیره کلید"}
          </Btn>
        </div>
        <p className="rounded-lg border border-line bg-cream p-2.5 text-[10px] leading-5 text-ink-500">
          📌 برای انتشار واقعی، هر ویدئو باید یک فایل واقعی (لینک mp4) داشته باشد؛ کلید که ذخیره
          شود، موتور انتشار به‌صورت خودکار از «حالت دمو» به «آپلود واقعی» تغییر می‌کند.
        </p>
      </div>
    </Card>
  );
}
