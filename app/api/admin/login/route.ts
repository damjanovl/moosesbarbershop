import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { setAdminSession } from "@/lib/admin-auth";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/password";

export async function POST(req: Request) {
  await ensureDbSchema();
  const form = await req.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!email || !password) {
    return NextResponse.redirect(new URL("/admin/login", req.url), 303);
  }

  const db = getDb();
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email))
    .limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.redirect(new URL("/admin/login", req.url), 303);
  }

  await setAdminSession(user.id);
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}

