"use client";

import { useMemo, useState } from "react";
import {
  IconCalendar,
  IconCheck,
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
                <div key={v.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:flex-nowrap">
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
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
