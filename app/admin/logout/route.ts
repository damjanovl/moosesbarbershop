import { NextResponse } from "next/server";

import { clearAdminSession } from "@/lib/admin-auth";

export async function GET(req: Request) {
  await clearAdminSession();
  return NextResponse.redirect(new URL("/", req.url), 303);
}

