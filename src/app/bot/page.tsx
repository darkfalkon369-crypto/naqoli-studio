"use client";

import { useEffect, useRef, useState } from "react";
import {
  IconBot,
  IconSend,
  IconTelegram,
  IconZap,
} from "@/components/icons";
import { Badge, Btn, Card, CardHead } from "@/components/ui";
import { api, bump, toast } from "@/lib/api";
import { faTime } from "@/lib/format";
import type { BotSettings } from "@/lib/types";

interface Msg {
  from: "user" | "bot";
  text: string;
  time: string;
}

const COMMANDS = [
  { cmd: "/video", label: "ساخت ویدئو 🎬" },
  { cmd: "/stats", label: "گزارش عملکرد 📊" },
  { cmd: "/status", label: "وضعیت پایپ‌لاین 🤖" },
  { cmd: "/publish", label: "انتشار فوری همه 🚀" },
  { cmd: "/pause", label: "توقف خودکار ⏸️" },
  { cmd: "/resume", label: "ادامه خودکار ▶️" },
  { cmd: "/help", label: "راهنما 📖" },
];

const REF = [
  { cmd: "/start", desc: "شروع و معرفی قابلیت‌های ربات" },
  { cmd: "/video", desc: "سفارش ساخت یک ویدئوی کودک با هوش مصنوعی" },
  { cmd: "/stats", desc: "گزارش بازدید، دنبال‌کننده و انتشار" },
  { cmd: "/status", desc: "وضعیت لحظه‌ای تولید و زمان‌بندی" },
  { cmd: "/publish", desc: "انتشار فوری همه ویدئوهای در صف" },
  { cmd: "/pause و /resume", desc: "توقف و ادامه تولید خودکار" },
  { cmd: "/help", desc: "فهرست کامل دستورهای ربات" },
];

export default function BotPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      from: "bot",
      text: "سلام ادمین عزیز! 👋 من ربات «نقلی‌استودیو» هستم. همه‌چیز تحت کنترل است؛ هر دستوری بدهید اجرا می‌کنم. برای شروع /help را بفرستید.",
      time: faTime(new Date()),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<BotSettings>("/api/settings").then(setSettings).catch(() => {});
    const h = () => api<BotSettings>("/api/settings").then(setSettings).catch(() => {});
    window.addEventListener("pipeline:tick", h);
    return () => window.removeEventListener("pipeline:tick", h);
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || typing) return;
    setInput("");
    setMessages((m) => [...m, { from: "user", text: msg, time: faTime(new Date()) }]);
    setTyping(true);
    try {
      const res = await api<{ reply: string }>("/api/bot/chat", {
        method: "POST",
        body: JSON.stringify({ text: msg }),
      });
      await new Promise((r) => setTimeout(r, 700));
      setMessages((m) => [...m, { from: "bot", text: res.reply, time: faTime(new Date()) }]);
      bump();
    } catch {
      toast("ربات پاسخ نداد؛ دوباره تلاش کنید");
    } finally {
      setTyping(false);
    }
  }

  async function saveSettings(patch: Partial<BotSettings>, msg: string) {
    await api("/api/settings", { method: "PATCH", body: JSON.stringify(patch) });
    toast(msg);
    setSettings((s) => (s ? { ...s, ...patch } : s));
    bump();
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* chat simulator */}
      <Card className="animate-pop flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 bg-ink-900 px-5 py-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-coral-500 text-white">
            <IconBot className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-cream">ربات نقلی‌استودیو</p>
            <p className="flex items-center gap-1.5 text-[10px] text-leaf-600">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-leaf-600" />
              آنلاین — پاسخگوی خودکار
            </p>
          </div>
          <IconTelegram className="h-5 w-5 text-cream/40" />
        </div>

        <div
          ref={scroller}
          className="h-[430px] space-y-3 overflow-y-auto bg-[#e8dfd0] p-4"
          style={{
            backgroundImage:
              "radial-gradient(rgba(36,29,20,0.06) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        >
          {messages.map((m, i) => (
            <div key={i} className={m.from === "user" ? "flex justify-start flex-row-reverse" : "flex justify-start"}>
              <div
                className={
                  m.from === "user"
                    ? "max-w-[80%] rounded-2xl rounded-tl-md bg-teal-600 px-3.5 py-2.5 text-[12px] leading-6 text-white shadow"
                    : "max-w-[80%] whitespace-pre-line rounded-2xl rounded-tr-md bg-paper px-3.5 py-2.5 text-[12px] leading-6 text-ink-800 shadow"
                }
              >
                {m.text}
                <span className={m.from === "user" ? "mt-1 block text-[9px] text-white/60" : "mt-1 block text-[9px] text-ink-300"}>
                  {m.time} {m.from === "user" && "✓✓"}
                </span>
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex">
              <div className="flex items-center gap-1 rounded-2xl bg-paper px-4 py-3 shadow">
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-300" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-300" />
                <span className="typing-dot h-1.5 w-1.5 rounded-full bg-ink-300" />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-line bg-paper p-3">
          <div className="mb-2 flex flex-wrap gap-1.5">
            {COMMANDS.map((c) => (
              <button
                key={c.cmd}
                onClick={() => send(c.cmd)}
                className="rounded-full border border-line bg-cream px-2.5 py-1 text-[10px] font-bold text-ink-700 transition-colors hover:border-coral-300 hover:bg-coral-50"
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="دستور خود را بنویسید… مثلاً /stats"
              className="flex-1 rounded-xl border border-line bg-cream px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-paper"
            />
            <button
              onClick={() => send()}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-500 text-white shadow-[0_4px_0_0_var(--color-teal-700)] transition-all hover:bg-teal-600 active:translate-y-0.5 active:shadow-none"
            >
              <IconSend className="h-4 w-4 -scale-x-100" />
            </button>
          </div>
        </div>
      </Card>

      {/* settings + reference */}
      <div className="space-y-5">
        <Card className="animate-pop">
          <CardHead
            icon={<IconTelegram className="h-5 w-5" />}
            title="پیکربندی اتصال ربات"
            sub="توکن و وب‌هوک تلگرام"
            extra={<Badge tone="leaf">متصل</Badge>}
          />
          <div className="space-y-4 p-5">
            <div>
              <p className="mb-1.5 text-xs font-bold text-ink-700">توکن ربات (از BotFather)</p>
              <input
                dir="ltr"
                value={settings?.botToken ?? ""}
                onChange={(e) => setSettings((s) => (s ? { ...s, botToken: e.target.value } : s))}
                onBlur={() =>
                  settings && saveSettings({ botToken: settings.botToken }, "توکن ربات ذخیره شد")
                }
                className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 font-mono text-xs outline-none focus:border-teal-500 focus:bg-paper"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-1.5 text-xs font-bold text-ink-700">آدرس وب‌هوک</p>
                <input
                  dir="ltr"
                  value={settings?.webhookUrl ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, webhookUrl: e.target.value } : s))}
                  onBlur={() =>
                    settings && saveSettings({ webhookUrl: settings.webhookUrl }, "وب‌هوک ذخیره شد")
                  }
                  className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 font-mono text-xs outline-none focus:border-teal-500 focus:bg-paper"
                />
              </div>
              <div>
                <p className="mb-1.5 text-xs font-bold text-ink-700">شناسه چت ادمین</p>
                <input
                  dir="ltr"
                  value={settings?.chatId ?? ""}
                  onChange={(e) => setSettings((s) => (s ? { ...s, chatId: e.target.value } : s))}
                  onBlur={() =>
                    settings && saveSettings({ chatId: settings.chatId }, "شناسه چت ذخیره شد")
                  }
                  className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 font-mono text-xs outline-none focus:border-teal-500 focus:bg-paper"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Btn
                variant="teal"
                onClick={() => toast("🔔 اعلان آزمایشی برای ادمین ارسال شد")}
              >
                ارسال اعلان آزمایشی
              </Btn>
              <Btn
                variant="soft"
                onClick={async () => {
                  toast("⚙️ وب‌هوک با موفقیت تنظیم شد");
                }}
              >
                تنظیم مجدد وب‌هوک
              </Btn>
            </div>
          </div>
        </Card>

        <Card className="animate-pop">
          <CardHead
            icon={<IconZap className="h-5 w-5" />}
            title="دستورهای ربات"
            sub="هرچه در تلگرام می‌توانید بفرستید"
          />
          <div className="divide-y divide-line">
            {REF.map((r) => (
              <div key={r.cmd} className="flex items-center gap-3 px-5 py-2.5">
                <code dir="ltr" className="rounded-lg bg-ink-900 px-2.5 py-1 font-mono text-[11px] font-bold text-sun-300">
                  {r.cmd}
                </code>
                <p className="flex-1 text-xs text-ink-700">{r.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
