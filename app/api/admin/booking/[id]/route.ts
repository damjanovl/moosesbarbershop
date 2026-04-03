import { NextResponse } from "next/server";
import { addMinutes } from "date-fns";
import { and, eq, gt, inArray, lt, ne } from "drizzle-orm";

import { getAdminUserIdFromRequest } from "@/lib/admin-auth";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { adminUsers, bookings } from "@/lib/db/schema";
import { getService, SERVICES, type ServiceKey } from "@/lib/services";

const BodySchema = {
  barberId: (v: unknown) => typeof v === "string" && v.length > 0,
  serviceKey: (v: unknown) =>
    typeof v === "string" && SERVICES.some((service) => service.key === v),
  startAtIso: (v: unknown) => typeof v === "string" && v.length > 0,
  customerName: (v: unknown) =>
    typeof v === "string" && v.length >= 2 && v.length <= 80,
  customerEmail: (v: unknown) =>
    v === undefined ||
    (typeof v === "string" &&
      (v.length === 0 || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))),
  customerPhone: (v: unknown) =>
    v === undefined ||
    (typeof v === "string" && (v.length === 0 || (v.length >= 7 && v.length <= 30))),
  notes: (v: unknown) =>
    v === undefined || (typeof v === "string" && v.length <= 500),
  durationMinutes: (v: unknown) =>
    typeof v === "number" &&
    Number.isInteger(v) &&
    v >= 15 &&
    v <= 480,
};

function overlaps(
  a: { startAt: Date; endAt: Date },
  b: { startAt: Date; endAt: Date },
) {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

async function getAuthedAdmin(req: Request) {
  await ensureDbSchema();
  const userId = await getAdminUserIdFromRequest(req);
  if (!userId) return { userId: null, admin: null };

  const db = getDb();
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  return { userId, admin, db };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthedAdmin(req);
  if (!auth.userId || !auth.admin || !auth.db) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { admin, userId, db } = auth;

  const [existingBooking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);

  if (!existingBooking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (existingBooking.barberId !== userId && !admin.isMainAdmin) {
    return NextResponse.json(
      { error: "You can only edit your own bookings" },
      { status: 403 },
    );
  }

  const json = await req.json().catch(() => null);
  if (!json) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const barberId = BodySchema.barberId(json.barberId) ? json.barberId : null;
  const serviceKey = BodySchema.serviceKey(json.serviceKey)
    ? (json.serviceKey as ServiceKey)
    : null;
  const startAtIso = BodySchema.startAtIso(json.startAtIso)
    ? json.startAtIso
    : null;
  const customerName = BodySchema.customerName(json.customerName)
    ? json.customerName
    : null;
  const customerEmail = BodySchema.customerEmail(json.customerEmail)
    ? (typeof json.customerEmail === "string" ? json.customerEmail : "")
    : null;
  const customerPhone = BodySchema.customerPhone(json.customerPhone)
    ? (typeof json.customerPhone === "string" ? json.customerPhone : "")
    : null;
  const notes = BodySchema.notes(json.notes) ? json.notes : undefined;
  const durationMinutes = BodySchema.durationMinutes(json.durationMinutes)
    ? (json.durationMinutes as number)
    : null;

  if (
    !barberId ||
    !serviceKey ||
    !startAtIso ||
    !customerName ||
    customerEmail === null ||
    customerPhone === null ||
    !durationMinutes
  ) {
    return NextResponse.json(
      { error: "Missing or invalid required fields" },
      { status: 400 },
    );
  }

  if (!admin.isMainAdmin && barberId !== userId) {
    return NextResponse.json(
      { error: "You can only assign bookings to yourself" },
      { status: 403 },
    );
  }

  const [barber] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, barberId))
    .limit(1);

  if (!barber) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  const startAt = new Date(startAtIso);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }

  const service = getService(serviceKey);
  const endAt = addMinutes(startAt, durationMinutes);
  const candidate = { startAt, endAt };

  const existing = await db
    .select({
      startAt: bookings.startAt,
      endAt: bookings.endAt,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.barberId, barberId),
        ne(bookings.id, id),
        lt(bookings.startAt, endAt),
        gt(bookings.endAt, startAt),
        inArray(bookings.status, ["CONFIRMED", "PENDING_PAYMENT"] as const),
      ),
    );

  const isConflict = existing.some((booking) => overlaps(candidate, booking));
  if (isConflict) {
    return NextResponse.json(
      { error: "That time slot is already taken" },
      { status: 409 },
    );
  }

  await db
    .update(bookings)
    .set({
      barberId,
      serviceKey,
      serviceName: service.name,
      priceCad: service.priceCAD,
      durationMinutes,
      startAt,
      endAt,
      customerName,
      customerEmail,
      customerPhone,
      notes: notes?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id));

  return NextResponse.json({
    ok: true,
    id,
    barberId,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthedAdmin(_req);
  if (!auth.userId || !auth.admin || !auth.db) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { admin, userId, db } = auth;

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, id))
    .limit(1);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (booking.barberId !== userId && !admin.isMainAdmin) {
    return NextResponse.json(
      { error: "You can only delete your own bookings" },
      { status: 403 },
    );
  }

  await db.delete(bookings).where(eq(bookings.id, id));
  return NextResponse.json({ ok: true });
}
