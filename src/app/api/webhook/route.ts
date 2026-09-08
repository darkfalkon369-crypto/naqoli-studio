import { NextResponse } from "next/server";
import { handleBotMessage } from "@/lib/bot-brain";
import { addLog, getSettings } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

/**
 * وب‌هوک واقعی تلگرام.
 * روی سرور شخصی با این دستور فعال می‌شود:
 *   curl -F "url=https://YOUR-DOMAIN/api/webhook" \
 *        "https://api.telegram.org/bot<TOKEN>/setWebhook"
 */
export async function POST(req: Request) {
  const settings = await getSettings();

  if (!settings.botToken) {
    await addLog("telegram", "error", "دریافت آپدیت تلگرام رد شد: توکن ربات در تنظیمات وارد نشده است.");
    return NextResponse.json({ ok: false, error: "bot token is not configured" }, { status: 500 });
  }

  const update = await req.json().catch(() => null);
  const message = update?.message;
  const text: string | undefined = message?.text;
  const chatId = message?.chat?.id;

  if (!text || !chatId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const from = message?.from?.username ?? String(message?.from?.id ?? "نامشخص");
  await addLog("telegram", "info", `پیام از @${from} دریافت شد: «${text}»`);

  const result = await handleBotMessage(text);

  try {
    const res = await fetch(`https://api.telegram.org/bot${settings.botToken}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: result.reply,
        disable_web_page_preview: true,
      }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || body?.ok === false) {
      await addLog(
        "telegram",
        "error",
        `ارسال پاسخ به تلگرام ناموفق بود: ${body?.description ?? res.status}`
      );
      return NextResponse.json({ ok: false, error: "send failed" }, { status: 502 });
    }
    await addLog("telegram", "info", `پاسخ ربات برای @${from} ارسال شد ✅`);
  } catch {
    await addLog("telegram", "error", "خطای شبکه در ارتباط با api.telegram.org");
    return NextResponse.json({ ok: false, error: "network error" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const s = await getSettings();
  return NextResponse.json({
    ok: true,
    endpoint: "/api/webhook",
    tokenConfigured: Boolean(s.botToken),
    hint: "برای فعال‌سازی، این آدرس را با setWebhook تلگرام ثبت کنید.",
  });
}
