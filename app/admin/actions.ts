"use server";

import { getAdminCalendarData } from "@/lib/admin-calendar-data";

export async function fetchAdminCalendarData(barberParam: string) {
  return getAdminCalendarData(barberParam);
}
