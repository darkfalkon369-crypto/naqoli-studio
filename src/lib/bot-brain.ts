import { eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { accounts, videos } from "@/db/schema";
import { faCompact, faNum } from "./format";
import { createVideo, getSettings, publishVideo, updateSettings } from "./pipeline";

export interface ChatResult {
  reply: string;
  action?: string;
}

export async function handleBotMessage(text: string): Promise<ChatResult> {
  const t = text.trim();
  const s = await getSettings();

  const published = await db
    .select()
    .from(videos)
    .where(eq(videos.status, "published"));
  const totalViews = published.reduce((a, v) => a + v.views, 0);
  const accs = await db.select().from(accounts);
  const totalFollowers = accs.reduce((a, x) => a + x.followers, 0);
  const scheduled = await db
    .select()
    .from(videos)
    .where(eq(videos.status, "scheduled"));
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const [{ n: today }] = await db
    .select({ n: sql_count() })
    .from(videos)
    .where(gte(videos.createdAt, start));

  if (t.startsWith("/start") || t === "شروع") {
    return {
      reply:
        "سلام! 👋 به ربات «نقلی‌استودیو» خوش اومدی!\n🤖 من به‌صورت کاملاً خودکار ویدئوهای کودک می‌سازم و در تیک‌تاک منتشر می‌کنم:\n🎬 تولید ایده و فیلم‌نامه با هوش مصنوعی\n🎨 انیمیشن و صداگذاری خودکار\n🗓️ زمان‌بندی و آپلود خودکار در بهترین ساعت\n📊 گزارش لحظه‌ای عملکرد\nبرای دیدن دستورهای من /help را بفرست.",
    };
  }

  if (t.startsWith("/help") || t === "راهنما") {
    return {
      reply:
        "📖 دستورهای ربات:\n/video — ساخت یک ویدئوی جدید همین حالا 🎬\n/stats — گزارش عملکرد کانال‌ها 📊\n/status — وضعیت لحظه‌ای پایپ‌لاین 🤖\n/pause — توقف تولید خودکار ⏸️\n/resume — ادامه تولید خودکار ▶️\n/publish — انتشار فوری همه ویدئوهای در صف 🚀",
    };
  }

  if (t.startsWith("/video") || t === "ویدئو") {
    const v = await createVideo({}, "telegram");
    return {
      reply: `🎬 درخواست شما ثبت شد!\nموتور تولید، ویدئوی «${v.title}» را در دسته «${v.category}» می‌سازد.\n⏱️ حدود ۲ دقیقه دیگر آماده می‌شود و خودکار در صف انتشار قرار می‌گیرد.`,
      action: "generate",
    };
  }

  if (t.startsWith("/stats") || t === "آمار") {
    return {
      reply: `📊 گزارش عملکرد نقلی‌استودیو:\n👁️ مجموع بازدید: ${faCompact(totalViews)}\n❤️ دنبال‌کننده‌ها: ${faCompact(totalFollowers)}\n✅ ویدئوهای منتشرشده: ${faNum(published.length)}\n🗓️ در نوبت انتشار: ${faNum(scheduled.length)}\n🎬 تولید امروز: ${faNum(today)} از ${faNum(s.dailyLimit)}\n${s.autoGenerate ? "🟢 تولید خودکار فعال است" : "🔴 تولید خودکار متوقف است"}`,
    };
  }

  if (t.startsWith("/status") || t === "وضعیت") {
    const generating = await db
      .select()
      .from(videos)
      .where(eq(videos.status, "generating"));
    const line =
      generating.length > 0
        ? `🎥 در حال تولید: ${generating.map((g) => `«${g.title}» (مرحله ${faNum(g.stage)}/۵)`).join("\n")}`
        : "🎥 چیزی در حال تولید نیست؛ موتور آماده ایده بعدی است.";
    return {
      reply: `🤖 وضعیت پایپ‌لاین خودکار:\n${line}\n📦 در صف انتشار: ${faNum((await db.select().from(videos).where(eq(videos.status, "queued"))).length)}\n🗓️ زمان‌بندی‌شده: ${faNum(scheduled.length)}\n⚙️ تولید خودکار: ${s.autoGenerate ? "فعال" : "متوقف"} | انتشار خودکار: ${s.autoPublish ? "فعال" : "متوقف"}`,
    };
  }

  if (t.startsWith("/pause")) {
    await updateSettings({ autoGenerate: false });
    return {
      reply: "⏸️ تولید خودکار موقتاً متوقف شد. هر وقت خواستید با /resume ادامه دهید.",
      action: "pause",
    };
  }

  if (t.startsWith("/resume")) {
    await updateSettings({ autoGenerate: true });
    return {
      reply: "▶️ تولید خودکار دوباره فعال شد! موتور در حال آماده‌سازی ایده بعدی است 🎨",
      action: "resume",
    };
  }

  if (t.startsWith("/publish")) {
    const waiting = await db
      .select()
      .from(videos)
      .where(eq(videos.status, "queued"));
    const sched = await db
      .select()
      .from(videos)
      .where(eq(videos.status, "scheduled"));
    const all = [...waiting, ...sched];
    for (const v of all) await publishVideo(v.id, true);
    return {
      reply:
        all.length > 0
          ? `🚀 انجام شد! ${faNum(all.length)} ویدئو به‌صورت فوری در تیک‌تاک منتشر شد.`
          : "🤷 ویدئویی در صف انتشار نیست؛ همه‌چیز قبلاً منتشر شده است!",
      action: "publishAll",
    };
  }

  return {
    reply:
      "🤔 این پیام را متوجه نشدم!\nبرای دیدن کارهایی که بلدم /help را بفرستید، یا با /video همین حالا یک ویدئوی کودک بسازید.",
  };
}

function sql_count() {
  return sql<number>`count(*)::int`;
}
