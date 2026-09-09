"use client";

import Link from "next/link";
import { BarsChart } from "@/components/bars-chart";
import {
  IconCalendar,
  IconChart,
  IconEye,
  IconFilm,
  IconHeart,
  IconTelegram,
  IconTiktok,
  IconUsers,
  IconWand,
  IconZap,
} from "@/components/icons";
import { Badge, Card, CardHead, Cover, Empty, Progress, StatusBadge, cn } from "@/components/ui";
import { api, toast, useFetch } from "@/lib/api";
import { CATEGORIES, STAGES, categoryOf } from "@/lib/catalog";
import { faCompact, faNum, relTime } from "@/lib/format";
import type { BotLog, BotSettings, Stats, Video } from "@/lib/types";

const SOURCE_META: Record<string, { label: string; tone: string }> = {
  engine: { label: "موتور تولید", tone: "coral" },
  telegram: { label: "تلگرام", tone: "aqua" },
  tiktok: { label: "تیک‌تاک", tone: "ink" },
  autopilot: { label: "خلبان خودکار", tone: "teal" },
  studio: { label: "استودیو", tone: "sun" },
  moderation: { label: "ایمنی کودک", tone: "leaf" },
};

export default function DashboardPage() {
  const { data: stats } = useFetch<Stats>("/api/stats");
  const { data: logs } = useFetch<BotLog[]>("/api/logs");
  const { data: generating } = useFetch<Video[]>("/api/videos?status=generating");
  const { data: settings, refetch: refetchSettings } = useFetch<BotSettings>("/api/settings");

  if (!stats) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="h-32 animate-pulse bg-ink-900/4" />
        ))}
      </div>
    );
  }

  const delta =
    stats.viewsPrev14d > 0
      ? Math.round(((stats.views14d - stats.viewsPrev14d) / stats.viewsPrev14d) * 100)
      : 100;

  return (
    <div className="space-y-5">
      {settings && (
        <div
          className={
            settings.simulationMode
              ? "animate-pop flex flex-wrap items-center gap-3 rounded-xl border border-sun-300/50 bg-sun-100 px-4 py-3"
              : "animate-pop flex flex-wrap items-center gap-3 rounded-xl border border-leaf-600/30 bg-leaf-100 px-4 py-3"
          }
        >
          <span className="text-xl">{settings.simulationMode ? "🎭" : "✅"}</span>
          <p className="flex-1 text-xs font-bold leading-5 text-ink-800">
            {settings.simulationMode
              ? "حالت شبیه‌سازی روشن است — همه آمارها (بازدید، فالوور، انتشار) نمونه و ساختگی هستند و فقط برای دمو جریان کاری‌اند."
              : "حالت واقعی فعال است — فقط داده‌های تأییدشده نمایش داده می‌شود و هیچ عدد ساختگی تولید نمی‌شود."}
          </p>
          <a href="/settings" className="rounded-lg bg-paper px-3 py-1.5 text-[11px] font-bold text-ink-700 shadow ring-1 ring-line hover:bg-cream">
            تغییر حالت ←
          </a>
        </div>
      )}

      {settings && !settings.onboardingDone && (
        <Onboarding
          settings={settings}
          accounts={stats.accounts.length}
          totalVideos={stats.publishedCount + stats.readyCount + stats.generatingCount}
          onDone={async () => {
            await api("/api/settings", {
              method: "PATCH",
              body: JSON.stringify({ onboardingDone: true }),
            });
            toast("🎉 راهنمای شروع بسته شد — موفق باشید!");
            refetchSettings();
          }}
        />
      )}

      {/* stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="animate-pop p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-ink-500">بازدید ۱۴ روز اخیر</p>
              <p className="mt-1.5 font-display text-3xl">{faCompact(stats.views14d)}</p>
              <Badge tone={delta >= 0 ? "leaf" : "ruby"} className="mt-2">
                {delta >= 0 ? "▲" : "▼"} {faNum(Math.abs(delta))}٪ نسبت به قبل
              </Badge>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-coral-100 text-coral-600">
              <IconEye className="h-5 w-5" />
            </span>
          </div>
        </Card>
        <Card className="animate-pop p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-ink-500">دنبال‌کننده‌ها</p>
              <p className="mt-1.5 font-display text-3xl">{faCompact(stats.totalFollowers)}</p>
              <p className="mt-2 text-[11px] text-ink-500">در {faNum(stats.accounts.length)} حساب متصل</p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-100 text-teal-600">
              <IconUsers className="h-5 w-5" />
            </span>
          </div>
        </Card>
        <Card className="animate-pop p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-ink-500">ویدئوهای منتشرشده</p>
              <p className="mt-1.5 font-display text-3xl">{faNum(stats.publishedCount)}</p>
              <p className="mt-2 text-[11px] text-ink-500">{faNum(stats.generatedToday)} تولید امروز</p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sun-100 text-sun-600">
              <IconFilm className="h-5 w-5" />
            </span>
          </div>
        </Card>
        <Card className="animate-pop p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-ink-500">آماده انتشار</p>
              <p className="mt-1.5 font-display text-3xl">{faNum(stats.readyCount)}</p>
              <p className="mt-2 text-[11px] text-ink-500">
                {faNum(stats.generatingCount)} مورد هم در حال تولید است
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#ece4f9] text-berry-500">
              <IconCalendar className="h-5 w-5" />
            </span>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* chart */}
        <Card className="animate-pop xl:col-span-2">
          <CardHead
            icon={<IconChart className="h-5 w-5" />}
            title="بازدید روزهای اخیر"
            sub="عملکرد ویدئوهای منتشرشده در تیک‌تاک"
            extra={<Badge tone="coral">۱۴ روز گذشته</Badge>}
          />
          <div className="p-5">
            <BarsChart data={stats.chart} />
          </div>
        </Card>

        {/* pipeline live */}
        <Card className="animate-pop">
          <CardHead
            icon={<IconZap className="h-5 w-5" />}
            title="پایپ‌لاین خودکار"
            sub="وضعیت زنده موتور تولید"
          />
          <div className="space-y-3 p-5">
            {(generating ?? []).length === 0 && (
              <div className="rounded-lg border border-dashed border-line bg-cream p-3 text-center text-xs text-ink-500">
                چیزی در حال تولید نیست — خلبان خودکار در حال انتخاب ایده بعدی است…
              </div>
            )}
            {(generating ?? []).map((gv) => {
              const cat = categoryOf(gv.category);
              return (
                <div key={gv.id} className="rounded-lg border border-line bg-cream/60 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.emoji}</span>
                    <p className="flex-1 truncate text-xs font-bold">{gv.title}</p>
                    <StatusBadge status={gv.status} />
                  </div>
                  <Progress
                    value={(gv.stage / STAGES.length) * 100}
                    striped
                    className="mt-3"
                  />
                  <p className="mt-2 text-[10px] text-ink-500">
                    مرحله {faNum(gv.stage)} از ۵ — {STAGES[Math.min(gv.stage, 5) - 1]}
                  </p>
                </div>
              );
            })}
            <div className="space-y-1.5 pt-1">
              {STAGES.map((s, i) => {
                const active = (generating ?? []).some((g) => g.stage === i + 1);
                return (
                  <div
                    key={s}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors",
                      active ? "bg-sun-100 text-sun-600" : "text-ink-500"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-5 w-5 place-items-center rounded-full text-[9px]",
                        active ? "bg-sun-400 text-ink-900" : "bg-ink-900/6 text-ink-500"
                      )}
                    >
                      {faNum(i + 1)}
                    </span>
                    {s}
                    {active && <span className="ms-auto animate-pulse-dot">●</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        {/* upcoming */}
        <Card className="animate-pop">
          <CardHead icon={<IconCalendar className="h-5 w-5" />} title="نوبت انتشار" sub="ویدئوهای در راه تیک‌تاک" />
          <div className="divide-y divide-line">
            {stats.upcoming.length === 0 && <Empty text="صف خالی است؛ خلبان خودکار به‌زودی پر می‌کند!" />}
            {stats.upcoming.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-5 py-3">
                <Cover catKey={u.category} className="h-12 w-8 rounded-md ring-1 ring-line" emojiClass="text-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{u.title}</p>
                  <p className="mt-0.5 text-[10px] text-ink-500">
                    {u.scheduledAt ? `انتشار ${relTime(u.scheduledAt)}` : "در انتظار زمان‌بندی"}
                  </p>
                </div>
                <StatusBadge status={u.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* top videos */}
        <Card className="animate-pop">
          <CardHead icon={<IconHeart className="h-5 w-5" />} title="پرمخاطب‌ترین‌ها" sub="ستاره‌های کانال شما" />
          <div className="divide-y divide-line">
            {stats.top.map((tv, i) => (
              <div key={tv.id} className="flex items-center gap-3 px-5 py-3">
                <span className="font-display text-xl text-coral-300">{faNum(i + 1)}</span>
                <Cover catKey={tv.category} className="h-12 w-8 rounded-md ring-1 ring-line" emojiClass="text-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{tv.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 text-[10px] text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <IconEye className="h-3 w-3" /> {faCompact(tv.views)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <IconHeart className="h-3 w-3" /> {faCompact(tv.likes)}
                    </span>
                  </p>
                </div>
                <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", categoryOf(tv.category).chip)}>
                  {tv.category}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* categories + logs */}
        <div className="space-y-5">
          <Card className="animate-pop">
            <CardHead icon={<IconWand className="h-5 w-5" />} title="عملکرد دسته‌ها" />
            <div className="space-y-3 p-5">
              {stats.categories.slice(0, 4).map((c) => {
                const max = Math.max(1, ...stats.categories.map((x) => x.views));
                const cat = CATEGORIES.find((x) => x.key === c.name);
                return (
                  <div key={c.name}>
                    <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
                      <span>
                        {c.emoji} {c.name}
                        <span className="ms-1 font-normal text-ink-300">({faNum(c.count)} ویدئو)</span>
                      </span>
                      <span className="text-ink-500">{faCompact(c.views)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-ink-900/6">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(c.views / max) * 100}%`,
                          backgroundColor: cat?.bar ?? "#f4552e",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* activity log */}
      <Card className="animate-pop">
        <CardHead
          icon={<IconTelegram className="h-5 w-5" />}
          title="فعالیت زنده ربات"
          sub="گزارش لحظه‌ای موتور، تلگرام و تیک‌تاک"
          extra={
            <Link href="/bot" className="text-xs font-bold text-coral-600 hover:text-coral-700">
              مدیریت ربات ←
            </Link>
          }
        />
        <div className="grid gap-0 divide-y divide-line md:grid-cols-2 md:divide-y-0">
          <div className="md:border-e md:border-line">
            {(logs ?? []).slice(0, 5).map((l) => (
              <LogRow key={l.id} log={l} />
            ))}
          </div>
          <div>
            {(logs ?? []).slice(5, 10).map((l) => (
              <LogRow key={l.id} log={l} />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Onboarding({
  settings,
  accounts,
  totalVideos,
  onDone,
}: {
  settings: BotSettings;
  accounts: number;
  totalVideos: number;
  onDone: () => void;
}) {
  const tokenOk =
    settings.botToken.trim() !== "" && !settings.botToken.includes("YOUR_TELEGRAM");
  const steps = [
    {
      done: true,
      label: "رمز عبور مدیر را تنظیم کردید",
      hint: "پنل فقط برای شما قفل شد",
      href: "",
    },
    {
      done: accounts > 0,
      label: "حساب تیک‌تاک را متصل کنید",
      hint: "راهنمای گام‌به‌گام اتصال داخل صفحه حساب‌هاست",
      href: "/accounts",
    },
    {
      done: tokenOk,
      label: "توکن ربات تلگرام را وارد کنید",
      hint: "از BotFather بگیرید و در بخش ربات تلگرام ذخیره کنید",
      href: "/bot",
    },
    {
      done: totalVideos > 0,
      label: "اولین ویدئو را بسازید",
      hint: "استودیو تولید ← یک دسته انتخاب کنید ← تولید",
      href: "/studio",
    },
  ];
  return (
    <Card className="animate-pop overflow-hidden border-teal-100">
      <div className="flex flex-wrap items-center gap-3 border-b border-line bg-teal-50/70 px-5 py-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-500 text-xl text-white shadow-[0_4px_0_0_var(--color-teal-700)]">
          🚀
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg text-ink-900">راهنمای شروع سریع</h2>
          <p className="text-xs text-ink-500">
            نصب شما خام و آماده است — این چهار قدم را کامل کنید تا ربات تمام‌خودکار شود
          </p>
        </div>
        <button
          onClick={onDone}
          className="rounded-lg border border-line bg-paper px-3 py-2 text-[11px] font-bold text-ink-500 transition-colors hover:bg-cream"
        >
          راهنما را بستن ✕
        </button>
      </div>
      <div className="grid gap-0 divide-y divide-line sm:grid-cols-2 sm:divide-y-0">
        {steps.map((s, i) => {
          const inner = (
            <div className="flex h-full items-start gap-3 px-5 py-4">
              <span
                className={
                  s.done
                    ? "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-leaf-100 text-leaf-600"
                    : "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink-900/6 font-display text-xs text-ink-500"
                }
              >
                {s.done ? "✓" : faNum(i + 1)}
              </span>
              <div className="min-w-0">
                <p className={s.done ? "text-xs font-bold text-ink-300 line-through" : "text-xs font-bold"}>
                  {s.label}
                </p>
                <p className="mt-1 text-[10px] leading-4 text-ink-500">{s.hint}</p>
              </div>
            </div>
          );
          return s.href && !s.done ? (
            <a key={s.label} href={s.href} className="block transition-colors hover:bg-teal-50/50">
              {inner}
            </a>
          ) : (
            <div key={s.label}>{inner}</div>
          );
        })}
      </div>
    </Card>
  );
}

function LogRow({ log }: { log: BotLog }) {
  const m = SOURCE_META[log.source] ?? SOURCE_META.engine;
  return (
    <div className="flex items-start gap-3 px-5 py-3">
      <Badge tone={m.tone} className="mt-0.5 shrink-0">
        {m.label}
      </Badge>
      <p className="flex-1 text-[11px] leading-5 text-ink-700">{log.message}</p>
      <span className="shrink-0 text-[10px] text-ink-300">{relTime(log.createdAt)}</span>
    </div>
  );
}
