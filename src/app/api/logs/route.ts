import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { botLogs } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(botLogs).orderBy(desc(botLogs.id)).limit(40);
  return NextResponse.json(rows);
}
