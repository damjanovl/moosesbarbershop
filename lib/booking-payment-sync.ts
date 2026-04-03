import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { sendBookingConfirmedEmails } from "@/lib/email";
import { getSquareClient } from "@/lib/square";

async function markBookingConfirmedFromSquarePayment(opts: {
  bookingId: string;
  paymentId?: string | null;
  orderId?: string | null;
}) {
  const db = getDb();
  const updated = await db
    .update(bookings)
    .set({
      status: "CONFIRMED",
      squarePaymentId: opts.paymentId ?? null,
      squareOrderId: opts.orderId ?? null,
      expiresAt: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(bookings.id, opts.bookingId),
        inArray(bookings.status, ["PENDING_PAYMENT"] as const),
      ),
    )
    .returning();

  if (updated.length > 0) {
    await sendBookingConfirmedEmails({ booking: updated[0] });
  }

  return updated[0] ?? null;
}

export async function syncPendingBookingPaymentStatus(bookingId: string) {
  await ensureDbSchema();
  const db = getDb();

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!booking) return null;
  if (booking.status !== "PENDING_PAYMENT") return booking;
  if (!booking.squareOrderId) return booking;

  try {
    const client = getSquareClient();
    const paymentPage = await client.payments.list({
      beginTime: new Date(booking.createdAt.getTime() - 60 * 60 * 1000).toISOString(),
      locationId: process.env.SQUARE_LOCATION_ID ?? undefined,
      limit: 100,
      sortField: "UPDATED_AT",
      sortOrder: "DESC",
    });

    for await (const payment of paymentPage) {
      if (payment.orderId !== booking.squareOrderId) continue;
      if (payment.status !== "COMPLETED") continue;

      const updated = await markBookingConfirmedFromSquarePayment({
        bookingId: booking.id,
        paymentId: payment.id ?? null,
        orderId: payment.orderId ?? booking.squareOrderId,
      });

      return updated ?? booking;
    }
  } catch {
    return booking;
  }

  return booking;
}

export async function confirmBookingFromSquareWebhook(opts: {
  bookingId: string;
  paymentId?: string | null;
  orderId?: string | null;
}) {
  await ensureDbSchema();
  const db = getDb();

  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.id, opts.bookingId))
    .limit(1);

  if (!booking) return null;
  if (booking.status !== "PENDING_PAYMENT") return booking;

  return (
    (await markBookingConfirmedFromSquarePayment({
      bookingId: booking.id,
      paymentId: opts.paymentId ?? null,
      orderId: opts.orderId ?? booking.squareOrderId,
    })) ?? booking
  );
}
