import { NextResponse } from "next/server";

import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";

export async function GET() {
  await ensureDbSchema();
  const db = getDb();

  const barbers = await db
    .select({ id: adminUsers.id, name: adminUsers.name })
    .from(adminUsers)
    .orderBy(adminUsers.name);

  return NextResponse.json({ barbers });
}
