import "server-only";

import { getSql } from "@/lib/db";

let ensured = false;

export async function ensureDbSchema() {
  if (ensured) return;
  ensured = true;

  const sql = getSql();

  await sql/* sql */ `
    create table if not exists bookings (
      id text primary key,
      status text not null,

      service_key text not null,
      service_name text not null,
      price_cad integer not null,
      duration_minutes integer not null,

      start_at timestamptz not null,
      end_at timestamptz not null,

      customer_name text not null,
      customer_email text not null,
      customer_phone text not null,
      notes text,

      square_payment_link_id text,
      square_order_id text,
      square_payment_id text,

      expires_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `;

  await sql/* sql */ `
    create index if not exists bookings_start_at_idx on bookings (start_at);
  `;

  await sql/* sql */ `
    create index if not exists bookings_status_idx on bookings (status);
  `;
}

