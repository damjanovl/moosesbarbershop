import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { confirmBookingFromSquareWebhook } from "@/lib/booking-payment-sync";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { verifySquareWebhookSignature } from "@/lib/square";

function extractBookingIdFromNote(note: unknown) {
  if (typeof note !== "string") return null;
  const m = note.match(/bookingId=([0-9a-fA-F-]{16,})/);
  return m?.[1] ?? null;
}

export async function POST(req: Request) {
  await ensureDbSchema();
  const db = getDb();

  const bodyText = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");
  const notificationUrl =
    process.env.SQUARE_WEBHOOK_NOTIFICATION_URL ?? new URL(req.url).toString();

  const ok = verifySquareWebhookSignature({
    signatureHeader: signature,
    notificationUrl,
    bodyText,
  });
  if (!ok) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(bodyText) as any;
  const type = event?.type as string | undefined;

  // We only need to confirm bookings after a successful payment.
  if (!type || !type.startsWith("payment.")) {
    return NextResponse.json({ ok: true });
  }

  const payment = event?.data?.object?.payment;
  const paymentStatus = payment?.status as string | undefined;
  const orderId = (payment?.order_id ?? payment?.orderId) as string | undefined;
  const paymentId = payment?.id as string | undefined;
  const note = payment?.note;

  if (paymentStatus !== "COMPLETED" || (!orderId && !note)) {
    return NextResponse.json({ ok: true });
  }

  const bookingIdFromNote = extractBookingIdFromNote(note);

  const booking =
    orderId
      ? await db
          .select()
          .from(bookings)
          .where(eq(bookings.squareOrderId, orderId))
          .limit(1)
          .then((r) => r[0] ?? null)
      : null;

  const bookingId = booking?.id ?? bookingIdFromNote;
  if (!bookingId) return NextResponse.json({ ok: true });

  await confirmBookingFromSquareWebhook({
    bookingId,
    paymentId: paymentId ?? null,
    orderId: orderId ?? null,
  });

  return NextResponse.json({ ok: true });
}

