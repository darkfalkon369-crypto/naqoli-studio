import { asc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts, videos } from "@/db/schema";
import { categoryOf } from "@/lib/catalog";
import type { Account, Stats, Video, VideoStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

type VideoRow = typeof videos.$inferSelect;
type AccountRow = typeof accounts.$inferSelect;

function v(v: VideoRow): Video {
  return {
    ...v,
    status: v.status as VideoStatus,
    scheduledAt: v.scheduledAt?.toISOString() ?? null,
    publishedAt: v.publishedAt?.toISOString() ?? null,
    createdAt: v.createdAt.toISOString(),
  };
}

function a(x: AccountRow): Account {
  return {
    ...x,
    // never leak credentials to the client
    accessToken: x.accessToken ? "••••••" : "",
    sessionCookie: x.sessionCookie ? "••••••" : "",
    tokenExpiresAt: x.tokenExpiresAt?.toISOString() ?? null,
    connectedAt: x.connectedAt.toISOString(),
  };
}

export async function GET() {
  const allVideos = await db.select().from(videos).orderBy(asc(videos.publishedAt));
  const allAccounts = await db.select().from(accounts);

  const published = allVideos.filter((x) => x.status === "published");
  const publishedAt = published.filter((x) => x.publishedAt);

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  let views14d = 0;
  let viewsPrev14d = 0;
  const chart: { label: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * day);
    const key = d.toDateString();
    const value = publishedAt
      .filter((x) => new Date(x.publishedAt!).toDateString() === key)
      .reduce((acc, x) => acc + x.views, 0);
    chart.push({
      label: d.toLocaleDateString("fa-IR", { day: "numeric" }),
      value,
    });
    views14d += value;
  }
  for (const x of publishedAt) {
    const age = now - new Date(x.publishedAt!).getTime();
    if (age >= 14 * day && age < 28 * day) viewsPrev14d += x.views;
  }

  const catMap = new Map<string, { count: number; views: number }>();
  for (const x of published) {
    const e = catMap.get(x.category) ?? { count: 0, views: 0 };
    e.count += 1;
    e.views += x.views;
    catMap.set(x.category, e);
  }
  const categories = [...catMap.entries()]
    .map(([name, e]) => ({ name, emoji: categoryOf(name).emoji, ...e }))
    .sort((x, y) => y.views - x.views);

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const stats: Stats = {
    views14d,
    viewsPrev14d,
    totalFollowers: allAccounts.reduce((acc, x) => acc + x.followers, 0),
    publishedCount: published.length,
    readyCount: allVideos.filter(
      (x) => x.status === "queued" || x.status === "scheduled"
    ).length,
    generatingCount: allVideos.filter((x) => x.status === "generating").length,
    generatedToday: allVideos.filter(
      (x) => new Date(x.createdAt).getTime() >= start.getTime()
    ).length,
    chart,
    categories,
    upcoming: allVideos
      .filter((x) => x.status === "scheduled" || x.status === "queued")
      .sort(
        (x, y) =>
          (x.scheduledAt ? new Date(x.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER) -
          (y.scheduledAt ? new Date(y.scheduledAt).getTime() : Number.MAX_SAFE_INTEGER)
      )
      .slice(0, 5)
      .map(v),
    top: [...published].sort((x, y) => y.views - x.views).slice(0, 4).map(v),
    accounts: allAccounts.map(a),
  };

  return NextResponse.json(stats);
}
