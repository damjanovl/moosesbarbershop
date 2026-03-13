export const SHOP_TIMEZONE = "America/Toronto";

export type WeeklyHours = Record<
  number,
  { open: string; close: string } | { closed: true }
>;

// 0=Sunday ... 6=Saturday (JS Date convention)
export const WEEKLY_HOURS: WeeklyHours = {
  0: { closed: true },
  1: { open: "12:00", close: "18:00" },
  2: { open: "12:00", close: "19:00" },
  3: { open: "12:00", close: "19:00" },
  4: { open: "11:00", close: "20:00" },
  5: { open: "11:00", close: "20:00" },
  6: { open: "10:00", close: "17:00" },
};

export const SLOT_INTERVAL_MINUTES = 15;
export const HOLD_MINUTES = 15;
export const DEPOSIT_CAD = 10;

