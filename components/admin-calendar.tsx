"use client";

import { Calendar, dateFnsLocalizer, type Event } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enCA } from "date-fns/locale/en-CA";

import "react-big-calendar/lib/css/react-big-calendar.css";

type BookingEvent = Event & { resource?: { id: string } };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: enCA }),
  getDay,
  locales: { "en-CA": enCA },
});

export function AdminCalendar({
  events,
}: {
  events: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
  }>;
}) {
  const mapped: BookingEvent[] = events.map((e) => ({
    title: e.title,
    start: new Date(e.start),
    end: new Date(e.end),
    allDay: false,
    resource: { id: e.id },
  }));

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 overflow-hidden">
      <div className="h-[720px]">
        <Calendar
          localizer={localizer}
          events={mapped}
          startAccessor="start"
          endAccessor="end"
          defaultView="week"
          views={["week", "day", "agenda", "month"]}
          popup
        />
      </div>
    </div>
  );
}

