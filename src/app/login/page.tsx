"use client";

import { useEffect, useState } from "react";
import { IconBot, IconCheck, IconKey, IconShield } from "@/components/icons";
import { Btn, Card } from "@/components/ui";
import { api, toast } from "@/lib/api";

interface AuthStatus {
  configured: boolean;
  authed: boolean;
}

export default function LoginPage() {
  const [status, setStatus] = useState<AuthStatus | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api<AuthStatus>("/api/auth")
      .then((s) => {
        if (s.authed) {
          window.location.href = "/";
          return;
        }
        setStatus(s);
      })
      .catch(() => setStatus({ configured: true, authed: false }));
  }, []);

  async function submit() {
    setError("");
    if (!status) return;
    if (!status.configured) {
      if (password !== confirm) {
        setError("رمزها با هم یکسان نیستند");
        return;
      }
      if (password.length < 8) {
        setError("رمز باید حداقل ۸ کاراکتر باشد");
        return;
      }
    }
    setBusy(true);
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({
          action: status.configured ? "login" : "setup",
          password,
        }),
      });
      window.location.href = "/";
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در ورود");
      setBusy(false);
    }
  }

  const firstRun = status !== null && !status.configured;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto grid h-16 w-16 animate-floaty place-items-center rounded-2xl bg-coral-500 text-white shadow-[0_6px_0_0_var(--color-coral-700)]">
            <IconBot className="h-9 w-9" />
          </span>
          <h1 className="mt-4 font-display text-3xl text-ink-900">نقلی‌استودیو</h1>
          <p className="mt-1 text-xs text-ink-500">
            ربات خودکار تولید و انتشار ویدئوی کودک در تیک‌تاک
          </p>
        </div>

        <Card className="animate-pop p-6">
          {status === null ? (
            <div className="h-40 animate-pulse rounded-lg bg-ink-900/4" />
          ) : (
            <>
              {firstRun ? (
                <>
                  <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-teal-100 bg-teal-50 p-3.5 text-xs leading-6 text-teal-700">
                    <IconShield className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>
                      <b>نصب جدید شناسایی شد!</b> برای محافظت از پنل، رمز عبور مدیر را تعیین
                      کنید. این رمز برای ورود به همین پنل استفاده می‌شود.
                    </p>
                  </div>
                  <p className="mb-3 font-display text-xl text-ink-900">تنظیم رمز مدیر 🔐</p>
                </>
              ) : (
                <p className="mb-4 font-display text-xl text-ink-900">ورود به پنل مدیریت</p>
              )}

              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-bold text-ink-700">رمز عبور</p>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      placeholder={firstRun ? "حداقل ۸ کاراکتر" : "••••••••"}
                      className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-sm outline-none focus:border-coral-500 focus:bg-paper"
                      autoFocus
                    />
                    <IconKey className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
                  </div>
                </div>
                {firstRun && (
                  <div>
                    <p className="mb-1.5 text-xs font-bold text-ink-700">تکرار رمز عبور</p>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-sm outline-none focus:border-coral-500 focus:bg-paper"
                    />
                  </div>
                )}

                {error && (
                  <p className="rounded-lg bg-[#fde3e1] px-3 py-2 text-xs font-bold text-ruby-500">
                    {error}
                  </p>
                )}

                <Btn onClick={submit} disabled={busy || !password} className="w-full py-3">
                  {busy
                    ? "لطفاً صبر کنید…"
                    : firstRun
                      ? "تنظیم رمز و ورود به پنل"
                      : "ورود"}
                </Btn>
              </div>

              {firstRun && (
                <div className="mt-5 space-y-2 border-t border-line pt-4">
                  <p className="text-[11px] font-bold text-ink-500">پس از ورود، این مراحل را کامل کنید:</p>
                  {[
                    "اتصال حساب تیک‌تاک (راهنمای گام‌به‌گام داخل پنل)",
                    "وارد کردن توکن ربات تلگرام از BotFather",
                    "ساخت اولین ویدئو با موتور خودکار",
                  ].map((t) => (
                    <p key={t} className="flex items-center gap-2 text-[11px] text-ink-700">
                      <IconCheck className="h-3.5 w-3.5 text-leaf-600" />
                      {t}
                    </p>
                  ))}
                </div>
              )}
            </>
          )}
        </Card>

        <p className="mt-4 text-center text-[10px] text-ink-300">
          دسترسی فقط برای مدیر — همه مسیرها و APIها محافظت‌شده هستند
        </p>
      </div>
    </div>
  );
}
