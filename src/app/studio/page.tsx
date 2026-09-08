"use client";

import { useMemo, useState } from "react";
import { IconDice, IconSparkle, IconWand, IconZap } from "@/components/icons";
import { VideoCanvas } from "@/components/video-canvas";
import {
  Badge,
  Btn,
  Card,
  CardHead,
  Empty,
  Progress,
  StatusBadge,
  cn,
} from "@/components/ui";
import { api, toast, useFetch } from "@/lib/api";
import { CATEGORIES, STAGES, VOICES, categoryOf } from "@/lib/catalog";
import { faDuration, faNum } from "@/lib/format";
import type { Account, Video } from "@/lib/types";

export default function StudioPage() {
  const [catKey, setCatKey] = useState(CATEGORIES[0].key);
  const [title, setTitle] = useState("");
  const [voice, setVoice] = useState(VOICES[0]);
  const [duration, setDuration] = useState(32);
  const [busy, setBusy] = useState(false);

  const { data: generating } = useFetch<Video[]>("/api/videos?status=generating");
  const { data: accounts } = useFetch<Account[]>("/api/accounts");
  const cat = categoryOf(catKey);

  const activeGen = generating?.[0];
  const previewTitle = activeGen?.title ?? (title || pickTitle(cat.titles));

  function pickTitle(titles: string[]) {
    return titles[Math.floor(Math.random() * titles.length)];
  }

  const activeAccount = useMemo(() => {
    const act = (accounts ?? []).filter((a) => a.status === "active");
    return act[0];
  }, [accounts]);

  async function submit() {
    setBusy(true);
    try {
      await api("/api/videos", {
        method: "POST",
        body: JSON.stringify({
          category: catKey,
          title: title.trim() || undefined,
          voiceStyle: voice,
          durationSec: duration,
        }),
      });
      toast("🎬 سفارش تولید ثبت شد؛ موتور خودکار شروع کرد!");
      setTitle("");
    } catch (e) {
      toast(e instanceof Error ? e.message : "خطا در ثبت سفارش");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-5">
      {/* form */}
      <Card className="animate-pop xl:col-span-3">
        <CardHead
          icon={<IconWand className="h-5 w-5" />}
          title="سفارش ویدئوی جدید"
          sub="دسته را انتخاب کنید؛ بقیه مراحل با موتور خودکار انجام می‌شود"
        />
        <div className="space-y-5 p-5">
          <div>
            <p className="mb-2 text-xs font-bold text-ink-700">دسته محتوای کودک</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCatKey(c.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-all",
                    catKey === c.key
                      ? "border-coral-500 bg-coral-50 text-coral-700 shadow-[0_3px_0_0_var(--color-coral-300)]"
                      : "border-line bg-paper text-ink-700 hover:border-coral-300"
                  )}
                >
                  <span className="text-lg">{c.emoji}</span>
                  {c.key}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-bold text-ink-700">عنوان ویدئو</p>
              <button
                type="button"
                onClick={() => setTitle(pickTitle(cat.titles))}
                className="inline-flex items-center gap-1 rounded-lg bg-sun-100 px-2.5 py-1 text-[11px] font-bold text-sun-600 hover:bg-sun-300/60"
              >
                <IconDice className="h-3.5 w-3.5" />
                پیشنهاد هوش مصنوعی
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={pickTitle(cat.titles)}
              className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-sm font-medium outline-none transition-colors placeholder:text-ink-300 focus:border-coral-500 focus:bg-paper"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-bold text-ink-700">سبک صداگذاری</p>
              <select
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                className="w-full rounded-xl border border-line bg-cream px-3 py-3 text-sm font-medium outline-none focus:border-coral-500"
              >
                {VOICES.map((vc) => (
                  <option key={vc}>{vc}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-2 flex items-center justify-between text-xs font-bold text-ink-700">
                مدت ویدئو
                <span className="rounded-md bg-teal-100 px-2 py-0.5 text-teal-700">
                  {faDuration(duration)}
                </span>
              </p>
              <input
                type="range"
                min={15}
                max={60}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-coral-500"
              />
              <div className="flex justify-between text-[10px] text-ink-300">
                <span>۱۵ ثانیه</span>
                <span>۶۰ ثانیه</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-teal-100 bg-teal-50 p-3.5 text-xs">
            <IconZap className="h-4 w-4 text-teal-600" />
            <p className="flex-1 text-teal-700">
              <b>مسیر خودکار:</b> تولید ۵ مرحله‌ای ← بررسی ایمنی کودک ← زمان‌بندی هوشمند ←
              آپلود روی{" "}
              <span dir="ltr" className="font-bold">
                @{activeAccount?.username ?? "…"}
              </span>
            </p>
          </div>

          <Btn onClick={submit} disabled={busy} className="w-full py-3.5 text-base">
            <IconSparkle className="h-5 w-5" />
            {busy ? "در حال ثبت سفارش…" : "تولید ویدئو با موتور خودکار"}
          </Btn>
        </div>
      </Card>

      {/* preview */}
      <div className="space-y-5 xl:col-span-2">
        <Card className="animate-pop overflow-hidden">
          <CardHead
            icon={<span className="text-lg">{cat.emoji}</span>}
            title="پیش‌نمایش زنده"
            sub={activeGen ? "در حال رندر ویدئوی فعلی" : "پیش‌نمایش قالب انتخابی"}
            extra={activeGen && <StatusBadge status="generating" />}
          />
          <div className="bg-ink-900 p-4">
            <div className="mx-auto max-w-[260px]">
              <VideoCanvas
                cat={activeGen ? categoryOf(activeGen.category) : cat}
                title={previewTitle}
                generatingStage={activeGen ? activeGen.stage : null}
              />
            </div>
          </div>
        </Card>

        <Card className="animate-pop">
          <CardHead
            icon={<IconZap className="h-5 w-5" />}
            title="خط تولید"
            sub={`${faNum(generating?.length ?? 0)} ویدئو در حال ساخت`}
          />
          <div className="divide-y divide-line">
            {!generating || generating.length === 0 ? (
              <Empty text="خط تولید خالی است — یک سفارش ثبت کنید!" />
            ) : (
              generating.map((g) => (
                <div key={g.id} className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryOf(g.category).emoji}</span>
                    <p className="flex-1 truncate text-xs font-bold">{g.title}</p>
                    <Badge tone="sun">
                      مرحله {faNum(g.stage)}/۵
                    </Badge>
                  </div>
                  <Progress
                    value={(g.stage / STAGES.length) * 100}
                    striped
                    tone="bg-sun-400"
                    className="mt-2.5"
                  />
                  <p className="mt-1.5 text-[10px] text-ink-500">
                    {STAGES[Math.min(g.stage, 5) - 1]} — خروجی: تیک‌تاک ۹:۱۶
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
