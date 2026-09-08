"use client";

import { useState } from "react";
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
import type { Account } from "@/lib/types";

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

      {/* accounts grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {(accounts ?? []).map((a) => (
          <Card key={a.id} className="animate-pop overflow-hidden">
            <div className="flex items-center gap-3 border-b border-line bg-cream/60 px-5 py-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-900 font-display text-xl text-cream">
                {a.displayName.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{a.displayName}</p>
                <p dir="ltr" className="truncate text-right text-[11px] text-ink-500">
                  @{a.username}
                </p>
              </div>
              {a.status === "active" ? (
                <Badge tone="leaf">
                  <IconCheck className="h-3 w-3" /> فعال
                </Badge>
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
