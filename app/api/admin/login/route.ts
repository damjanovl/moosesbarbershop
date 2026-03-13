import { NextResponse } from "next/server";

import { setAdminSession } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const form = await req.formData();
  const password = String(form.get("password") ?? "");

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "Missing ADMIN_PASSWORD" },
      { status: 500 },
    );
  }

  if (password !== expected) {
    return NextResponse.redirect(new URL("/admin/login", req.url), 303);
  }

  await setAdminSession();
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}

