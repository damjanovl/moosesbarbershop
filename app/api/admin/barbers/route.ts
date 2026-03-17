import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";

import { getAdminUserIdFromCookies } from "@/lib/admin-auth";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  await ensureDbSchema();
  const userId = await getAdminUserIdFromCookies();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [currentUser] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  if (!currentUser?.isMainAdmin) {
    return NextResponse.json(
      { error: "Only the main admin can add barbers" },
      { status: 403 },
    );
  }

  const json = await req.json().catch(() => null);
  const name = String(json?.name ?? "").trim();
  const email = String(json?.email ?? "").trim().toLowerCase();
  const password = String(json?.password ?? "");

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "Name must be at least 2 characters" },
      { status: 400 },
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "Valid email is required" },
      { status: 400 },
    );
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const existing = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "A barber with this email already exists" },
      { status: 409 },
    );
  }

  const id = crypto.randomUUID();
  await db.insert(adminUsers).values({
    id,
    name,
    email,
    passwordHash: hashPassword(password),
    isMainAdmin: false,
  });

  return NextResponse.json({ id, name, email });
}
