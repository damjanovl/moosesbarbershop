import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";

import { getAdminUserIdFromRequest } from "@/lib/admin-auth";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { adminUsers, calendarBlocks } from "@/lib/db/schema";

export async function POST(req: Request) {
  await ensureDbSchema();
  const userId = await getAdminUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const barberId = json?.barberId;
  const title = String(json?.title ?? "").trim();
  const startAtIso = json?.startAtIso;
  const endAtIso = json?.endAtIso;

  const targetBarberId = barberId && typeof barberId === "string" ? barberId : userId;
  if (targetBarberId !== userId && !admin.isMainAdmin) {
    return NextResponse.json(
      { error: "You can only add blocks to your own calendar" },
      { status: 403 },
    );
  }

  const [targetBarber] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, targetBarberId))
    .limit(1);

  if (!targetBarber) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  if (!title || title.length < 1) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 },
    );
  }

  const startAt = startAtIso ? new Date(startAtIso) : null;
  const endAt = endAtIso ? new Date(endAtIso) : null;

  if (!startAt || Number.isNaN(startAt.getTime())) {
    return NextResponse.json(
      { error: "Valid start time is required" },
      { status: 400 },
    );
  }
  if (!endAt || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return NextResponse.json(
      { error: "Valid end time (after start) is required" },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  await db.insert(calendarBlocks).values({
    id,
    barberId: targetBarberId,
    title,
    startAt,
    endAt,
  });

  return NextResponse.json({
    id,
    barberId: targetBarberId,
    title,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  });
}
