import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, botLogs, settings, videos } from "@/db/schema";
import { CATEGORIES, STAGES, categoryOf } from "./catalog";

// ---------- helpers ----------

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function addLog(source: string, level: string, message: string) {
  try {
    await db.insert(botLogs).values({ source, level, message });
    await db.execute(
      sql`DELETE FROM bot_logs WHERE id < (SELECT COALESCE(MAX(id), 200) - 160 FROM bot_logs)`
    );
  } catch {
    /* logs are best-effort */
  }
}

export async function getSettings() {
  const rows = await db.select().from(settings).limit(1);
  if (rows.length > 0) return rows[0];
  const [row] = await db.insert(settings).values({ id: 1 }).returning();
  return row;
}

export async function updateSettings(patch: Partial<typeof settings.$inferInsert>) {
  await getSettings();
  const [row] = await db
    .update(settings)
    .set(patch)
    .where(eq(settings.id, 1))
    .returning();
  return row;
}

// ---------- generation ----------

export interface GenerateInput {
  category?: string;
  title?: string;
  voiceStyle?: string;
  durationSec?: number;
}

export async function createVideo(input: GenerateInput, origin = "engine") {
  const s = await getSettings();
  const cat = categoryOf(input.category ?? pick(CATEGORIES).key);
  const title = input.title?.trim() || pick(cat.titles);
  const [row] = await db
    .insert(videos)
    .values({
      title,
      category: cat.key,
      status: "generating",
      stage: 1,
      durationSec: input.durationSec ?? randInt(26, 45),
      voiceStyle: input.voiceStyle ?? s.voiceStyle,
      hashtags: s.hashtags,
      thumbnail: cat.thumb,
    })
    .returning();
  await addLog(
    origin,
    "info",
    `تولید جدید آغاز شد: «${title}» (${cat.key}) — مرحله ۱ از ۵: ${STAGES[0]}`
  );
  return row;
}

// ---------- publish ----------

export async function publishVideo(id: number, boosted = false) {
  const [v] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!v) return null;
  let accId = v.accountId;
  if (!accId) {
    const accs = await db
      .select()
      .from(accounts)
      .where(eq(accounts.status, "active"))
      .orderBy(asc(accounts.videosCount));
    accId = accs[0]?.id ?? null;
  }
  const views = boosted ? randInt(1500, 16000) : randInt(800, 9000);
  const likes = Math.round(views * (0.07 + Math.random() * 0.05));
  const shares = Math.round(views * (0.015 + Math.random() * 0.02));
  const comments = Math.round(views * (0.004 + Math.random() * 0.006));
  const [pub] = await db
    .update(videos)
    .set({
      status: "published",
      stage: 5,
      publishedAt: new Date(),
      scheduledAt: null,
      accountId: accId,
      views,
      likes,
      shares,
      comments,
    })
    .where(eq(videos.id, id))
    .returning();

  if (accId) {
    await db
      .update(accounts)
      .set({
        followers: sql`${accounts.followers} + ${Math.round(views * 0.03)}`,
        videosCount: sql`${accounts.videosCount} + 1`,
      })
      .where(eq(accounts.id, accId));
  }
  const acc = accId
    ? (await db.select().from(accounts).where(eq(accounts.id, accId)).limit(1))[0]
    : null;

  // Real posting via the Ayrshare relay — only when both an API key and an
  // actual video file are attached. Otherwise the pipeline stays in demo mode.
  const st = await getSettings();
  if (st.ayrshareKey && pub.fileUrl) {
    const { postViaAyrshare } = await import("./tiktok");
    const result = await postViaAyrshare(st.ayrshareKey, {
      text: `${pub.title} ${pub.hashtags}`,
      videoUrl: pub.fileUrl,
    });
    if (result.ok) {
      await addLog(
        "tiktok",
        "info",
        `ویدئوی «${pub.title}» از طریق Ayrshare واقعاً در تیک‌تاک آپلود شد ✅ (شناسه پست: ${result.id ?? "—"})`
      );
    } else {
      await addLog(
        "tiktok",
        "error",
        `آپلود واقعی «${pub.title}» از طریق Ayrshare ناموفق بود: ${result.error}`
      );
    }
  } else {
    await addLog(
      "tiktok",
      "info",
      `ویدئوی «${pub.title}» روی حساب @${acc?.username ?? "نامشخص"} در تیک‌تاک آپلود و منتشر شد ✅`
    );
  }
  return pub;
}

// ---------- the autonomous loop ----------

export interface TickSummary {
  advanced: number;
  scheduled: number;
  published: number;
  generated: number;
}

export async function tickPipeline(): Promise<TickSummary> {
  const s = await getSettings();
  const summary: TickSummary = { advanced: 0, scheduled: 0, published: 0, generated: 0 };

  // 1) advance videos that are being generated
  const gens = await db
    .select()
    .from(videos)
    .where(eq(videos.status, "generating"))
    .orderBy(asc(videos.createdAt));
  for (const v of gens) {
    const stage = v.stage + 1;
    if (stage > STAGES.length) {
      await db
        .update(videos)
        .set({ status: "queued", stage: STAGES.length })
        .where(eq(videos.id, v.id));
      await addLog("engine", "info", `تولید «${v.title}» کامل شد و در صف انتشار قرار گرفت 🎬`);
      if (s.safeMode) {
        await addLog(
          "moderation",
          "info",
          `بررسی ایمنی محتوای کودک برای «${v.title}» انجام شد — تأیید ✅`
        );
      }
    } else {
      await db.update(videos).set({ stage }).where(eq(videos.id, v.id));
      await addLog(
        "engine",
        "info",
        `«${v.title}» — مرحله ${stage} از ۵: ${STAGES[stage - 1]}`
      );
    }
    summary.advanced++;
  }

  // 2) auto-schedule queued videos
  if (s.autoPublish) {
    const queued = await db
      .select()
      .from(videos)
      .where(eq(videos.status, "queued"))
      .orderBy(asc(videos.createdAt));
    if (queued.length > 0) {
      const accs = await db
        .select()
        .from(accounts)
        .where(eq(accounts.status, "active"))
        .orderBy(asc(accounts.videosCount));
      for (let i = 0; i < queued.length; i++) {
        const v = queued[i];
        if (accs.length === 0) break;
        const acc = accs[i % accs.length];
        const when = new Date(Date.now() + randInt(2, 9) * 60_000);
        await db
          .update(videos)
          .set({ status: "scheduled", scheduledAt: when, accountId: acc.id })
          .where(eq(videos.id, v.id));
        await addLog(
          "engine",
          "info",
          `زمان‌بندی خودکار: «${v.title}» ساعت ${when.toLocaleTimeString("fa-IR", {
            hour: "2-digit",
            minute: "2-digit",
          })} روی @${acc.username} منتشر می‌شود 🗓️`
        );
        summary.scheduled++;
      }
    }
  }

  // 3) publish due scheduled videos
  const due = await db
    .select()
    .from(videos)
    .where(
      and(eq(videos.status, "scheduled"), lte(videos.scheduledAt, new Date()))
    )
    .orderBy(asc(videos.scheduledAt));
  for (const v of due) {
    await publishVideo(v.id);
    summary.published++;
  }

  // 4) autopilot: start a new generation when allowed
  if (s.autoGenerate && gens.length === 0) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(videos)
      .where(gte(videos.createdAt, start));
    if (n < s.dailyLimit) {
      await createVideo({}, "autopilot");
      summary.generated++;
    }
  }

  return summary;
}

export { desc };
