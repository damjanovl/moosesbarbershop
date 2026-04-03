import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { addMinutes } from "date-fns";
import { and, eq, gt, inArray, lt } from "drizzle-orm";

import { getAdminUserIdFromCookies } from "@/lib/admin-auth";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { adminUsers, bookings } from "@/lib/db/schema";
import { getService, SERVICES, type ServiceKey } from "@/lib/services";

const BodySchema = {
  barberId: (v: unknown) => v === undefined || (typeof v === "string" && v.trim().length > 0),
  serviceKey: (v: unknown) => v === undefined || (typeof v === "string" && v.trim().length > 0),
  startAtIso: (v: unknown) => typeof v === "string" && v.length > 0,
  customerName: (v: unknown) =>
    typeof v === "string" && v.trim().length >= 1 && v.trim().length <= 80,
  customerEmail: (v: unknown) =>
    v === undefined || (typeof v === "string" && v.trim().length <= 320),
  customerPhone: (v: unknown) =>
    v === undefined || (typeof v === "string" && v.trim().length <= 50),
  notes: (v: unknown) =>
    v === undefined || (typeof v === "string" && v.trim().length <= 500),
  durationMinutes: (v: unknown) =>
    typeof v === "number" &&
      Number.isInteger(v) &&
      v >= 15 &&
      v <= 480,
};

function isServiceKey(value: string): value is ServiceKey {
  return SERVICES.some((s) => s.key === value);
}

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

  const barberId =
    BodySchema.barberId(json.barberId) && typeof json.barberId === "string"
      ? json.barberId.trim()
      : null;
  const serviceKey =
    BodySchema.serviceKey(json.serviceKey) && typeof json.serviceKey === "string"
      ? json.serviceKey.trim()
      : null;
  const startAtIso = BodySchema.startAtIso(json.startAtIso)
    ? json.startAtIso
    : null;
  const customerName = BodySchema.customerName(json.customerName)
    ? json.customerName.trim()
    : null;
  const customerEmail =
    BodySchema.customerEmail(json.customerEmail) && typeof json.customerEmail === "string"
      ? json.customerEmail.trim()
      : undefined;
  const customerPhone =
    BodySchema.customerPhone(json.customerPhone) && typeof json.customerPhone === "string"
      ? json.customerPhone.trim()
      : undefined;
  const notes =
    BodySchema.notes(json.notes) && typeof json.notes === "string"
      ? json.notes.trim()
      : undefined;
  const durationMinutes = BodySchema.durationMinutes(json.durationMinutes)
    ? (json.durationMinutes as number)
    : null;

  if (!startAtIso || !customerName || !durationMinutes) {
    return NextResponse.json(
      { error: "Missing or invalid required fields" },
      { status: 400 },
    );
  }

  const resolvedBarberId = barberId || admin.id;
  const defaultServiceKey = SERVICES[0]?.key;
  if (!defaultServiceKey) {
    return NextResponse.json({ error: "Services are not configured" }, { status: 500 });
  }
  const resolvedServiceKey =
    serviceKey && isServiceKey(serviceKey) ? serviceKey : defaultServiceKey;

  const [barber] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.id, resolvedBarberId))
    .limit(1);

  if (!barber) {
    return NextResponse.json({ error: "Barber not found" }, { status: 404 });
  }

  const service = getService(resolvedServiceKey);
  const startAt = new Date(startAtIso);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "Invalid start time" }, { status: 400 });
  }

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
        eq(bookings.barberId, resolvedBarberId),
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
    barberId: resolvedBarberId,
    status: "CONFIRMED",
    serviceKey: resolvedServiceKey,
    serviceName: service.name,
    priceCad: service.priceCAD,
    durationMinutes,
    startAt,
    endAt,
    customerName,
    customerEmail: customerEmail || "",
    customerPhone: customerPhone || "",
    notes: notes || null,
    expiresAt: null,
  });

  return NextResponse.json({
    id: bookingId,
    barberId: resolvedBarberId,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  });
}
