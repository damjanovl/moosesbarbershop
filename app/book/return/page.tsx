import { eq } from "drizzle-orm";

import { BookingReturnStatus } from "@/components/booking-return-status";
import { Container, Card, Button } from "@/components/ui";
import { syncPendingBookingPaymentStatus } from "@/lib/booking-payment-sync";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";

export default async function BookReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { bookingId } = await searchParams;
  let initialStatus: string | null = null;

  if (bookingId) {
    try {
      const synced = await syncPendingBookingPaymentStatus(bookingId);
      initialStatus = synced?.status ?? null;
    } catch {
      await ensureDbSchema();
      const db = getDb();
      const [booking] = await db
        .select({ status: bookings.status })
        .from(bookings)
        .where(eq(bookings.id, bookingId))
        .limit(1);
      initialStatus = booking?.status ?? null;
    }
  }

  return (
    <div className="min-h-screen">
      <Container className="py-14">
        <Card className="max-w-2xl">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-white/80">Payment status</div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Thanks — we&apos;re processing your booking.
            </h1>
            <p className="text-sm text-white/70 leading-7">
              If your Square payment completed successfully, we’ll email you a
              confirmation shortly. If you don’t see it within a few minutes,
              please check your spam folder or call the shop.
            </p>
            <BookingReturnStatus
              bookingId={bookingId ?? null}
              initialStatus={initialStatus}
            />
            {bookingId ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                Booking ID: <span className="text-white">{bookingId}</span>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/">Back to Home</Button>
              <Button href="/book" variant="secondary">
                Book Another Appointment
              </Button>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  );
}

