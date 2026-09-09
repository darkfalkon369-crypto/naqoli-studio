import fs from "fs";
import path from "path";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";

export const dynamic = "force-dynamic";

/** Stream the rendered MP4 for a video (supports HTTP Range for <video>). */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await ctx.params;
  const id = Number(idParam);
  const [v] = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  if (!v) return NextResponse.json({ error: "ویدئو پیدا نشد" }, { status: 404 });

  const filePath = path.join(process.cwd(), "public", "videos", `${id}.mp4`);
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "فایل ویدیو هنوز ساخته نشده است" }, { status: 404 });
  }

  const buf = await fs.promises.readFile(filePath);
  const total = buf.length;
  const filename = `naqoli-${id}.mp4`;
  const baseHeaders: Record<string, string> = {
    "content-type": "video/mp4",
    "accept-ranges": "bytes",
    "cache-control": "private, max-age=86400",
  };

  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const start = m?.[1] ? parseInt(m[1], 10) : 0;
    const end = m?.[2] ? Math.min(parseInt(m[2], 10), total - 1) : total - 1;
    if (start >= total) {
      return new NextResponse(null, {
        status: 416,
        headers: { "content-range": `bytes */${total}` },
      });
    }
    const slice = buf.subarray(start, end + 1);
    return new NextResponse(new Uint8Array(slice), {
      status: 206,
      headers: {
        ...baseHeaders,
        "content-range": `bytes ${start}-${end}/${total}`,
        "content-length": String(slice.length),
      },
    });
  }

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      ...baseHeaders,
      "content-length": String(total),
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
