import { NextResponse } from "next/server";
import { BOT_COMMANDS, BOT_KEYBOARD } from "@/lib/bot-brain";
import { addLog, getSettings } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

/**
 * Registers the "/" command menu with Telegram (setMyCommands) and sends
 * the persistent button keyboard to the admin chat.
 */
export async function POST() {
  const s = await getSettings();
  if (!s.botToken) {
    return NextResponse.json({ error: "ابتدا توکن ربات را ذخیره کنید" }, { status: 400 });
  }
  const apiBase = `https://api.telegram.org/bot${s.botToken}`;

  const errors: string[] = [];

  // 1) slash-command menu next to the input box
  try {
    const r1 = await fetch(`${apiBase}/setMyCommands`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ commands: BOT_COMMANDS }),
    });
    const j1 = await r1.json().catch(() => ({}));
    if (!r1.ok || j1?.ok === false) errors.push(`setMyCommands: ${j1?.description ?? r1.status}`);
  } catch {
    errors.push("setMyCommands: network error");
  }

  // 2) persistent reply-keyboard to the admin chat
  let keyboardSent = false;
  if (s.chatId.trim()) {
    try {
      const r2 = await fetch(`${apiBase}/sendMessage`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: s.chatId.trim(),
          text: "🎛️ منوی دکمه‌ای ربات فعال شد!\nاز این دکمه‌ها برای کنترل ربات استفاده کنید:",
          reply_markup: BOT_KEYBOARD,
        }),
      });
      const j2 = await r2.json().catch(() => ({}));
      if (!r2.ok || j2?.ok === false) {
        errors.push(`keyboard: ${j2?.description ?? r2.status}`);
      } else {
        keyboardSent = true;
      }
    } catch {
      errors.push("keyboard: network error");
    }
  }

  if (errors.length > 0 && !keyboardSent) {
    await addLog("telegram", "error", `فعال‌سازی منوی دکمه‌ای ناموفق: ${errors.join(" | ")}`);
    return NextResponse.json({ ok: false, errors }, { status: 502 });
  }

  await addLog(
    "telegram",
    "info",
    `منوی دکمه‌ای و فهرست دستورها برای ربات ثبت شد${keyboardSent ? " و کیبورد برای ادمین ارسال شد" : ""} 🎛️`
  );
  return NextResponse.json({ ok: true, keyboardSent, warnings: errors });
}
