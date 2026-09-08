"use client";

import { useEffect, useRef } from "react";
import type { Category } from "@/lib/catalog";
import { STAGES } from "@/lib/catalog";

interface Props {
  cat: Category;
  title: string;
  generatingStage?: number | null;
  watermark?: boolean;
  className?: string;
}

interface Deco {
  e: string;
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
  size: number;
}

export function VideoCanvas({
  cat,
  title,
  generatingStage = null,
  watermark = true,
  className,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 270;
    const H = 480;
    canvas.width = W * 2;
    canvas.height = H * 2;
    ctx.scale(2, 2);

    const decos: Deco[] = cat.scene.deco.map((e, i) => ({
      e,
      x: 30 + Math.random() * (W - 60),
      y: 60 + Math.random() * (H - 200),
      r: 8 + Math.random() * 26,
      speed: 0.4 + Math.random() * 0.8,
      phase: Math.random() * Math.PI * 2,
      size: 20 + Math.random() * 16,
    }));
    void decos.forEach; // keep typing happy

    let raf = 0;
    let t = 0;

    const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    const wrap = (text: string, max: number): string[] => {
      const words = text.split(" ");
      const lines: string[] = [];
      let cur = "";
      for (const w of words) {
        const next = cur ? cur + " " + w : w;
        if (ctx.measureText(next).width > max && cur) {
          lines.push(cur);
          cur = w;
        } else cur = next;
      }
      if (cur) lines.push(cur);
      return lines.slice(0, 2);
    };

    const draw = () => {
      t += 0.016;

      // background
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, cat.scene.from);
      g.addColorStop(1, cat.scene.to);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      // soft bubbles
      ctx.globalAlpha = 0.25;
      for (let i = 0; i < 5; i++) {
        const bx = (W / 5) * i + Math.sin(t * 0.5 + i) * 18 + 20;
        const by = H * 0.2 + Math.cos(t * 0.4 + i * 1.7) * 30 + i * 60;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(bx, by, 14 + i * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // floating deco emojis
      for (const d of cat.scene.deco.map((e, i) => ({ e, i }))) {
        const dd = decos[d.i];
        ctx.font = `${dd.size}px serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const yy = dd.y + Math.sin(t * dd.speed + dd.phase) * dd.r;
        const xx = dd.x + Math.cos(t * dd.speed * 0.7 + dd.phase) * dd.r * 0.6;
        ctx.fillText(d.e, xx, yy);
      }

      // hero character
      const bounce = Math.abs(Math.sin(t * 2.2)) * 14;
      const heroScale = 1 + Math.sin(t * 2.2) * 0.06;
      ctx.save();
      ctx.translate(W / 2, H * 0.42 - bounce);
      ctx.scale(heroScale, heroScale);
      ctx.rotate(Math.sin(t * 1.4) * 0.08);
      ctx.font = "92px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cat.emoji, 0, 0);
      ctx.restore();

      // shadow under hero
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#241d14";
      ctx.beginPath();
      ctx.ellipse(W / 2, H * 0.55 + 26, 46 + bounce, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // title ribbon
      ctx.font = "bold 17px Vazirmatn, Tahoma, sans-serif";
      const lines = wrap(title, W - 60);
      const boxH = 34 + lines.length * 22;
      ctx.fillStyle = "rgba(36,29,20,0.78)";
      roundRect(20, H - boxH - 64, W - 40, boxH, 16);
      ctx.fill();
      ctx.fillStyle = "#fff8ec";
      ctx.textAlign = "center";
      lines.forEach((l, i) => {
        ctx.fillText(l, W / 2, H - 64 - boxH + 26 + i * 22);
      });

      // like button deco
      ctx.font = "20px serif";
      ctx.textAlign = "center";
      const likeY = H - 40 - Math.max(0, Math.sin(t * 3)) * 4;
      ctx.fillText("❤️", W - 34, likeY);
      ctx.font = "bold 10px Vazirmatn, sans-serif";
      ctx.fillStyle = "rgba(36,29,20,0.6)";
      ctx.fillText("۱۲ هزار", W - 34, likeY + 16);

      // rec dot + watermark
      const blink = Math.sin(t * 4) > 0;
      ctx.fillStyle = blink ? "#d2483e" : "rgba(210,72,62,0.35)";
      ctx.beginPath();
      ctx.arc(24, 26, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "bold 10px Vazirmatn, sans-serif";
      ctx.fillStyle = "rgba(36,29,20,0.65)";
      ctx.textAlign = "left";
      ctx.fillText("پیش‌نمایش زنده", 36, 30);
      if (watermark) {
        ctx.textAlign = "right";
        ctx.fillText("@naqoli_kids", W - 18, 30);
      }

      // generating overlay
      if (generatingStage !== null && generatingStage !== undefined) {
        ctx.fillStyle = "rgba(36,29,20,0.45)";
        ctx.fillRect(0, 0, W, H);
        const pct = generatingStage / STAGES.length;
        ctx.fillStyle = "rgba(255,253,248,0.9)";
        roundRect(30, H / 2 - 46, W - 60, 92, 16);
        ctx.fill();
        ctx.fillStyle = "#f4552e";
        ctx.font = "bold 14px Vazirmatn, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(
          STAGES[Math.min(generatingStage, STAGES.length) - 1] ?? "",
          W / 2,
          H / 2 - 14
        );
        ctx.fillStyle = "rgba(36,29,20,0.12)";
        roundRect(46, H / 2 + 8, W - 92, 12, 6);
        ctx.fill();
        ctx.fillStyle = "#f4552e";
        roundRect(46, H / 2 + 8, (W - 92) * pct, 12, 6);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [cat, title, generatingStage, watermark]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: "100%", height: "auto", display: "block", borderRadius: 18 }}
    />
  );
}
