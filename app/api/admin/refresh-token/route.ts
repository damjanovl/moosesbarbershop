import { NextResponse } from "next/server";

import { createAdminBearerToken } from "@/lib/admin-auth";

export async function GET() {
  const token = await createAdminBearerToken();
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ token });
}
