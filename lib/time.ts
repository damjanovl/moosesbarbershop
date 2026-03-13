import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";

import { SHOP_TIMEZONE } from "@/lib/business";

export function localDateTimeToUtc(dateISO: string, time24h: string) {
  const naive = new Date(`${dateISO}T${time24h}:00`);
  return fromZonedTime(naive, SHOP_TIMEZONE);
}

export function dateIsoFromUtc(date: Date) {
  return formatInTimeZone(date, SHOP_TIMEZONE, "yyyy-MM-dd");
}

export function formatTimeFromUtc(date: Date) {
  return formatInTimeZone(date, SHOP_TIMEZONE, "h:mm a");
}

export function utcToZoned(date: Date) {
  return toZonedTime(date, SHOP_TIMEZONE);
}

