import "server-only";

import nodemailer from "nodemailer";
import { formatInTimeZone } from "date-fns-tz";

import { SHOP_TIMEZONE } from "@/lib/business";
import type { BookingRow } from "@/lib/db/schema";
import { sendBookingConfirmedSms } from "@/lib/sms";

// Owner always receives appointment notifications at this address.
// Override by setting ADMIN_EMAIL in your environment.
const NOTIFICATION_EMAIL = process.env.ADMIN_EMAIL ?? "23luka23@gmail.com";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("Missing SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS");
  }

  const secure = process.env.SMTP_SECURE === "true";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function bookingWhenText(b: BookingRow) {
  return formatInTimeZone(b.startAt, SHOP_TIMEZONE, "EEE, MMM d 'at' h:mm a");
}

function bookingAdminText(label: string, b: BookingRow, when: string) {
  return (
    `${label}\n\n` +
    `Service: ${b.serviceName}\n` +
    `When: ${when}\n` +
    `Name: ${b.customerName}\n` +
    `Email: ${b.customerEmail || "not provided"}\n` +
    `Phone: ${b.customerPhone || "not provided"}\n` +
    `Booking ID: ${b.id}\n`
  );
}

/** Sends a confirmation email to the customer (if they have an email) and always
 *  notifies the owner. Called when a booking is confirmed after payment. */
export async function sendBookingConfirmedEmails(opts: { booking: BookingRow }) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Missing EMAIL_FROM");

  const transporter = getTransport();
  const b = opts.booking;
  const when = bookingWhenText(b);

  const subject = `Booking Confirmed — ${b.serviceName} (${when})`;

  const text = `Your appointment is confirmed.\n\nService: ${b.serviceName}\nWhen: ${when}\n\nIf you need to change or cancel, reply to this email or call the shop.\n`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5">
      <h2 style="margin:0 0 8px">Your appointment is confirmed</h2>
      <p style="margin:0 0 16px">Thanks for booking with Moose Barbershop.</p>
      <div style="padding:12px 14px; border:1px solid #e5e7eb; border-radius:12px">
        <div><strong>Service:</strong> ${b.serviceName}</div>
        <div><strong>When:</strong> ${when}</div>
        <div><strong>Name:</strong> ${b.customerName}</div>
        <div><strong>Phone:</strong> ${b.customerPhone}</div>
      </div>
      <p style="margin:16px 0 0; color:#6b7280; font-size:13px">
        If you need to change or cancel, reply to this email or call the shop.
      </p>
    </div>
  `;

  if (b.customerEmail) {
    await transporter.sendMail({ from, to: b.customerEmail, subject, text, html });
  }

  await transporter.sendMail({
    from,
    to: NOTIFICATION_EMAIL,
    subject: `[New Booking] ${subject}`,
    text: bookingAdminText("New confirmed booking.", b, when),
  });

  if (b.customerPhone) {
    try {
      await sendBookingConfirmedSms(b);
    } catch (err) {
      console.error("Failed to send booking confirmation SMS", err);
    }
  }
}

/** Notifies the owner when an existing booking is edited in the admin panel. */
export async function sendBookingUpdatedAdminEmail(opts: { booking: BookingRow }) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Missing EMAIL_FROM");

  const b = opts.booking;
  const when = bookingWhenText(b);

  const transporter = getTransport();
  await transporter.sendMail({
    from,
    to: NOTIFICATION_EMAIL,
    subject: `[Updated Booking] ${b.customerName} — ${b.serviceName} (${when})`,
    text: bookingAdminText("A booking was updated.", b, when),
  });
}

/** Notifies the owner when a booking is deleted in the admin panel. */
export async function sendBookingDeletedAdminEmail(opts: { booking: BookingRow }) {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Missing EMAIL_FROM");

  const b = opts.booking;
  const when = bookingWhenText(b);

  const transporter = getTransport();
  await transporter.sendMail({
    from,
    to: NOTIFICATION_EMAIL,
    subject: `[Deleted Booking] ${b.customerName} — ${b.serviceName} (${when})`,
    text: bookingAdminText("A booking was deleted.", b, when),
  });
}
