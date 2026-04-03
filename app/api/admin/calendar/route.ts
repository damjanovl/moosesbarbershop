import { NextResponse } from "next/server";

import { getAdminUserIdFromRequest } from "@/lib/admin-auth";
import { getAdminCalendarData } from "@/lib/admin-calendar-data";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const barberParam = url.searchParams.get("barber");

  const userId = await getAdminUserIdFromRequest(req);
  const data = await getAdminCalendarData(barberParam, userId);
  if (!data) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(data);
}
