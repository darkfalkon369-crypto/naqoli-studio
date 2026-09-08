"use client";

import { useEffect, useState } from "react";
import {
  IconCheck,
  IconFilm,
  IconPlus,
  IconRefresh,
  IconTiktok,
  IconUsers,
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
