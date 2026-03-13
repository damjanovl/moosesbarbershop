import { desc } from "drizzle-orm";
import { redirect } from "next/navigation";

import { Container, Card, Button } from "@/components/ui";
import { AdminCalendar } from "@/components/admin-calendar";
import { isAdminAuthedFromCookies } from "@/lib/admin-auth";
import { ensureDbSchema } from "@/lib/db/ensure";
import { getDb } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { formatTimeFromUtc } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdminAuthedFromCookies())) redirect("/admin/login");
  await ensureDbSchema();
  const db = getDb();

  const rows = await db
    .select()
    .from(bookings)
    .orderBy(desc(bookings.startAt))
    .limit(500);

  const statusLabel: Record<string, string> = {
    PENDING_PAYMENT: "Pending",
    CONFIRMED: "Paid",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
  };

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
  }));

  return (
    <div className="min-h-screen">
      <Container className="py-10 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest text-white/60">
              ADMIN DASHBOARD
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Bookings calendar
            </h1>
            <p className="text-sm text-white/70">
              All bookings by status. Paid (confirmed) appear on the calendar.
            </p>
          </div>
          <Button href="/admin/logout" variant="secondary">
            Logout
          </Button>
        </div>

        <AdminCalendar events={events} bookings={bookingsData} statusLabel={statusLabel} />

        <Card>
          <div className="flex items-baseline justify-between gap-6">
            <div className="text-sm font-semibold">Recent bookings</div>
            <div className="text-xs text-white/60">
              Total: {rows.length}
            </div>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="py-3 text-left font-semibold">Status</th>
                  <th className="py-3 text-left font-semibold">When</th>
                  <th className="py-3 text-left font-semibold">Client</th>
                  <th className="py-3 text-left font-semibold">Service</th>
                  <th className="py-3 text-left font-semibold">Phone</th>
                  <th className="py-3 text-left font-semibold">Email</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id} className="border-b border-white/5">
                    <td className="py-3">
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold">
                        {statusLabel[b.status] ?? b.status}
                      </span>
                    </td>
                    <td className="py-3 text-white/80">
                      {b.startAt.toISOString().slice(0, 10)} •{" "}
                      {formatTimeFromUtc(b.startAt)}
                    </td>
                    <td className="py-3">{b.customerName}</td>
                    <td className="py-3">{b.serviceName}</td>
                    <td className="py-3 text-white/80">{b.customerPhone}</td>
                    <td className="py-3 text-white/80">{b.customerEmail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Container>
    </div>
  );
}

