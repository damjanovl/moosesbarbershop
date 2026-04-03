import { NextResponse } from "next/server";

import { syncPendingBookingPaymentStatus } from "@/lib/booking-payment-sync";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const booking = await syncPendingBookingPaymentStatus(id);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: booking.id,
    status: booking.status,
    confirmed: booking.status === "CONFIRMED",
  });
}
