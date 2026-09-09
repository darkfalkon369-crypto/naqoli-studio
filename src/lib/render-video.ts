import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { chromium } from "playwright";
import { synthMelodyWav } from "./audio";
import { categoryOf, subjectEmoji } from "./catalog";
import type { videos } from "@/db/schema";

const execFileAsync = promisify(execFile);

type VideoRow = typeof videos.$inferSelect;

/**
 * Storyboard (all timings in seconds, computed from the real duration):
 *  ACT 1  0 → 2.5s      hook pops in ("امروز می‌خوایم …")
 *  ACT 2  2.5 → D-4s     topic flashcards (numbers/letters/colors/…) one by one
 *  ACT 3  last 3.5s      end card: like & follow CTA
 *  Always: bouncing subject hero, drifting clouds, sun, hills, title ribbon.
 *  Audio: in-code music-box melody mixed by ffmpeg.
 */
export function sceneHtml(v: VideoRow, D: number): string {
  const cat = categoryOf(v.category);
  const hero = subjectEmoji(v.title, cat);
  const hook = (v.caption || v.title).split("\n")[0].slice(0, 60).replace(/</g, "&lt;");
  const title = v.title.replace(/</g, "&lt;");

  const act2 = 2.5;
  const endAt = D - 3.5;
  const seq = cat.seq;
  const step = Math.min(4, Math.max(1.2, (endAt - act2) / seq.length));
  const cards = seq
    .map((sItem, i) => {
      const delay = (act2 + i * step).toFixed(2);
      const inner = sItem.color
        ? `<span class="ball" style="background:${sItem.color}"></span><b>${sItem.label}</b>`
        : `<span class="big">${sItem.label}</span>`;
      return `<div class="card" style="animation-delay:${delay}s;animation-duration:${step.toFixed(2)}s">${inner}</div>`;
    })
    .join("");

  const deco = cat.scene.deco
    .slice(0, 4)
    .map(
      (e, i) =>
        `<span class="deco" style="left:${["6%", "80%", "4%", "82%"][i]};top:${["20%", "24%", "52%", "55%"][i]};font-size:${[110, 100, 92, 96][i]}px;animation-delay:${(i * 0.6).toFixed(1)}s">${e}</span>`
    )
    .join("");

  return `<!doctype html>
<html dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Lalezar&family=Vazirmatn:wght@400;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:1080px;height:1920px;overflow:hidden}
  body{background:linear-gradient(180deg,${cat.scene.from} 0%,${cat.scene.to} 80%);font-family:'Vazirmatn',Tahoma,sans-serif;position:relative}
  .sun{position:absolute;top:70px;left:90px;width:190px;height:190px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff3c9,#ffd97a 60%,#ffc24b);box-shadow:0 0 140px 70px rgba(255,214,120,.5);animation:pulse 3s ease-in-out infinite}
  .cloud{position:absolute;background:rgba(255,255,255,.92);border-radius:999px;animation:drift 9s ease-in-out infinite}
  .cloud::before,.cloud::after{content:'';position:absolute;background:inherit;border-radius:50%}
  .c1{width:330px;height:92px;top:210px;right:-40px}.c1::before{width:130px;height:130px;top:-64px;right:60px}.c1::after{width:96px;height:96px;top:-42px;right:170px}
  .c2{width:270px;height:76px;top:420px;left:-30px;animation-delay:2s;opacity:.8}.c2::before{width:104px;height:104px;top:-52px;right:50px}.c2::after{width:76px;height:76px;top:-34px;right:140px}
  .hill{position:absolute;border-radius:50%}
  .h1{width:1500px;height:760px;bottom:-430px;left:-260px;background:${cat.bar}50}
  .h2{width:1500px;height:760px;bottom:-470px;right:-320px;background:${cat.bar}30}
  .deco{position:absolute;animation:float 2.8s ease-in-out infinite;filter:drop-shadow(0 12px 12px rgba(0,0,0,.16))}
  .hero{position:absolute;top:15%;left:50%;transform:translateX(-50%);font-size:250px;line-height:1;animation:bounce 1.5s ease-in-out infinite;filter:drop-shadow(0 28px 28px rgba(0,0,0,.25))}
  .ring{position:absolute;top:14%;left:50%;transform:translateX(-50%);width:400px;height:400px;border-radius:50%;border:18px solid rgba(255,255,255,.7);border-top-color:transparent;animation:spin 12s linear infinite}
  .hook{position:absolute;top:90px;right:70px;left:70px;text-align:center;color:#241d14;font-weight:800;font-size:50px;line-height:1.7;background:rgba(255,253,248,.93);border-radius:36px;padding:26px 36px;box-shadow:0 14px 0 rgba(36,29,20,.12);animation:pop .8s cubic-bezier(.2,.9,.3,1.4) both}
  .card{position:absolute;top:42%;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:36px;opacity:0;animation-name:card;animation-fill-mode:both;animation-timing-function:cubic-bezier(.2,.9,.3,1.2)}
  .card .big{font-family:'Lalezar';font-size:420px;line-height:1;color:${cat.bar};text-shadow:0 22px 0 rgba(36,29,20,.15);animation:wig 1s ease-in-out infinite}
  .card .ball{width:300px;height:300px;border-radius:50%;box-shadow:inset -26px -30px 0 rgba(0,0,0,.14),0 20px 0 rgba(36,29,20,.15);animation:wig 1s ease-in-out infinite}
  .card b{font-family:'Lalezar';font-size:200px;font-weight:400;color:#241d14}
  .ribbon{position:absolute;bottom:180px;right:60px;left:60px;background:rgba(36,29,20,.86);border-radius:44px;padding:40px 50px;text-align:center;box-shadow:0 18px 0 rgba(36,29,20,.18);animation:rise 1s .4s cubic-bezier(.2,.9,.3,1.2) both}
  .ribbon h1{color:#fff8ec;font-family:'Lalezar';font-size:74px;line-height:1.5;font-weight:400}
  .end{position:absolute;top:38%;left:0;right:0;text-align:center;opacity:0;animation:pop 1s ${endAt.toFixed(2)}s cubic-bezier(.2,.9,.3,1.4) both}
  .end .big2{display:inline-block;font-size:150px;animation:bounce2 1s ease-in-out infinite}
  .end p{font-family:'Lalezar';font-size:84px;color:#241d14;margin-top:20px}
  .end small{display:block;font-family:'Vazirmatn';font-weight:800;font-size:44px;color:${cat.bar};margin-top:10px}
  .brand{position:absolute;bottom:64px;left:0;right:0;text-align:center;font-size:40px;color:rgba(36,29,20,.6);font-weight:800}
  .brand bdi{direction:ltr;unicode-bidi:isolate}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
  @keyframes drift{0%,100%{transform:translateX(0)}50%{transform:translateX(-60px)}}
  @keyframes float{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-38px) rotate(4deg)}}
  @keyframes bounce{0%,100%{transform:translateX(-50%) translateY(0) scale(1)}50%{transform:translateX(-50%) translateY(-44px) scale(1.05)}}
  @keyframes bounce2{0%,100%{transform:translateY(0)}50%{transform:translateY(-26px)}}
  @keyframes spin{to{transform:translateX(-50%) rotate(360deg)}}
  @keyframes rise{from{opacity:0;transform:translateY(90px)}to{opacity:1;transform:none}}
  @keyframes pop{from{opacity:0;transform:scale(.5)}to{opacity:1;transform:scale(1)}}
  @keyframes wig{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
  @keyframes card{0%{opacity:0;transform:scale(.3)}10%{opacity:1;transform:scale(1.1)}18%{transform:scale(1)}82%{opacity:1}100%{opacity:0;transform:scale(.7) translateY(-60px)}}
</style></head>
<body>
  <div class="sun"></div>
  <div class="cloud c1"></div><div class="cloud c2"></div>
  <div class="hill h1"></div><div class="hill h2"></div>
  ${deco}
  <div class="hook">${hook}</div>
  <div class="ring"></div>
  <div class="hero">${hero}</div>
  ${cards}
  <div class="end"><span class="big2">❤️</span><p>خوشت اومد؟ دنبال کن!</p><small>🤖 نقلی‌استودیو — <bdi>@naqoli_kids</bdi></small></div>
  <div class="ribbon"><h1>${title}</h1></div>
</body></html>`;
}

/**
 * Render a real vertical MP4 (H.264 + AAC music) for a generated video.
 * Duration follows the video's configured length (15–60s).
 */
export async function renderVideoFile(v: VideoRow): Promise<string> {
  const D = Math.min(60, Math.max(15, v.durationSec || 30));
  const outDir = path.join(process.cwd(), "public", "videos");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${v.id}.mp4`);
  const tmpDir = fs.mkdtempSync(path.join("/tmp", "naqoli-render-"));
  const melodyPath = path.join(tmpDir, "melody.wav");

  // kids' music-box soundtrack, unique per category
  fs.writeFileSync(melodyPath, synthMelodyWav(v.category, D + 2));

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
    await page.setContent(sceneHtml(v, D), { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(D * 1000);
    const videoPath = await page.video()?.path();
    await context.close();
    await browser.close();

    if (!videoPath || !fs.existsSync(videoPath)) {
      throw new Error("ضبط ویدیو توسط مرورگر انجام نشد");
    }

    try {
      await execFileAsync(
        "ffmpeg",
        [
          "-y",
          "-i", videoPath,
          "-stream_loop", "-1", "-i", melodyPath,
          "-map", "0:v:0", "-map", "1:a:0",
          "-c:v", "libx264", "-preset", "veryfast", "-crf", "20",
          "-pix_fmt", "yuv420p",
          "-c:a", "aac", "-b:a", "128k",
          "-shortest",
          "-movflags", "+faststart",
          outFile,
        ],
        { timeout: 420000 }
      );
    } catch {
      throw new Error("ffmpeg در دسترس نیست. روی سرور:  sudo apt-get install -y ffmpeg");
    }
    return `/api/videos/file/${v.id}`;
  } finally {
    await browser.close().catch(() => {});
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
