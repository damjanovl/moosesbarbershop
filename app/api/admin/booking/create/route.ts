import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { addMinutes } from "date-fns";
import { and, eq, gt, inArray, lt, or } from "drizzle-orm";

import { getAdminUserIdFromCookies } from "@/lib/admin-auth";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { adminUsers, bookings } from "@/lib/db/schema";
import { getService, type ServiceKey } from "@/lib/services";

const BodySchema = {
  barberId: (v: unknown) => typeof v === "string" && v.length > 0,
  serviceKey: (v: unknown) => typeof v === "string" && v.length > 0,
  startAtIso: (v: unknown) => typeof v === "string" && v.length > 0,
  customerName: (v: unknown) =>
    typeof v === "string" && v.length >= 2 && v.length <= 80,
  customerEmail: (v: unknown) =>
    typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  customerPhone: (v: unknown) =>
    typeof v === "string" && v.length >= 7 && v.length <= 30,
  notes: (v: unknown) =>
    v === undefined || (typeof v === "string" && v.length <= 500),
  durationMinutes: (v: unknown) =>
    v === undefined ||
    (typeof v === "number" &&
      Number.isInteger(v) &&
      v >= 15 &&
      v <= 480),
};

function overlaps(
  a: { startAt: Date; endAt: Date },
  b: { startAt: Date; endAt: Date },
) {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

export async function POST(req: Request) {
  await ensureDbSchema();
  const userId = await getAdminUserIdFromCookies();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [admin] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, userId))
    .limit(1);

  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    ? json.customerEmail
    : null;
  const customerPhone = BodySchema.customerPhone(json.customerPhone)
    ? json.customerPhone
    : null;
  const notes = BodySchema.notes(json.notes) ? json.notes : undefined;
  const durationOverride = BodySchema.durationMinutes(json.durationMinutes)
    ? (json.durationMinutes as number)
    : null;

  if (
    !barberId ||
    !serviceKey ||
    !startAtIso ||
    !customerName ||
    !customerEmail ||
    !customerPhone
  ) {
    return NextResponse.json(
      { error: "Missing or invalid required fields" },
      { status: 400 },
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

  const service = getService(serviceKey);
  const startAt = new Date(startAtIso);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }

  const durationMinutes = durationOverride ?? service.durationMinutes;
  const endAt = addMinutes(startAt, durationMinutes);
  const candidate = { startAt, endAt };

  const existing = await db
    .select({
      startAt: bookings.startAt,
      endAt: bookings.endAt,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.barberId, barberId),
        lt(bookings.startAt, endAt),
        gt(bookings.endAt, startAt),
        inArray(bookings.status, ["CONFIRMED", "PENDING_PAYMENT"] as const),
      ),
    );

  const isConflict = existing.some((b) => overlaps(candidate, b));
  if (isConflict) {
    return NextResponse.json(
      { error: "That time slot is already taken" },
      { status: 409 },
    );
  }

  const bookingId = crypto.randomUUID();
  await db.insert(bookings).values({
    id: bookingId,
    barberId,
    status: "CONFIRMED",
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
    expiresAt: null,
  });

  return NextResponse.json({
    id: bookingId,
    barberId,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  });
}
