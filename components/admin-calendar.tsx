"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, dateFnsLocalizer, type Event, type SlotInfo } from "react-big-calendar";
import { addMinutes, format, parse, startOfWeek, getDay } from "date-fns";
import { enCA } from "date-fns/locale/en-CA";
import { X } from "lucide-react";

import "react-big-calendar/lib/css/react-big-calendar.css";
import { Button, cn } from "@/components/ui";
import { SERVICES } from "@/lib/services";

type BookingEvent = Event & { resource?: { id: string; status?: string; type?: "booking" | "block" } };

type BookingDetail = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  priceCad: number;
  status: string;
  timeRange: string;
  barberName?: string;
};

type Barber = { id: string; name: string };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enCA }),
  getDay,
  locales: { "en-CA": enCA },
});

const statusColors: Record<string, { bg: string; border: string }> = {
  CONFIRMED: { bg: "rgba(212, 163, 115, 0.8)", border: "transparent" },
  PENDING_PAYMENT: { bg: "rgba(234, 179, 8, 0.6)", border: "transparent" },
  CANCELLED: { bg: "rgba(239, 68, 68, 0.5)", border: "transparent" },
  EXPIRED: { bg: "rgba(107, 114, 128, 0.5)", border: "transparent" },
};

const BLOCK_COLOR = { bg: "rgba(100, 100, 100, 0.6)", border: "transparent" };

/** Same slot step as `<Calendar step={…} />` — used for business-hour overlap checks. */
const CALENDAR_STEP_MINUTES = 30;

const MIN_BOOKING_DURATION = 15;
const MAX_BOOKING_DURATION = 480;
/** Block / manual length picker step (calendar slots remain {CALENDAR_STEP_MINUTES} min). */
const DURATION_PICKER_STEP = 15;

function normalizeBlockDurationMinutes(minutes: number): number {
  const clamped = Math.min(
    MAX_BOOKING_DURATION,
    Math.max(MIN_BOOKING_DURATION, minutes),
  );
  return Math.round(clamped / DURATION_PICKER_STEP) * DURATION_PICKER_STEP;
}

/**
 * Business hours by `getDay()` index: 0 Sun … 6 Sat. Times are minutes from midnight.
 * Mon 11–5, Tue–Wed 11–7, Thu–Fri 10–8, Sat 9–6, Sun 11–5.
 */
const BUSINESS_MINUTES_BY_WEEKDAY: Record<number, { open: number; close: number }> = {
  0: { open: 11 * 60, close: 17 * 60 },
  1: { open: 11 * 60, close: 17 * 60 },
  2: { open: 11 * 60, close: 19 * 60 },
  3: { open: 11 * 60, close: 19 * 60 },
  4: { open: 10 * 60, close: 20 * 60 },
  5: { open: 10 * 60, close: 20 * 60 },
  6: { open: 9 * 60, close: 18 * 60 },
};

/** Earliest open / latest close across the week — bounds the time grid (week + day views). */
const CALENDAR_MIN_TIME = new Date(1970, 0, 1, 9, 0, 0);
const CALENDAR_MAX_TIME = new Date(1970, 0, 1, 20, 0, 0);

function slotOverlapsBusinessHours(slotStart: Date, stepMinutes: number): boolean {
  const day = getDay(slotStart);
  const { open, close } = BUSINESS_MINUTES_BY_WEEKDAY[day];
  const startMin = slotStart.getHours() * 60 + slotStart.getMinutes();
  const endMin = startMin + stepMinutes;
  return endMin > open && startMin < close;
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f12] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
        <h3 className="pr-8 text-lg font-semibold">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function AdminCalendar({
  events,
  blocks,
  bookings,
  statusLabel,
  barberId,
  barbers,
  isMainAdmin,
  onRefresh,
}: {
  events: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    status?: string;
  }>;
  blocks: Array<{ id: string; title: string; start: string; end: string }>;
  bookings: BookingDetail[];
  statusLabel: Record<string, string>;
  barberId: string;
  barbers: Barber[];
  isMainAdmin: boolean;
  onRefresh?: () => void;
}) {
  const router = useRouter();
  const refresh = onRefresh ?? (() => router.refresh());

  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);
  const [addModal, setAddModal] = useState<{
    start: Date;
    end: Date;
    mode: "block" | "booking";
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookingEvents: BookingEvent[] = events
    .map((e) => ({
      title: e.title,
      start: new Date(e.start),
      end: new Date(e.end),
      allDay: false,
      resource: { id: e.id, status: e.status, type: "booking" as const },
    }))
    .filter((e) => !Number.isNaN(e.start.getTime()) && !Number.isNaN(e.end.getTime()));

  const blockEvents: BookingEvent[] = blocks.map((b) => ({
    title: b.title,
    start: new Date(b.start),
    end: new Date(b.end),
    allDay: false,
    resource: { id: b.id, type: "block" as const },
  }));

  const mapped: BookingEvent[] = [...bookingEvents, ...blockEvents];

  const handleSelectEvent = (event: BookingEvent) => {
    const res = event.resource as { id?: string; type?: string };
    if (res?.type === "block") return;
    const booking = res?.id ? bookings.find((b) => b.id === res.id) : null;
    if (booking) setSelectedBooking(booking);
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    setAddModal({
      start: slotInfo.start,
      end: slotInfo.end,
      mode: "block",
    });
    setError(null);
  };

  return (
    <>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3 overflow-hidden">
        <div className="h-[720px]">
          <Calendar
            localizer={localizer}
            events={mapped}
            startAccessor="start"
            endAccessor="end"
            defaultView="week"
            defaultDate={new Date()}
            views={["week", "day", "agenda", "month"]}
            min={CALENDAR_MIN_TIME}
            max={CALENDAR_MAX_TIME}
            step={CALENDAR_STEP_MINUTES}
            slotPropGetter={(date) =>
              slotOverlapsBusinessHours(date, CALENDAR_STEP_MINUTES)
                ? {}
                : { style: { backgroundColor: "rgba(0, 0, 0, 0.22)" } }
            }
            popup
            culture="en-CA"
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            formats={{
              eventTimeRangeFormat: () => "",
              eventTimeRangeStartFormat: () => "",
              eventTimeRangeEndFormat: () => "",
            }}
            eventPropGetter={(event) => {
              const res = event.resource as { status?: string; type?: string };
              if (res?.type === "block") {
                return { style: { backgroundColor: BLOCK_COLOR.bg, borderColor: BLOCK_COLOR.border } };
              }
              const style = res?.status ? statusColors[res.status] : undefined;
              return style ? { style: { backgroundColor: style.bg, borderColor: style.border } } : {};
            }}
          />
        </div>
      </div>

      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f12] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedBooking(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="pr-8 text-lg font-semibold">{selectedBooking.customerName}</h3>

            <dl className="mt-4 space-y-3 text-sm">
              {selectedBooking.barberName && (
                <div>
                  <dt className="text-white/50">Barber</dt>
                  <dd className="font-medium">{selectedBooking.barberName}</dd>
                </div>
              )}
              <div>
                <dt className="text-white/50">Service</dt>
                <dd className="font-medium">{selectedBooking.serviceName}</dd>
              </div>
              <div>
                <dt className="text-white/50">Time</dt>
                <dd className="font-medium">{selectedBooking.timeRange}</dd>
              </div>
              <div>
                <dt className="text-white/50">Status</dt>
                <dd>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold">
                    {statusLabel[selectedBooking.status] ?? selectedBooking.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-white/50">Payment</dt>
                <dd className="font-medium">${selectedBooking.priceCad} CAD</dd>
              </div>
              <div>
                <dt className="text-white/50">Email</dt>
                <dd className="font-medium">{selectedBooking.customerEmail}</dd>
              </div>
              <div>
                <dt className="text-white/50">Phone</dt>
                <dd className="font-medium">{selectedBooking.customerPhone}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {addModal && (
        <AddSlotModal
          key={`${addModal.start.toISOString()}_${addModal.end.toISOString()}`}
          start={addModal.start}
          end={addModal.end}
          mode={addModal.mode}
          barberId={barberId}
          barbers={barbers}
          isMainAdmin={isMainAdmin}
          onClose={() => {
            setAddModal(null);
            setError(null);
          }}
          onSuccess={() => {
            setAddModal(null);
            setError(null);
            refresh();
          }}
          error={error}
          setError={setError}
          submitting={submitting}
          setSubmitting={setSubmitting}
        />
      )}
    </>
  );
}

function AddSlotModal({
  start,
  end,
  mode,
  barberId,
  barbers,
  isMainAdmin,
  onClose,
  onSuccess,
  error,
  setError,
  submitting,
  setSubmitting,
}: {
  start: Date;
  end: Date;
  mode: "block" | "booking";
  barberId: string;
  barbers: Barber[];
  isMainAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
  error: string | null;
  setError: (e: string | null) => void;
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
}) {
  const [title, setTitle] = useState("");
  const [formMode, setFormMode] = useState<"block" | "booking">(mode);
  const [targetBarberId, setTargetBarberId] = useState(
    barberId === "all" ? barbers[0]?.id ?? "" : barberId,
  );
  const [serviceKey, setServiceKey] = useState<string>(SERVICES[0]?.key ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [blockDurationMinutes, setBlockDurationMinutes] = useState(() =>
    normalizeBlockDurationMinutes(
      Math.round((end.getTime() - start.getTime()) / 60000),
    ),
  );
  const [bookingDurationMinutes, setBookingDurationMinutes] = useState(
    () => SERVICES.find((s) => s.key === serviceKey)?.durationMinutes ?? 30,
  );

  const service = SERVICES.find((s) => s.key === serviceKey);
  useEffect(() => {
    setBookingDurationMinutes(service?.durationMinutes ?? 30);
  }, [serviceKey, service?.durationMinutes]);

  const blockEnd = addMinutes(
    start,
    normalizeBlockDurationMinutes(Math.round(blockDurationMinutes)),
  );
  const bookingEnd = addMinutes(start, Math.round(bookingDurationMinutes));

  async function handleAddBlock() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!targetBarberId) {
      setError("Please select a barber");
      return;
    }
    const blockDuration = normalizeBlockDurationMinutes(
      Math.round(blockDurationMinutes),
    );
    if (
      !Number.isFinite(blockDuration) ||
      blockDuration < MIN_BOOKING_DURATION ||
      blockDuration > MAX_BOOKING_DURATION
    ) {
      setError(`Duration must be ${MIN_BOOKING_DURATION}–${MAX_BOOKING_DURATION} minutes`);
      return;
    }
    const blockEndAt = addMinutes(start, blockDuration);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/blocks", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          barberId: targetBarberId,
          title: title.trim(),
          startAtIso: start.toISOString(),
          endAtIso: blockEndAt.toISOString(),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Failed to add block");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add block");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddBooking() {
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setError("Name, email, and phone are required");
      return;
    }
    if (!targetBarberId) {
      setError("Please select a barber");
      return;
    }
    if (!serviceKey) {
      setError("Please select a service");
      return;
    }
    const durationRounded = Math.round(bookingDurationMinutes);
    if (
      !Number.isFinite(bookingDurationMinutes) ||
      durationRounded < MIN_BOOKING_DURATION ||
      durationRounded > MAX_BOOKING_DURATION
    ) {
      setError(`Duration must be ${MIN_BOOKING_DURATION}–${MAX_BOOKING_DURATION} minutes`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/booking/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          barberId: targetBarberId,
          serviceKey,
          startAtIso: start.toISOString(),
          durationMinutes: durationRounded,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          customerPhone: customerPhone.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Failed to add booking");
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add booking");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} title="Add to calendar">
      <div className="mt-4 space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormMode("block")}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition",
              formMode === "block"
                ? "border-[color:var(--color-accent)]/50 bg-white/10"
                : "border-white/10 bg-white/5 hover:bg-white/10",
            )}
          >
            Block (e.g. lunch)
          </button>
          <button
            type="button"
            onClick={() => setFormMode("booking")}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition",
              formMode === "booking"
                ? "border-[color:var(--color-accent)]/50 bg-white/10"
                : "border-white/10 bg-white/5 hover:bg-white/10",
            )}
          >
            Manual booking
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="text-xs text-white/60">
          <span className="text-white/45">Time range: </span>
          {start.toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" })} –{" "}
          {formMode === "block"
            ? blockEnd.toLocaleString("en-CA", { timeStyle: "short" })
            : bookingEnd.toLocaleString("en-CA", { timeStyle: "short" })}
        </div>

        {formMode === "block" ? (
          <>
            <div className="space-y-1">
              <label className="text-xs text-white/60" htmlFor="block-duration">
                Length (minutes)
              </label>
              <input
                id="block-duration"
                type="number"
                min={MIN_BOOKING_DURATION}
                max={MAX_BOOKING_DURATION}
                step={DURATION_PICKER_STEP}
                value={blockDurationMinutes}
                onChange={(e) => {
                  const v = e.target.valueAsNumber;
                  if (e.target.value.trim() === "" || Number.isNaN(v)) return;
                  setBlockDurationMinutes(v);
                }}
                onBlur={() =>
                  setBlockDurationMinutes((m) =>
                    normalizeBlockDurationMinutes(Math.round(m)),
                  )
                }
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
              />
              <p className="text-[11px] text-white/45">
                Snaps to {DURATION_PICKER_STEP}-minute steps on blur. Drag-select
                suggested{" "}
                {normalizeBlockDurationMinutes(
                  Math.round((end.getTime() - start.getTime()) / 60000),
                )}
                min.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Lunch break"
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
              />
            </div>
            {(barberId === "all" || (isMainAdmin && barbers.length > 1)) && (
              <div className="space-y-1">
                <label className="text-xs text-white/60">Barber</label>
                <select
                  value={targetBarberId}
                  onChange={(e) => setTargetBarberId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
                >
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Button onClick={handleAddBlock} disabled={submitting}>
              {submitting ? "Adding…" : "Add block"}
            </Button>
          </>
        ) : (
          <>
            {(barberId === "all" || (isMainAdmin && barbers.length > 1)) && (
              <div className="space-y-1">
                <label className="text-xs text-white/60">Barber</label>
                <select
                  value={targetBarberId}
                  onChange={(e) => setTargetBarberId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
                >
                  {barbers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs text-white/60">Service</label>
              <select
                value={serviceKey}
                onChange={(e) => setServiceKey(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
              >
                {SERVICES.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.name} ({s.durationMinutes} min)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60" htmlFor="booking-duration">
                Appointment length (minutes)
              </label>
              <input
                id="booking-duration"
                type="number"
                min={MIN_BOOKING_DURATION}
                max={MAX_BOOKING_DURATION}
                step={5}
                value={bookingDurationMinutes}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (Number.isNaN(v)) return;
                  setBookingDurationMinutes(v);
                }}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
              />
              <p className="text-[11px] text-white/45">
                Defaults to the service length; change if the cut will run longer or shorter.
              </p>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Customer name</label>
              <input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Phone</label>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Notes (optional)</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
              />
            </div>
            <Button onClick={handleAddBooking} disabled={submitting}>
              {submitting ? "Adding…" : "Add booking"}
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}

