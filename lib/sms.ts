import "server-only";

import twilio from "twilio";
import type { BookingRow } from "@/lib/db/schema";
import { formatInTimeZone } from "date-fns-tz";
import { SHOP_TIMEZONE } from "@/lib/business";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;
  return twilio(accountSid, authToken);
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export async function sendBookingConfirmedSms(booking: BookingRow): Promise<void> {
  const client = getTwilioClient();
  const from = process.env.TWILIO_FROM_NUMBER;

  if (!client || !from) return;

  const when = formatInTimeZone(
    booking.startAt,
    SHOP_TIMEZONE,
    "EEE, MMM d 'at' h:mm a",
  );

  const sends: Promise<unknown>[] = [];

  if (booking.customerPhone) {
    const customerBody =
      `Hi ${booking.customerName}! Your appointment at Moose Barbershop is confirmed.\n\n` +
      `Service: ${booking.serviceName}\n` +
      `When: ${when}\n\n` +
      `See you then! To reschedule or cancel, call the shop.`;

    sends.push(
      client.messages.create({
        body: customerBody,
        from,
        to: normalizePhone(booking.customerPhone),
      }),
    );
  }

  const adminPhone = process.env.ADMIN_PHONE;
  if (adminPhone) {
    const adminBody =
      `[New Booking] ${booking.customerName} — ${booking.serviceName}\n` +
      `When: ${when}\n` +
      `Phone: ${booking.customerPhone || "not provided"}\n` +
      `Email: ${booking.customerEmail || "not provided"}`;

    sends.push(
      client.messages.create({
        body: adminBody,
        from,
        to: normalizePhone(adminPhone),
      }),
    );
  }

  await Promise.all(sends);
}
