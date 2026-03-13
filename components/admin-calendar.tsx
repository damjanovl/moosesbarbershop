"use client";

import { useState } from "react";
import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enCA } from "date-fns/locale/en-CA";
import { X } from "lucide-react";

import "react-big-calendar/lib/css/react-big-calendar.css";

type BookingEvent = Event & { resource?: { id: string; status?: string } };

type BookingDetail = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  priceCad: number;
  status: string;
  timeRange: string;
};

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

export function AdminCalendar({
  events,
  bookings,
  statusLabel,
}: {
  events: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    status?: string;
  }>;
  bookings: BookingDetail[];
  statusLabel: Record<string, string>;
}) {
  const [selectedBooking, setSelectedBooking] = useState<BookingDetail | null>(null);

  const mapped: BookingEvent[] = events
    .map((e) => ({
      title: e.title,
      start: new Date(e.start),
      end: new Date(e.end),
      allDay: false,
      resource: { id: e.id, status: e.status },
    }))
    .filter((e) => !Number.isNaN(e.start.getTime()) && !Number.isNaN(e.end.getTime()));

  const handleSelectEvent = (event: BookingEvent) => {
    const id = (event.resource as { id?: string })?.id;
    const booking = id ? bookings.find((b) => b.id === id) : null;
    if (booking) setSelectedBooking(booking);
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
            popup
            culture="en-CA"
            onSelectEvent={handleSelectEvent}
            formats={{
              eventTimeRangeFormat: () => "",
              eventTimeRangeStartFormat: () => "",
              eventTimeRangeEndFormat: () => "",
            }}
            eventPropGetter={(event) => {
              const status = (event.resource as { status?: string })?.status;
              const style = status ? statusColors[status] : undefined;
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
    </>
  );
}

