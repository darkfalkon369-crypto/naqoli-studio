import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSettings();
  return NextResponse.json(s);
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => ({}));
  const allowed = [
    "autoGenerate",
    "autoPublish",
    "dailyLimit",
    "voiceStyle",
    "watermark",
    "safeMode",
    "hashtags",
    "botToken",
    "webhookUrl",
    "chatId",
    "onboardingDone",
  ] as const;
  const patch: Record<string, unknown> = {};
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }
  const row = await updateSettings(patch);
  return NextResponse.json(row);
}
