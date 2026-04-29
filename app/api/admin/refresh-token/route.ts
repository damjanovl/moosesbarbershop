import { NextResponse } from "next/server";

import { getAdminUserIdFromRequest, mintAdminBearerToken } from "@/lib/admin-auth";

export async function GET(req: Request) {
  const userId = await getAdminUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ token: mintAdminBearerToken(userId) });
}
