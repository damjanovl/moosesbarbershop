import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const adminUsers = pgTable("admin_users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  isMainAdmin: boolean("is_main_admin").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AdminUserRow = typeof adminUsers.$inferSelect;

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),

  barberId: text("barber_id").notNull(), // FK to admin_users

  status: text("status").notNull(), // PENDING_PAYMENT | CONFIRMED | CANCELLED | EXPIRED

  serviceKey: text("service_key").notNull(),
  serviceName: text("service_name").notNull(),
  priceCad: integer("price_cad").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),

  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),

  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  notes: text("notes"),

  squarePaymentLinkId: text("square_payment_link_id"),
  squareOrderId: text("square_order_id"),
  squarePaymentId: text("square_payment_id"),

  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type BookingRow = typeof bookings.$inferSelect;

export const calendarBlocks = pgTable("calendar_blocks", {
  id: text("id").primaryKey(),
  barberId: text("barber_id").notNull(),
  title: text("title").notNull(),
  startAt: timestamp("start_at", { withTimezone: true }).notNull(),
  endAt: timestamp("end_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type CalendarBlockRow = typeof calendarBlocks.$inferSelect;

