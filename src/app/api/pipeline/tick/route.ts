import { NextResponse } from "next/server";
import { tickPipeline } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function POST() {
  const summary = await tickPipeline();
  return NextResponse.json(summary);
}
