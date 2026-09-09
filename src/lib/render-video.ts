import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { chromium } from "playwright";
import { categoryOf } from "./catalog";
import type { videos } from "@/db/schema";

const execFileAsync = promisify(execFile);

type VideoRow = typeof videos.$inferSelect;

/** The HTML scene rendered to video — pure CSS animation, correct Persian text. */
function sceneHtml(v: VideoRow, baseUrl: string): string {
  const cat = categoryOf(v.category);
  const hook = (v.caption || v.title).split("\n")[0].slice(0, 60);
  const title = v.title.replace(/</g, "&lt;");
  const deco = cat.scene.deco
    .map(
      (e, i) => `<span class="deco" style="left:${8 + i * 18}%;top:${12 + (i % 3) * 22}%;animation-delay:${i * 0.7}s;font-size:${44 + (i % 3) * 14}px">${e}</span>`
    )
    .join("");
  return `<!doctype html>
<html dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Lalezar&family=Vazirmatn:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:1080px; height:1920px; overflow:hidden; }
  body {
    background: linear-gradient(160deg, ${cat.scene.from}, ${cat.scene.to});
    font-family: 'Vazirmatn', Tahoma, sans-serif; position: relative;
  }
  .bg {
    position:absolute; inset:0; width:100%; height:100%; object-fit:cover;
    opacity:.5; animation: zoom 10s ease-in-out infinite alternate;
  }
  .deco { position:absolute; animation: float 3s ease-in-out infinite; }
  .hero {
    position:absolute; top:34%; left:50%; transform:translateX(-50%);
    font-size:300px; animation: bounce 1.6s ease-in-out infinite;
    filter: drop-shadow(0 30px 30px rgba(0,0,0,.25));
  }
  .ribbon {
    position:absolute; bottom:220px; right:60px; left:60px;
    background:rgba(36,29,20,.82); border-radius:40px; padding:44px 50px;
    text-align:center; animation: rise 1s .3s cubic-bezier(.2,.9,.3,1.2) both;
  }
  .ribbon h1 { color:#fff8ec; font-family:'Lalezar'; font-size:76px; line-height:1.5; font-weight:400; }
  .hook {
    position:absolute; top:140px; right:60px; left:60px; text-align:center;
    color:#241d14; font-weight:800; font-size:52px; line-height:1.6;
    background:rgba(255,253,248,.85); border-radius:32px; padding:26px 34px;
    animation: pop .8s cubic-bezier(.2,.9,.3,1.4) both;
  }
  .brand {
    position:absolute; bottom:70px; left:0; right:0; text-align:center;
    font-size:40px; color:rgba(36,29,20,.55); font-weight:700;
  }
  @keyframes zoom { from { transform:scale(1); } to { transform:scale(1.15); } }
  @keyframes float { 0%,100% { transform:translateY(0);} 50% { transform:translateY(-36px);} }
  @keyframes bounce { 0%,100% { transform:translateX(-50%) translateY(0) scale(1);} 50% { transform:translateX(-50%) translateY(-46px) scale(1.05);} }
  @keyframes rise { from { opacity:0; transform:translateY(90px);} to { opacity:1; transform:none;} }
  @keyframes pop { from { opacity:0; transform:scale(.6);} to { opacity:1; transform:scale(1);} }
</style></head>
<body>
  <img class="bg" src="${baseUrl}${v.thumbnail}" />
  ${deco}
  <div class="hero">${cat.emoji}</div>
  <div class="hook">${hook}</div>
  <div class="ribbon"><h1>${title}</h1></div>
  <div class="brand">🤖 نقلی‌استودیو — @naqoli_kids</div>
</body></html>`;
}

/**
 * Render a real vertical MP4 for a generated video:
 * Playwright animates + records an HTML scene → ffmpeg encodes H.264 MP4.
 * Returns the public URL path (e.g. "/videos/12.mp4").
 */
export async function renderVideoFile(v: VideoRow): Promise<string> {
  const outDir = path.join(process.cwd(), "public", "videos");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${v.id}.mp4`);
  const tmpDir = fs.mkdtempSync(path.join("/tmp", "naqoli-render-"));
  const baseUrl = process.env.APP_BASE_URL || "http://127.0.0.1:3000";

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox", "--disable-gpu"],
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1080, height: 1920 },
      recordVideo: { dir: tmpDir, size: { width: 1080, height: 1920 } },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.setContent(sceneHtml(v, baseUrl), { waitUntil: "networkidle", timeout: 20000 });
    // record ~9 seconds of animation
    await page.waitForTimeout(9000);
    const videoPath = await page.video()?.path();
    await context.close();
    await browser.close();

    if (!videoPath || !fs.existsSync(videoPath)) {
      throw new Error("ضبط ویدیو توسط مرورگر انجام نشد");
    }

    // encode to TikTok-friendly H.264 MP4
    try {
      await execFileAsync(
        "ffmpeg",
        [
          "-y",
          "-i",
          videoPath,
          "-c:v",
          "libx264",
          "-preset",
          "veryfast",
          "-crf",
          "23",
          "-pix_fmt",
          "yuv420p",
          "-movflags",
          "+faststart",
          "-an",
          outFile,
        ],
        { timeout: 120000 }
      );
    } catch (e) {
      throw new Error(
        "ffmpeg در دسترس نیست یا خطا داد. روی سرور:  sudo apt-get install -y ffmpeg"
      );
    }
    return `/videos/${v.id}.mp4`;
  } finally {
    await browser.close().catch(() => {});
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
