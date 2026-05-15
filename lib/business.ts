export const SHOP_TIMEZONE = "America/Toronto";

export type WeeklyHours = Record<
  number,
  { open: string; close: string } | { closed: true }
>;

// 0=Sunday ... 6=Saturday (JS Date convention)
export const WEEKLY_HOURS: WeeklyHours = {
  0: { open: "11:00", close: "17:00" }, // Sunday
  1: { open: "11:00", close: "17:00" }, // Monday
  2: { open: "11:00", close: "19:00" }, // Tuesday
  3: { open: "11:00", close: "19:00" }, // Wednesday
  4: { open: "10:00", close: "20:00" }, // Thursday
  5: { open: "10:00", close: "20:00" }, // Friday
  6: { open: "09:00", close: "17:00" }, // Saturday
};

export const SLOT_INTERVAL_MINUTES = 15;
export const HOLD_MINUTES = 15;

export function getDepositCad(priceCad: number): number {
  return Math.round(priceCad * 0.5);
}

