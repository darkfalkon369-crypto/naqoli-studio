"use client";

import { useMemo, useState } from "react";
import {
  IconCalendar,
  IconCheck,
  IconCopy,
  IconDownload,
  IconEye,
  IconHeart,
  IconShare,
  IconTiktok,
  IconTrash,
  IconZap,
} from "@/components/icons";
import {
  Badge,
  Btn,
  Card,
  CardHead,
  Empty,
  STATUS_META,
  StatusBadge,
  Toggle,
  cn,
} from "@/components/ui";
import { api, bump, toast, useFetch } from "@/lib/api";
import { categoryOf } from "@/lib/catalog";
import { faCompact, faDateTime, faDuration, faNum, relTime } from "@/lib/format";
import type { Account, BotSettings, Video } from "@/lib/types";

const TABS = [
  { key: "all", label: "همه" },
  { key: "queued", label: "در صف انتشار" },
  { key: "scheduled", label: "زمان‌بندی‌شده" },
  { key: "generating", label: "در حال تولید" },
  { key: "published", label: "منتشرشده" },
];

export default function QueuePage() {
  const [tab, setTab] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const { data: videos } = useFetch<Video[]>("/api/videos");
  const { data: accounts } = useFetch<Account[]>("/api/accounts");
  const { data: settings } = useFetch<BotSettings>("/api/settings");
  const sim = settings?.simulationMode ?? false;

  const list = useMemo(() => {
    const all = videos ?? [];
    return tab === "all" ? all : all.filter((v) => v.status === tab);
  }, [videos, tab]);

  const waiting = (videos ?? []).filter(
    (v) => v.status === "queued" || v.status === "scheduled"
  );

  const accName = (id: number | null) =>
    accounts?.find((a) => a.id === id)?.username ?? "—";

  async function publishNow(v: Video) {
    try {
      await api("/api/videos/publish", { method: "POST", body: JSON.stringify({ id: v.id }) });
      toast(`🚀 «${v.title}» فوری منتشر شد!`);
      bump();
    } catch {
      toast("خطا در انتشار فوری");
    }
  }

  async function publishAll() {
    for (const v of waiting) {
      await api("/api/videos/publish", { method: "POST", body: JSON.stringify({ id: v.id }) });
    }
    toast(`🚀 ${faNum(waiting.length)} ویدئو به‌صورت فوری منتشر شد`);
    bump();
  }

  async function remove(v: Video) {
    await api(`/api/videos?id=${v.id}`, { method: "DELETE" });
    toast("ویدئو حذف شد");
    bump();
  }

  function startRender(v: Video) {
    toast("🎬 رندر ویدیو شروع شد — حدود یک دقیقه طول می‌کشد");
    api("/api/videos/render", {
      method: "POST",
      body: JSON.stringify({ id: v.id }),
    }).catch((e) => {
      toast(e instanceof Error ? e.message : "خطا در رندر ویدیو");
      bump();
    });
    bump();
  }

  async function toggleAutoPublish(v: boolean) {
    await api("/api/settings", { method: "PATCH", body: JSON.stringify({ autoPublish: v }) });
    toast(v ? "🗓️ زمان‌بندی و انتشار خودکار فعال شد" : "انتشار خودکار متوقف شد");
    bump();
  }

  return (
    <div className="space-y-5">
      {/* control bar */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="animate-pop flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-teal-100 text-teal-600">
            <IconCalendar className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">انتشار خودکار</p>
            <p className="text-[11px] text-ink-500">زمان‌بندی هوشمند در ساعت طلایی</p>
          </div>
          <Toggle checked={!!settings?.autoPublish} onChange={toggleAutoPublish} />
        </Card>
        <Card className="animate-pop flex items-center gap-3 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-coral-100 text-coral-600">
            <IconTiktok className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">آماده انتشار</p>
            <p className="text-[11px] text-ink-500">{faNum(waiting.length)} ویدئو در نوبت</p>
          </div>
          <Badge tone="coral">{faNum(waiting.length)}</Badge>
        </Card>
        <Card className="animate-pop flex items-center gap-3 p-4">
          <div className="flex-1">
            <p className="text-sm font-bold">انتشار فوری همه</p>
            <p className="text-[11px] text-ink-500">همه ویدئوهای در نوبت همین حالا آپلود شوند</p>
          </div>
          <Btn variant="dark" onClick={publishAll} disabled={waiting.length === 0}>
            <IconZap className="h-4 w-4" />
            انتشار
          </Btn>
        </Card>
      </div>

      {/* tabs + list */}
      <Card className="animate-pop">
        <CardHead
          icon={<IconTiktok className="h-5 w-5" />}
          title="ویدئوهای پایپ‌لاین"
          sub="از لحظه تولید تا انتشار در تیک‌تاک"
        />
        <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
          {TABS.map((t) => {
            const count =
              t.key === "all" ? videos?.length ?? 0 : videos?.filter((v) => v.status === t.key).length ?? 0;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-bold transition-all",
                  tab === t.key
                    ? "bg-ink-900 text-cream shadow-pop"
                    : "bg-ink-900/5 text-ink-500 hover:bg-ink-900/10"
                )}
              >
                {t.label}
                <span className="ms-1.5 opacity-60">{faNum(count)}</span>
              </button>
            );
          })}
        </div>

        {list.length === 0 ? (
          <Empty text="موردی در این وضعیت نیست" />
        ) : (
          <div className="divide-y divide-line">
            {list.map((v) => {
              const cat = categoryOf(v.category);
              return (
                <div key={v.id}>
                <div className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:flex-nowrap">
                  <div className="relative shrink-0">
                    <img
                      src={v.thumbnail}
                      alt=""
                      className="h-16 w-11 rounded-lg object-cover ring-1 ring-line"
                    />
                    <span className="absolute -bottom-1.5 -start-1.5 grid h-6 w-6 place-items-center rounded-full bg-paper text-sm shadow ring-1 ring-line">
                      {cat.emoji}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{v.title}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-ink-500">
                      <span className={cn("rounded-full px-2 py-0.5 font-bold", cat.chip)}>{v.category}</span>
                      <span>⏱️ {faDuration(v.durationSec)}</span>
                      <span dir="ltr">@{accName(v.accountId)}</span>
                      {v.scheduledAt && v.status === "scheduled" && (
                        <span className="font-bold text-aqua-500">🗓️ {faDateTime(v.scheduledAt)}</span>
                      )}
                      {v.status === "published" && v.publishedAt && (
                        <span>{relTime(v.publishedAt)}</span>
                      )}
                    </p>
                  </div>

                  {v.status === "published" ? (
                    <div className="flex items-center gap-3 text-[11px] font-bold text-ink-700">
                      {settings?.simulationMode && <Badge tone="sun">نمونه 🎭</Badge>}
                      <span className="inline-flex items-center gap-1">
                        <IconEye className="h-3.5 w-3.5 text-coral-500" /> {faCompact(v.views)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <IconHeart className="h-3.5 w-3.5 text-coral-500" /> {faCompact(v.likes)}
                      </span>
                      <span className="hidden items-center gap-1 sm:inline-flex">
                        <IconShare className="h-3.5 w-3.5 text-coral-500" /> {faCompact(v.shares)}
                      </span>
                    </div>
                  ) : (
                    <StatusBadge status={v.status} />
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                      title="خروجی ویدیو و کپشن"
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg transition-colors",
                        expanded === v.id
                          ? "bg-coral-500 text-white"
                          : "bg-coral-100 text-coral-600 hover:bg-coral-500 hover:text-white"
                      )}
                    >
                      <IconDownload className="h-4 w-4" />
                    </button>
                    {(v.status === "queued" || v.status === "scheduled" || v.status === "generating") && (
                      <button
                        onClick={() => publishNow(v)}
                        title="انتشار فوری"
                        className="grid h-8 w-8 place-items-center rounded-lg bg-teal-100 text-teal-600 transition-colors hover:bg-teal-500 hover:text-white"
                      >
                        <IconCheck className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => remove(v)}
                      title="حذف"
                      className="grid h-8 w-8 place-items-center rounded-lg bg-[#fde3e1] text-ruby-500 transition-colors hover:bg-ruby-500 hover:text-white"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {expanded === v.id && (
                  <OutputPanel v={v} onRender={() => startRender(v)} />
                )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════ Video output panel (render, download, caption) ═══════════════

function OutputPanel({ v, onRender }: { v: Video; onRender: () => void }) {
  const ready = Boolean(v.fileUrl) && v.renderStatus !== "rendering";
  const rendering = v.renderStatus === "rendering";

  async function copyCaption() {
    try {
      await navigator.clipboard.writeText(v.caption || "");
      toast("کپشن کپی شد — در تیک‌تاک جای‌گذاری کنید 📋");
    } catch {
      toast("کپی ناموفق بود");
    }
  }

  return (
    <div className="animate-pop grid gap-4 border-t border-dashed border-line bg-cream/60 px-5 py-4 lg:grid-cols-[240px_1fr]">
      {/* video side */}
      <div className="space-y-2.5">
        <div className="relative overflow-hidden rounded-xl bg-ink-900 ring-1 ring-line">
          {ready ? (
            <video src={v.fileUrl} controls playsInline className="aspect-[9/16] w-full object-cover" />
          ) : (
            <>
              <img src={v.thumbnail} alt="" className="aspect-[9/16] w-full object-cover opacity-70" />
              {rendering && (
                <div className="absolute inset-0 grid place-items-center bg-ink-900/60">
                  <div className="text-center">
                    <span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-cream border-t-coral-500" />
                    <p className="mt-2 text-[10px] font-bold text-cream">در حال ساخت فایل ویدیو…</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {ready ? (
          <a
            href={v.fileUrl}
            download={`naqoli-${v.id}.mp4`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_0_0_var(--color-teal-700)] transition-all hover:bg-teal-600 active:translate-y-0.5 active:shadow-none"
          >
            <IconDownload className="h-4 w-4" />
            دانلود فایل ویدیو (MP4)
          </a>
        ) : (
          <button
            onClick={onRender}
            disabled={rendering}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-coral-500 px-4 py-2.5 text-xs font-bold text-white shadow-[0_4px_0_0_var(--color-coral-700)] transition-all hover:bg-coral-600 active:translate-y-0.5 active:shadow-none disabled:pointer-events-none disabled:opacity-60"
          >
            {rendering ? "در حال رندر… (حدود ۱ دقیقه)" : "🎞️ ساخت فایل ویدیو برای دانلود"}
          </button>
        )}
        <p className="text-center text-[9px] leading-4 text-ink-300">
          خروجی عمودی ۱۰۸۰×۱۹۲۰ — آماده آپلود دستی در تیک‌تاک
        </p>
      </div>

      {/* caption side */}
      <div className="flex flex-col">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-bold text-ink-700">📝 کپشن آماده انتشار</p>
          <button
            onClick={copyCaption}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-1.5 text-[10px] font-bold text-cream transition-colors hover:bg-ink-700"
          >
            <IconCopy className="h-3 w-3" />
            کپی کپشن
          </button>
        </div>
        <div className="flex-1 rounded-xl border-2 border-dashed border-line bg-paper p-4">
          {v.caption ? (
            <p className="whitespace-pre-line text-xs leading-7 text-ink-800">{v.caption}</p>
          ) : (
            <p className="text-xs text-ink-300">
              کپشن ندارد — با زدن «ساخت فایل ویدیو» خودکار ساخته می‌شود.
            </p>
          )}
        </div>
        <p className="mt-2 text-[10px] leading-5 text-ink-500">
          ۱. ویدیو را دانلود کنید ← ۲. در اپ تیک‌تاک «+» را بزنید و آپلود کنید ← ۳. این کپشن را
          در فیلد توضیحات جای‌گذاری کنید.
        </p>
      </div>
    </div>
  );
}
