import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { z } from "zod";
import { addMinutes, isBefore } from "date-fns";
import { and, eq, gt, inArray, lt, or } from "drizzle-orm";

import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { getDepositCad, HOLD_MINUTES } from "@/lib/business";
import { getService, type ServiceKey } from "@/lib/services";
import { createDepositPaymentLink } from "@/lib/square";

const BodySchema = z.object({
  barberId: z.string().min(1),
  serviceKey: z.string(),
  startAtIso: z.string().datetime(),
  customerName: z.string().min(2).max(80),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7).max(30),
  notes: z.string().max(500).optional(),
});

function overlaps(
  a: { startAt: Date; endAt: Date },
  b: { startAt: Date; endAt: Date },
) {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

export async function POST(req: Request) {
  await ensureDbSchema();
  const db = getDb();

  const json = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const barberId = parsed.data.barberId;
  const serviceKey = parsed.data.serviceKey as ServiceKey;
  const service = getService(serviceKey);

  const startAt = new Date(parsed.data.startAtIso);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "Invalid startAtIso" }, { status: 400 });
  }

  const now = new Date();
  if (!isBefore(now, startAt)) {
    return NextResponse.json(
      { error: "Time slot must be in the future" },
      { status: 400 },
    );
  }

  const endAt = addMinutes(startAt, service.durationMinutes);

  const candidate = { startAt, endAt };

  const existing = await db
    .select({
      startAt: bookings.startAt,
      endAt: bookings.endAt,
      expiresAt: bookings.expiresAt,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.barberId, barberId),
        lt(bookings.startAt, endAt),
        gt(bookings.endAt, startAt),
        or(
          inArray(bookings.status, ["CONFIRMED"] as const),
          and(
            inArray(bookings.status, ["PENDING_PAYMENT"] as const),
            gt(bookings.expiresAt, now),
          ),
        ),
      ),
    );

  const isConflict = existing.some((b) => {
    if (b.status === "CONFIRMED") return overlaps(candidate, b);
    if (b.status === "PENDING_PAYMENT" && b.expiresAt && b.expiresAt > now)
      return overlaps(candidate, b);
    return false;
  });

  if (isConflict) {
    return NextResponse.json(
      { error: "That slot was just taken. Please pick another time." },
      { status: 409 },
    );
  }

  const bookingId = crypto.randomUUID();
  const expiresAt = addMinutes(now, HOLD_MINUTES);

  await db.insert(bookings).values({
    id: bookingId,
    barberId,
    status: "PENDING_PAYMENT",
    serviceKey,
    serviceName: service.name,
    priceCad: service.priceCAD,
    durationMinutes: service.durationMinutes,
    startAt,
    endAt,
    customerName: parsed.data.customerName,
    customerEmail: parsed.data.customerEmail,
    customerPhone: parsed.data.customerPhone,
    notes: parsed.data.notes ?? null,
    expiresAt,
  });

  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    return NextResponse.json(
      { error: "Missing SQUARE_LOCATION_ID" },
      { status: 500 },
    );
  }

  const siteUrl = process.env.SITE_URL ?? new URL(req.url).origin;
  const redirectUrl = `${siteUrl}/book/return?bookingId=${encodeURIComponent(
    bookingId,
  )}`;

  const link = await createDepositPaymentLink({
    bookingId,
    buyerEmail: parsed.data.customerEmail,
    locationId,
    redirectUrl,
    depositCad: getDepositCad(service.priceCAD),
  });

  await db
    .update(bookings)
    .set({
      squarePaymentLinkId: link.paymentLinkId,
      squareOrderId: link.orderId,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId));

  return NextResponse.json({
    bookingId,
    checkoutUrl: link.url,
    expiresAt: expiresAt.toISOString(),
  });
}

