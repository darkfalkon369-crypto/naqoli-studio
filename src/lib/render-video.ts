import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { chromium } from "playwright";
import { categoryOf } from "./catalog";
import type { videos } from "@/db/schema";

const execFileAsync = promisify(execFile);

type VideoRow = typeof videos.$inferSelect;

/**
 * The HTML scene rendered to video.
 * 100% code-drawn cartoon scene (CSS gradients/SVG) — no photo assets,
 * so the output is always kid-friendly, on-brand and deterministic.
 */
export function sceneHtml(v: VideoRow): string {
  const cat = categoryOf(v.category);
  const hook = (v.caption || v.title).split("\n")[0].slice(0, 60).replace(/</g, "&lt;");
  const title = v.title.replace(/</g, "&lt;");

  // fixed, pleasant deco layout around the hero (big & readable)
  const spots = [
    { left: "6%", top: "16%", size: 120, d: 0 },
    { left: "78%", top: "13%", size: 110, d: 0.6 },
    { left: "4%", top: "44%", size: 100, d: 1.2 },
    { left: "80%", top: "47%", size: 105, d: 0.3 },
    { left: "10%", top: "68%", size: 90, d: 0.9 },
  ];
  const deco = cat.scene.deco
    .slice(0, 5)
    .map(
      (e, i) =>
        `<span class="deco" style="left:${spots[i].left};top:${spots[i].top};font-size:${spots[i].size}px;animation-delay:${spots[i].d}s">${e}</span>`
    )
    .join("");

  return `<!doctype html>
<html dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Lalezar&family=Vazirmatn:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { width:1080px; height:1920px; overflow:hidden; }
  body {
    background: linear-gradient(180deg, ${cat.scene.from} 0%, ${cat.scene.to} 78%);
    font-family:'Vazirmatn', Tahoma, sans-serif; position:relative;
  }
  /* cartoon sky */
  .sun {
    position:absolute; top:70px; left:90px; width:200px; height:200px; border-radius:50%;
    background:radial-gradient(circle at 35% 35%, #fff3c9, #ffd97a 60%, #ffc24b);
    box-shadow:0 0 140px 70px rgba(255,214,120,.5); animation:pulse 3s ease-in-out infinite;
  }
  .cloud { position:absolute; background:rgba(255,255,255,.92); border-radius:999px; animation:drift 9s ease-in-out infinite; }
  .cloud::before,.cloud::after { content:''; position:absolute; background:inherit; border-radius:50%; }
  .c1 { width:340px; height:96px; top:220px; right:-40px; }
  .c1::before { width:140px; height:140px; top:-70px; right:60px; }
  .c1::after  { width:100px; height:100px; top:-46px; right:180px; }
  .c2 { width:280px; height:80px; top:430px; left:-30px; animation-delay:2s; opacity:.8; }
  .c2::before { width:110px; height:110px; top:-56px; right:52px; }
  .c2::after  { width:80px; height:80px; top:-38px; right:150px; }
  /* rolling hills */
  .hill { position:absolute; border-radius:50%; }
  .h1 { width:1500px; height:760px; bottom:-430px; left:-260px; background:${cat.bar}55; }
  .h2 { width:1500px; height:760px; bottom:-470px; right:-320px; background:${cat.bar}33; }
  /* meadow dots */
  .dot { position:absolute; border-radius:50%; background:rgba(255,255,255,.5); }
  .deco { position:absolute; animation:float 2.6s ease-in-out infinite; filter:drop-shadow(0 14px 14px rgba(0,0,0,.18)); }
  .hero {
    position:absolute; top:31%; left:50%; transform:translateX(-50%);
    font-size:340px; line-height:1; animation:bounce 1.5s ease-in-out infinite;
    filter:drop-shadow(0 34px 34px rgba(0,0,0,.28));
  }
  .ring {
    position:absolute; top:29.5%; left:50%; transform:translateX(-50%);
    width:520px; height:520px; border-radius:50%;
    border:22px solid rgba(255,255,255,.75); animation:spin 14s linear infinite;
    border-top-color:transparent; border-bottom-color:rgba(255,255,255,.35);
  }
  .hook {
    position:absolute; top:120px; right:70px; left:70px; text-align:center;
    color:#241d14; font-weight:800; font-size:54px; line-height:1.7;
    background:rgba(255,253,248,.92); border-radius:36px; padding:30px 40px;
    box-shadow:0 16px 0 rgba(36,29,20,.12); animation:pop .8s cubic-bezier(.2,.9,.3,1.4) both;
  }
  .ribbon {
    position:absolute; bottom:230px; right:60px; left:60px;
    background:rgba(36,29,20,.86); border-radius:44px; padding:48px 54px;
    text-align:center; box-shadow:0 20px 0 rgba(36,29,20,.18);
    animation:rise 1s .25s cubic-bezier(.2,.9,.3,1.2) both;
  }
  .ribbon h1 { color:#fff8ec; font-family:'Lalezar'; font-size:80px; line-height:1.5; font-weight:400; }
  .brand {
    position:absolute; bottom:84px; left:0; right:0; text-align:center;
    font-size:42px; color:rgba(36,29,20,.6); font-weight:800; direction:rtl;
  }
  .brand bdi { direction:ltr; unicode-bidi:isolate; font-weight:700; }
  @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.07)} }
  @keyframes drift { 0%,100%{transform:translateX(0)} 50%{transform:translateX(-60px)} }
  @keyframes float { 0%,100%{transform:translateY(0) rotate(-4deg)} 50%{transform:translateY(-40px) rotate(4deg)} }
  @keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0) scale(1)} 50%{transform:translateX(-50%) translateY(-52px) scale(1.06)} }
  @keyframes spin { to{transform:translateX(-50%) rotate(360deg)} }
  @keyframes rise { from{opacity:0; transform:translateY(90px)} to{opacity:1; transform:none} }
  @keyframes pop { from{opacity:0; transform:scale(.6)} to{opacity:1; transform:scale(1)} }
</style></head>
<body>
  <div class="sun"></div>
  <div class="cloud c1"></div>
  <div class="cloud c2"></div>
  <div class="hill h1"></div>
  <div class="hill h2"></div>
  <div class="dot" style="width:26px;height:26px;left:16%;bottom:18%"></div>
  <div class="dot" style="width:18px;height:18px;left:70%;bottom:14%"></div>
  <div class="dot" style="width:14px;height:14px;left:44%;bottom:24%"></div>
  ${deco}
  <div class="ring"></div>
  <div class="hero">${cat.emoji}</div>
  <div class="hook">${hook}</div>
  <div class="ribbon"><h1>${title}</h1></div>
  <div class="brand">🤖 نقلی‌استودیو — <bdi>@naqoli_kids</bdi></div>
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
    await page.setContent(sceneHtml(v), { waitUntil: "networkidle", timeout: 25000 });
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
