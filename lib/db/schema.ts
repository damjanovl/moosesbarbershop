import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";

export const bookings = pgTable("bookings", {
  id: text("id").primaryKey(),

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

