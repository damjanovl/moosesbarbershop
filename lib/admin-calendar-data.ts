import "server-only";

import { desc, eq, inArray } from "drizzle-orm";

import { getAdminUserIdFromCookies } from "@/lib/admin-auth";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { adminUsers, bookings, calendarBlocks } from "@/lib/db/schema";
import { formatTimeFromUtc } from "@/lib/time";

export async function getAdminCalendarData(barberParam: string | null) {
  const userId = await getAdminUserIdFromCookies();
  if (!userId) {
    return null;
  }

  await ensureDbSchema();
  const db = getDb();

  const [currentUser] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  const barbers = await db
    .select({ id: adminUsers.id, name: adminUsers.name })
    .from(adminUsers)
    .orderBy(adminUsers.name);

  const viewAll = currentUser?.isMainAdmin && barberParam === "all";
  const viewBarberId =
    currentUser?.isMainAdmin && barberParam && barberParam !== "all"
      ? barbers.some((b) => b.id === barberParam)
        ? barberParam
        : userId
      : userId;

  const barberIds = barbers.map((b) => b.id);

  const rows = viewAll
    ? await db
        .select()
        .from(bookings)
        .where(inArray(bookings.barberId, barberIds))
        .orderBy(desc(bookings.startAt))
        .limit(500)
    : await db
        .select()
        .from(bookings)
        .where(eq(bookings.barberId, viewBarberId))
        .orderBy(desc(bookings.startAt))
        .limit(500);

  const blocks = viewAll
    ? await db
        .select()
        .from(calendarBlocks)
        .where(inArray(calendarBlocks.barberId, barberIds))
    : await db
        .select()
        .from(calendarBlocks)
        .where(eq(calendarBlocks.barberId, viewBarberId));

  const barberNameById = Object.fromEntries(barbers.map((b) => [b.id, b.name]));

  const events = rows.map((b) => ({
    id: b.id,
    title: viewAll
      ? `${b.customerName} (${barberNameById[b.barberId] ?? b.barberId})`
      : b.customerName,
    start: b.startAt.toISOString(),
    end: b.endAt.toISOString(),
    status: b.status,
  }));

  const bookingsData = rows.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    customerEmail: b.customerEmail,
    customerPhone: b.customerPhone,
    serviceName: b.serviceName,
    priceCad: b.priceCad,
    status: b.status,
    timeRange: `${formatTimeFromUtc(b.startAt)} – ${formatTimeFromUtc(b.endAt)}`,
    barberName: barberNameById[b.barberId] ?? b.barberId,
  }));

  const blocksData = blocks.map((b) => ({
    id: b.id,
    title: viewAll
      ? `${b.title} (${barberNameById[b.barberId] ?? b.barberId})`
      : b.title,
    start: b.startAt.toISOString(),
    end: b.endAt.toISOString(),
  }));

  const viewBarber = viewAll ? null : barbers.find((b) => b.id === viewBarberId);

  const rowsData = rows.map((b) => ({
    id: b.id,
    startAt: b.startAt.toISOString(),
    timeFormatted: `${b.startAt.toISOString().slice(0, 10)} • ${formatTimeFromUtc(b.startAt)}`,
    barberId: b.barberId,
    barberName: barberNameById[b.barberId] ?? b.barberId,
    customerName: b.customerName,
    serviceName: b.serviceName,
    status: b.status,
    customerPhone: b.customerPhone,
    customerEmail: b.customerEmail,
  }));

  return {
    barbers,
    events,
    blocks: blocksData,
    bookings: bookingsData,
    viewBarberId: viewAll ? "all" : viewBarberId,
    viewTitle: viewAll ? "All calendars" : viewBarber?.name ?? "Your",
    rows: rowsData,
    viewAll,
  };
}
