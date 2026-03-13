import { addMinutes, isBefore } from "date-fns";

import {
  SHOP_TIMEZONE,
  SLOT_INTERVAL_MINUTES,
  WEEKLY_HOURS,
} from "@/lib/business";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export type BusyInterval = { startAt: Date; endAt: Date };

function dayOfWeekInShopTz(dateISO: string) {
  const naive = new Date(`${dateISO}T00:00:00`);
  const utc = fromZonedTime(naive, SHOP_TIMEZONE);
  const zoned = toZonedTime(utc, SHOP_TIMEZONE);
  return zoned.getDay();
}

function shopLocalToUtc(dateISO: string, time24h: string) {
  const naive = new Date(`${dateISO}T${time24h}:00`);
  return fromZonedTime(naive, SHOP_TIMEZONE);
}

function overlaps(a: BusyInterval, b: BusyInterval) {
  return a.startAt < b.endAt && b.startAt < a.endAt;
}

export function getAvailableSlotsUtc(opts: {
  dateISO: string; // yyyy-mm-dd (shop local day)
  durationMinutes: number;
  busy: BusyInterval[];
}) {
  const { dateISO, durationMinutes, busy } = opts;

  const dow = dayOfWeekInShopTz(dateISO);
  const hours = WEEKLY_HOURS[dow];
  if (!hours || "closed" in hours) return [];

  const openUtc = shopLocalToUtc(dateISO, hours.open);
  const closeUtc = shopLocalToUtc(dateISO, hours.close);

  const slots: Date[] = [];
  let cursor = openUtc;
  const lastStart = addMinutes(closeUtc, -durationMinutes);

  while (isBefore(cursor, addMinutes(lastStart, 1))) {
    const slot: BusyInterval = {
      startAt: cursor,
      endAt: addMinutes(cursor, durationMinutes),
    };

    const isBusy = busy.some((b) => overlaps(b, slot));
    if (!isBusy) slots.push(cursor);

    cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES);
  }

  return slots;
}

