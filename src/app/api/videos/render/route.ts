import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { buildCaption } from "@/lib/caption";
import { categoryOf } from "@/lib/catalog";
import { addLog } from "@/lib/pipeline";
import { renderVideoFile } from "@/lib/render-video";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

/**
 * Render the final MP4 for a video and (re)generate its caption.
 * Returns the download URL.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "id نامعتبر" }, { status: 400 });

  const [v] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!v) return NextResponse.json({ error: "ویدئو پیدا نشد" }, { status: 404 });
  if (v.renderStatus === "rendering") {
    return NextResponse.json({ error: "رندر همین ویدئو در حال انجام است" }, { status: 409 });
  }

  // make sure a caption exists (older rows may not have one)
  let caption = v.caption;
  if (!caption.trim()) {
    caption = buildCaption(categoryOf(v.category), v.title, v.hashtags);
    await db.update(videos).set({ caption }).where(eq(videos.id, id));
  }

  await db.update(videos).set({ renderStatus: "rendering" }).where(eq(videos.id, id));
  try {
    await renderVideoFile(v);
    // served through the API so it survives Next.js production builds
    const fileUrl = `/api/videos/file/${id}`;
    await db
      .update(videos)
      .set({ renderStatus: "ready", fileUrl, caption })
      .where(eq(videos.id, id));
    await addLog("engine", "info", `فایل خروجی ویدئوی «${v.title}» ساخته شد و آماده دانلود است 📥`);
    return NextResponse.json({ ok: true, fileUrl, caption });
  } catch (e) {
    await db.update(videos).set({ renderStatus: "failed" }).where(eq(videos.id, id));
    const msg = e instanceof Error ? e.message : "خطا در رندر";
    await addLog("engine", "error", `رندر ویدئوی «${v.title}» ناموفق بود: ${msg}`);
    return NextResponse.json({ ok: false, error: msg }, { status: 502 });
  }
}
