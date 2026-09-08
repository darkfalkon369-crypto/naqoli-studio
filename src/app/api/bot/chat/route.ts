import { NextResponse } from "next/server";
import { handleBotMessage } from "@/lib/bot-brain";
import { addLog } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const text = String(body.text ?? "").trim();
  if (!text) return NextResponse.json({ error: "پیام خالی است" }, { status: 400 });

  await addLog("telegram", "info", `پیام دریافتی از ادمین در تلگرام: «${text}»`);
  const result = await handleBotMessage(text);
  await addLog(
    "telegram",
    "info",
    `پاسخ ربات ارسال شد${result.action ? ` (اقدام: ${result.action})` : ""}`
  );
  return NextResponse.json(result);
}
