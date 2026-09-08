"use client";

import { useEffect, useState } from "react";
import {
  IconCheck,
  IconGear,
  IconShield,
  IconSparkle,
  IconZap,
} from "@/components/icons";
import { Btn, Card, CardHead, Toggle, cn } from "@/components/ui";
import { api, bump, toast } from "@/lib/api";
import { VOICES } from "@/lib/catalog";
import { faNum } from "@/lib/format";
import type { BotSettings } from "@/lib/types";

export default function SettingsPage() {
  const [s, setS] = useState<BotSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<BotSettings>("/api/settings").then(setS).catch(() => {});
  }, []);

  if (!s) return <Card className="h-64 animate-pulse bg-ink-900/4" />;

  const patch = (p: Partial<BotSettings>) => setS((old) => (old ? { ...old, ...p } : old));

  async function save() {
    if (!s) return;
    setSaving(true);
    try {
      await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          autoGenerate: s.autoGenerate,
          autoPublish: s.autoPublish,
          safeMode: s.safeMode,
          watermark: s.watermark,
          dailyLimit: s.dailyLimit,
          voiceStyle: s.voiceStyle,
          hashtags: s.hashtags,
        }),
      });
      toast("✅ تنظیمات اتوماسیون ذخیره شد");
      bump();
    } catch {
      toast("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
      <Card className="animate-pop">
        <CardHead
          icon={<IconZap className="h-5 w-5" />}
          title="خلبانی خودکار"
          sub="رفتار مستقل ربات را کنترل کنید"
        />
        <div className="divide-y divide-line">
          <SettingRow
            title="تولید خودکار ویدئو"
            desc="ربات طبق سقف روزانه، خودش ایده می‌سازد و تولید می‌کند"
            checked={s.autoGenerate}
            onChange={(v) => patch({ autoGenerate: v })}
          />
          <SettingRow
            title="زمان‌بندی و انتشار خودکار"
            desc="ویدئوهای آماده در بهترین ساعت خودکار در تیک‌تاک آپلود شوند"
            checked={s.autoPublish}
            onChange={(v) => patch({ autoPublish: v })}
          />
          <SettingRow
            title="بررسی ایمنی محتوای کودک"
            desc="هر ویدئو قبل از انتشار توسط فیلتر ایمنی بازبینی شود"
            checked={s.safeMode}
            onChange={(v) => patch({ safeMode: v })}
            icon={<IconShield className="h-4 w-4 text-leaf-600" />}
          />
          <SettingRow
            title="واترمارک برند"
            desc="لوگوی کانال روی همه ویدئوها درج شود"
            checked={s.watermark}
            onChange={(v) => patch({ watermark: v })}
          />
        </div>
      </Card>

      <div className="space-y-5">
        <Card className="animate-pop">
          <CardHead
            icon={<IconSparkle className="h-5 w-5" />}
            title="برنامه تولید روزانه"
            sub="سقف و سبک محتوای روزانه"
          />
          <div className="space-y-5 p-5">
            <div>
              <p className="mb-2 text-xs font-bold text-ink-700">سقف تولید روزانه</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => patch({ dailyLimit: Math.max(1, s.dailyLimit - 1) })}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-cream text-lg font-bold hover:bg-coral-50"
                >
                  −
                </button>
                <div className="flex-1 rounded-xl border border-line bg-cream py-2 text-center">
                  <p className="font-display text-2xl leading-7">{faNum(s.dailyLimit)}</p>
                  <p className="text-[10px] text-ink-500">ویدئو در روز</p>
                </div>
                <button
                  onClick={() => patch({ dailyLimit: Math.min(12, s.dailyLimit + 1) })}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-cream text-lg font-bold hover:bg-coral-50"
                >
                  +
                </button>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-ink-700">سبک پیش‌فرض صداگذاری</p>
              <div className="flex flex-wrap gap-2">
                {VOICES.map((vc) => (
                  <button
                    key={vc}
                    onClick={() => patch({ voiceStyle: vc })}
                    className={cn(
                      "rounded-xl border-2 px-3.5 py-2 text-xs font-bold transition-all",
                      s.voiceStyle === vc
                        ? "border-coral-500 bg-coral-50 text-coral-700"
                        : "border-line bg-paper text-ink-500 hover:border-coral-300"
                    )}
                  >
                    {vc}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-bold text-ink-700">هشتگ‌های ثابت</p>
              <textarea
                value={s.hashtags}
                onChange={(e) => patch({ hashtags: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-sm leading-6 outline-none focus:border-coral-500 focus:bg-paper"
              />
              <p className="mt-1 text-[10px] text-ink-300">
                این هشتگ‌ها به همه ویدئوهای تولیدی اضافه می‌شوند
              </p>
            </div>
          </div>
        </Card>

        <Btn onClick={save} disabled={saving} className="w-full py-3.5 text-base">
          <IconCheck className="h-5 w-5" />
          {saving ? "در حال ذخیره…" : "ذخیره تنظیمات اتوماسیون"}
        </Btn>

        <PasswordCard />
      </div>
    </div>
  );
}

function PasswordCard() {
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function change() {
    if (pass.length < 8) {
      toast("رمز جدید باید حداقل ۸ کاراکتر باشد");
      return;
    }
    if (pass !== confirm) {
      toast("تکرار رمز یکسان نیست");
      return;
    }
    setBusy(true);
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "change-password", password: pass }),
      });
      toast("🔐 رمز عبور با موفقیت تغییر کرد");
      setPass("");
      setConfirm("");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در تغییر رمز");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="animate-pop">
      <CardHead
        icon={<IconShield className="h-5 w-5" />}
        title="امنیت پنل"
        sub="تغییر رمز ورود مدیر"
      />
      <div className="space-y-3 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            type="password"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            placeholder="رمز جدید (حداقل ۸ کاراکتر)"
            className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 text-sm outline-none focus:border-coral-500 focus:bg-paper"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="تکرار رمز جدید"
            className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 text-sm outline-none focus:border-coral-500 focus:bg-paper"
          />
        </div>
        <Btn variant="dark" onClick={change} disabled={busy || !pass} className="w-full">
          {busy ? "در حال تغییر…" : "تغییر رمز عبور"}
        </Btn>
      </div>
    </Card>
  );
}

function SettingRow({
  title,
  desc,
  checked,
  onChange,
  icon,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      {icon}
      <div className="flex-1">
        <p className="text-sm font-bold">{title}</p>
        <p className="mt-0.5 text-[11px] leading-5 text-ink-500">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
