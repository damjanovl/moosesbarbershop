import { NextResponse } from "next/server";
import { z } from "zod";
import { addDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { and, gt, inArray, lt, or } from "drizzle-orm";

import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { SHOP_TIMEZONE } from "@/lib/business";
import { getService, type ServiceKey } from "@/lib/services";
import { getAvailableSlotsUtc } from "@/lib/availability";

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  service: z.string(),
});

export async function GET(req: Request) {
  await ensureDbSchema();
  const db = getDb();

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    date: url.searchParams.get("date"),
    service: url.searchParams.get("service"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query params" },
      { status: 400 },
    );
  }

  const dateISO = parsed.data.date;
  const serviceKey = parsed.data.service as ServiceKey;
  const service = getService(serviceKey);

  const dayStartUtc = fromZonedTime(
    new Date(`${dateISO}T00:00:00`),
    SHOP_TIMEZONE,
  );
  const dayEndUtc = fromZonedTime(
    addDays(new Date(`${dateISO}T00:00:00`), 1),
    SHOP_TIMEZONE,
  );

  const now = new Date();

  const rows = await db
    .select({
      startAt: bookings.startAt,
      endAt: bookings.endAt,
      expiresAt: bookings.expiresAt,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        lt(bookings.startAt, dayEndUtc),
        gt(bookings.endAt, dayStartUtc),
        or(
          inArray(bookings.status, ["CONFIRMED"] as const),
          and(
            inArray(bookings.status, ["PENDING_PAYMENT"] as const),
            gt(bookings.expiresAt, now),
          ),
        ),
      ),
    );

  const busy = rows
    .filter((r) => r.status === "CONFIRMED" || (r.expiresAt && r.expiresAt > now))
    .map((r) => ({ startAt: r.startAt, endAt: r.endAt }));

  const slots = getAvailableSlotsUtc({
    dateISO,
    durationMinutes: service.durationMinutes,
    busy,
  });

  return NextResponse.json({ slots: slots.map((d) => d.toISOString()) });
}

