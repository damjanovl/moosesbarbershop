import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin-dashboard";
import {
  createAdminBearerToken,
  getAdminUserIdFromCookies,
  isAdminAuthedFromCookies,
} from "@/lib/admin-auth";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { adminUsers, bookings, calendarBlocks } from "@/lib/db/schema";
import { formatTimeFromUtc } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthedFromCookies())) redirect("/admin/login");
  await ensureDbSchema();
  const db = getDb();
  const userId = await getAdminUserIdFromCookies();
  if (!userId) redirect("/admin/login");

  const [currentUser] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  const barbers = await db
    .select({ id: adminUsers.id, name: adminUsers.name })
    .from(adminUsers)
    .orderBy(adminUsers.name);

  const viewBarberId = userId;

  const rows = await db
    .select()
    .from(bookings)
    .where(eq(bookings.barberId, viewBarberId))
    .orderBy(desc(bookings.startAt))
    .limit(500);

  const blocks = await db
    .select()
    .from(calendarBlocks)
    .where(eq(calendarBlocks.barberId, viewBarberId));

  const barberNameById = Object.fromEntries(barbers.map((b) => [b.id, b.name]));

  const events = rows.map((b) => ({
    id: b.id,
    title: b.customerName,
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
    title: b.title,
    start: b.startAt.toISOString(),
    end: b.endAt.toISOString(),
  }));

  const viewBarber = barbers.find((b) => b.id === viewBarberId);

  const initialData = {
    barbers,
    events,
    blocks: blocksData,
    bookings: bookingsData,
    viewBarberId,
    viewTitle: viewBarber?.name ?? "Your",
    rows: rows.map((b) => ({
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
    })),
    viewAll: false,
  };

  const bearerToken = await createAdminBearerToken();

  return (
    <AdminDashboard
      initialData={initialData}
      userId={userId}
      isMainAdmin={!!currentUser?.isMainAdmin}
      bearerToken={bearerToken}
    />
  );
}

