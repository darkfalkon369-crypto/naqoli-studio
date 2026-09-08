"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";
import type { BotSettings } from "@/lib/types";
import {
  IconBook,
  IconBot,
  IconClock,
  IconGear,
  IconGrid,
  IconTelegram,
  IconTiktok,
  IconWand,
  IconZap,
} from "./icons";
import { cn } from "./ui";

const NAV = [
  { href: "/", label: "داشبورد", icon: IconGrid },
  { href: "/studio", label: "استودیو تولید", icon: IconWand },
  { href: "/queue", label: "صف انتشار", icon: IconClock },
  { href: "/accounts", label: "حساب‌های تیک‌تاک", icon: IconTiktok },
  { href: "/bot", label: "ربات تلگرام", icon: IconTelegram },
  { href: "/settings", label: "تنظیمات", icon: IconGear },
  { href: "/setup", label: "آموزش راه‌اندازی", icon: IconBook },
];

const TITLES: Record<string, { title: string; sub: string }> = {
  "/": { title: "داشبورد فرماندهی", sub: "نمای کلی عملکرد ربات و کانال‌ها" },
  "/studio": { title: "استودیو تولید ویدئو", sub: "ایده بده، بقیه‌اش با موتور خودکار" },
  "/queue": { title: "صف انتشار تیک‌تاک", sub: "زمان‌بندی و آپلود خودکار" },
  "/accounts": { title: "حساب‌های تیک‌تاک", sub: "کانال‌های متصل به ربات" },
  "/bot": { title: "ربات تلگرام", sub: "مدیریت ربات و گفتگوی زنده" },
  "/settings": { title: "تنظیمات اتوماسیون", sub: "کنترل کامل رفتار خودکار" },
  "/setup": { title: "آموزش راه‌اندازی روی سرور", sub: "نصب خودکار با یک اسکریپت + اتصال تلگرام و تیک‌تاک" },
};

/** هر ~۲.۵ ثانیه پایپ‌لاین خودکار را جلو می‌برد. */
function AutoPilotEngine() {
  useEffect(() => {
    const run = () => {
      api("/api/pipeline/tick", { method: "POST" })
        .then(() => window.dispatchEvent(new Event("pipeline:tick")))
        .catch(() => {});
    };
    run();
    const t = setInterval(run, 2600);
    return () => clearInterval(t);
  }, []);
  return null;
}

function Toaster() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    const h = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      const t = setTimeout(() => setMsg(null), 2800);
      return () => clearTimeout(t);
    };
    window.addEventListener("toast", h);
    return () => window.removeEventListener("toast", h);
  }, []);
  if (!msg) return null;
  return (
    <div className="animate-pop fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-line bg-ink-900 px-4 py-2.5 text-sm font-bold text-cream shadow-soft">
      <span>✨</span>
      {msg}
    </div>
  );
}

function BotLogo() {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-xl bg-coral-500 text-white shadow-[0_4px_0_0_var(--color-coral-700)]">
      <IconBot className="h-6 w-6" />
    </div>
  );
}

function SideLink({
  href,
  label,
  icon: Icon,
  active,
  compact,
}: {
  href: string;
  label: string;
  icon: typeof IconGrid;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-150",
        compact && "justify-center px-2",
        active
          ? "bg-coral-500 text-white shadow-[0_4px_0_0_var(--color-coral-700)]"
          : "text-cream/70 hover:bg-white/8 hover:text-cream"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!compact && <span>{label}</span>}
    </a>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const meta = TITLES[pathname] ?? TITLES["/"];
  const [settings, setSettings] = useState<BotSettings | null>(null);

  useEffect(() => {
    const load = () =>
      api<BotSettings>("/api/settings")
        .then(setSettings)
        .catch(() => {});
    load();
    const h = () => load();
    window.addEventListener("pipeline:tick", h);
    return () => window.removeEventListener("pipeline:tick", h);
  }, []);

  const autopilot = !!settings && (settings.autoGenerate || settings.autoPublish);
  const today = new Date().toLocaleDateString("fa-IR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen">
      <AutoPilotEngine />
      <Toaster />

      {/* sidebar */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-64 flex-col bg-ink-900 p-4 lg:flex">
        <div className="flex items-center gap-3 px-1 pb-5">
          <BotLogo />
          <div>
            <p className="font-display text-xl leading-6 text-cream">نقلی‌استودیو</p>
            <p className="text-[10px] text-cream/50">ربات خودکار ویدئوی کودک</p>
          </div>
        </div>
        <nav className="flex flex-col gap-1.5">
          {NAV.map((n) => (
            <SideLink key={n.href} {...n} active={pathname === n.href} />
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-3.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute h-full w-full animate-pulse-dot rounded-full bg-leaf-600" />
            </span>
            <p className="text-xs font-bold text-cream">موتور خودکار متصل</p>
          </div>
          <p className="mt-2 text-[10px] leading-5 text-cream/50">
            نسخه موتور ۲.۴ — اتصال تلگرام و تیک‌تاک پایدار
          </p>
        </div>
      </aside>

      {/* mobile top nav */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-ink-900 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <BotLogo />
          {NAV.map((n) => (
            <SideLink key={n.href} {...n} active={pathname === n.href} compact />
          ))}
        </div>
      </div>

      {/* main */}
      <div className="lg:ms-64">
        <header className="sticky top-0 z-30 border-b border-line bg-cream/85 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-6">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl leading-7 text-ink-900 sm:text-2xl">
                {meta.title}
              </h1>
              <p className="text-xs text-ink-500">{meta.sub}</p>
            </div>
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold",
                autopilot
                  ? "border-teal-100 bg-teal-50 text-teal-700"
                  : "border-line bg-paper text-ink-500"
              )}
            >
              <IconZap className="h-3.5 w-3.5" />
              <span className={cn("h-2 w-2 rounded-full", autopilot ? "animate-pulse-dot bg-teal-500" : "bg-ink-300")} />
              {autopilot ? "خلبانی خودکار فعال" : "حالت دستی"}
            </div>
            <span className="hidden rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-bold text-ink-500 sm:block">
              📅 {today}
            </span>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6">
          {children}
        </main>
        <footer className="px-6 pb-8 text-center text-[11px] text-ink-300">
          نقلی‌استودیو — تولید، انتشار و مدیریت خودکار ویدئوهای کودک در تیک‌تاک 🤖
        </footer>
      </div>
    </div>
  );
}
