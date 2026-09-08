import { eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { accounts } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  const gain = 80 + Math.floor(Math.random() * 420);
  const [row] = await db
    .update(accounts)
    .set({ followers: sql`${accounts.followers} + ${gain}` })
    .where(eq(accounts.id, id))
    .returning();
  return NextResponse.json({ ...row, gain });
}
