"use client";

import { useEffect, useState } from "react";
import { Container, Card, Button } from "@/components/ui";
import { AdminCalendar } from "@/components/admin-calendar";
import { AddBarberForm } from "@/components/add-barber-form";
type Barber = { id: string; name: string };

type CalendarData = {
  barbers: Barber[];
  events: Array<{ id: string; title: string; start: string; end: string; status?: string }>;
  blocks: Array<{
    id: string;
    title: string;
    displayTitle: string;
    startAtIso: string;
    endAtIso: string;
    barberId: string;
    barberName: string;
  }>;
  bookings: Array<{
    id: string;
    barberId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    serviceKey: string;
    serviceName: string;
    priceCad: number;
    status: string;
    startAtIso: string;
    durationMinutes: number;
    timeRange: string;
    barberName?: string;
    notes: string | null;
  }>;
  viewBarberId: string;
  viewTitle: string;
  rows: Array<{
    id: string;
    startAt: string;
    timeFormatted: string;
    barberId: string;
    barberName: string;
    customerName: string;
    serviceName: string;
    status: string;
    customerPhone: string;
    customerEmail: string;
  }>;
  viewAll: boolean;
};

const statusLabel: Record<string, string> = {
  PENDING_PAYMENT: "Pending",
  CONFIRMED: "Paid",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
};

export function AdminDashboard({
  initialData,
  isMainAdmin,
  bearerToken,
}: {
  initialData: CalendarData;
  isMainAdmin: boolean;
  bearerToken: string | null;
}) {
  const [viewBarber, setViewBarber] = useState(
    initialData.viewBarberId === "all" ? "all" : initialData.viewBarberId,
  );
  const [data, setData] = useState<CalendarData>(initialData);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetchCurrentView = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setData((prev) => ({ ...prev, barbers: initialData.barbers }));
  }, [initialData.barbers]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      try {
        const headers: HeadersInit = { "Cache-Control": "no-store" };
        if (bearerToken) {
          headers["Authorization"] = `Bearer ${bearerToken}`;
        }
        const res = await fetch(
          `/api/admin/calendar?barber=${encodeURIComponent(viewBarber)}`,
          { credentials: "include", cache: "no-store", headers },
        );
        if (cancelled) return;
        if (res.ok) {
          const apiData = await res.json();
          setData(apiData);
          return;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setData(initialData);
    }

    load().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [viewBarber, refreshKey, bearerToken]);

  const rows = data.rows ?? [];

  return (
    <div className="min-h-screen">
      <Container className="py-10 space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-xs font-semibold tracking-widest text-white/60">
              ADMIN DASHBOARD
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {loading ? "Loading…" : data.viewTitle} calendar
            </h1>
            <p className="text-sm text-white/70">
              Click an empty time slot to add a block or manual booking.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isMainAdmin && data.barbers.length >= 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">View:</span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setViewBarber("all")}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      viewBarber === "all"
                        ? "bg-[color:var(--color-accent)]/30 text-white"
                        : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                    }`}
                  >
                    All
                  </button>
                  {data.barbers.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setViewBarber(b.id)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                        viewBarber === b.id
                          ? "bg-[color:var(--color-accent)]/30 text-white"
                          : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                      }`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Button href="/admin/logout" variant="secondary">
              Logout
            </Button>
          </div>
        </div>

        {isMainAdmin && (
          <AddBarberForm barbers={data.barbers} bearerToken={bearerToken} />
        )}

        <AdminCalendar
          key={data.viewBarberId}
          events={data.events}
          blocks={data.blocks}
          bookings={data.bookings}
          statusLabel={statusLabel}
          barberId={data.viewBarberId}
          barbers={data.barbers}
          isMainAdmin={isMainAdmin}
          bearerToken={bearerToken}
          onRefresh={refetchCurrentView}
        />

        <Card>
          <div className="flex items-baseline justify-between gap-6">
            <div className="text-sm font-semibold">Recent bookings</div>
            <div className="text-xs text-white/60">Total: {rows.length}</div>
          </div>
          <div className="mt-4 overflow-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="text-white/70">
                <tr className="border-b border-white/10">
                  <th className="py-3 text-left font-semibold">Status</th>
                  <th className="py-3 text-left font-semibold">When</th>
                  {data.viewAll && (
                    <th className="py-3 text-left font-semibold">Barber</th>
                  )}
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
                    <td className="py-3 text-white/80">{b.timeFormatted}</td>
                    {data.viewAll && (
                      <td className="py-3">{b.barberName ?? b.barberId}</td>
                    )}
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
