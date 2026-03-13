import "server-only";

import nodemailer from "nodemailer";
import { formatInTimeZone } from "date-fns-tz";

import { SHOP_TIMEZONE } from "@/lib/business";
import type { BookingRow } from "@/lib/db/schema";

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

export async function sendBookingConfirmedEmails(opts: { booking: BookingRow }) {
  const from = process.env.EMAIL_FROM;
  const admin = process.env.ADMIN_EMAIL;
  if (!from) throw new Error("Missing EMAIL_FROM");
  if (!admin) throw new Error("Missing ADMIN_EMAIL");

  const transporter = getTransport();
  const when = bookingWhenText(opts.booking);

  const subject = `Booking Confirmed — ${opts.booking.serviceName} (${when})`;

  const text = `Your appointment is confirmed.\n\nService: ${opts.booking.serviceName}\nWhen: ${when}\n\nIf you need to change or cancel, reply to this email or call the shop.\n`;

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height:1.5">
      <h2 style="margin:0 0 8px">Your appointment is confirmed</h2>
      <p style="margin:0 0 16px">Thanks for booking with Moose Barbershop.</p>
      <div style="padding:12px 14px; border:1px solid #e5e7eb; border-radius:12px">
        <div><strong>Service:</strong> ${opts.booking.serviceName}</div>
        <div><strong>When:</strong> ${when}</div>
        <div><strong>Name:</strong> ${opts.booking.customerName}</div>
        <div><strong>Phone:</strong> ${opts.booking.customerPhone}</div>
      </div>
      <p style="margin:16px 0 0; color:#6b7280; font-size:13px">
        If you need to change or cancel, reply to this email or call the shop.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to: opts.booking.customerEmail,
    subject,
    text,
    html,
  });

  await transporter.sendMail({
    from,
    to: admin,
    subject: `[Admin] ${subject}`,
    text:
      `New confirmed booking.\n\n` +
      `Service: ${opts.booking.serviceName}\n` +
      `When: ${when}\n` +
      `Name: ${opts.booking.customerName}\n` +
      `Email: ${opts.booking.customerEmail}\n` +
      `Phone: ${opts.booking.customerPhone}\n` +
      `Booking ID: ${opts.booking.id}\n`,
  });
}

