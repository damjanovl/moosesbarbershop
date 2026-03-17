import { NextResponse } from "next/server";

import { verifyAdminBearerToken } from "@/lib/admin-auth";
import { getAdminCalendarData } from "@/lib/admin-calendar-data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const barberParam = url.searchParams.get("barber");

  const authHeader = req.headers.get("authorization");
  const userIdFromToken = verifyAdminBearerToken(authHeader);

  const data = await getAdminCalendarData(barberParam, userIdFromToken);
  if (!data) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(data);
}
