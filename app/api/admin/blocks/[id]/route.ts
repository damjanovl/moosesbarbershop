import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getAdminUserIdFromRequest } from "@/lib/admin-auth";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { adminUsers, calendarBlocks } from "@/lib/db/schema";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbSchema();
  const userId = await getAdminUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [block] = await db
    .select()
    .from(calendarBlocks)
    .where(eq(calendarBlocks.id, id))
    .limit(1);

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  if (block.barberId !== userId && !admin.isMainAdmin) {
    return NextResponse.json(
      { error: "You can only edit your own blocks" },
      { status: 403 },
    );
  }

  const json = await req.json().catch(() => null);
  const barberId = json?.barberId;
  const title = String(json?.title ?? "").trim();
  const startAtIso = json?.startAtIso;
  const endAtIso = json?.endAtIso;

  const targetBarberId =
    barberId && typeof barberId === "string" ? barberId : block.barberId;
  if (targetBarberId !== userId && !admin.isMainAdmin) {
    return NextResponse.json(
      { error: "You can only move blocks to your own calendar" },
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

  await db
    .update(calendarBlocks)
    .set({
      barberId: targetBarberId,
      title,
      startAt,
      endAt,
    })
    .where(eq(calendarBlocks.id, id));

  return NextResponse.json({
    ok: true,
    id,
    barberId: targetBarberId,
    title,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbSchema();
  const userId = await getAdminUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [block] = await db
    .select()
    .from(calendarBlocks)
    .where(eq(calendarBlocks.id, id))
    .limit(1);

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  if (block.barberId !== userId && !admin.isMainAdmin) {
    return NextResponse.json(
      { error: "You can only delete your own blocks" },
      { status: 403 },
    );
  }

  await db.delete(calendarBlocks).where(eq(calendarBlocks.id, id));
  return NextResponse.json({ ok: true });
}
