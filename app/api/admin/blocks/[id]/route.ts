import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getAdminUserIdFromCookies } from "@/lib/admin-auth";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { adminUsers, calendarBlocks } from "@/lib/db/schema";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbSchema();
  const userId = await getAdminUserIdFromCookies();
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
