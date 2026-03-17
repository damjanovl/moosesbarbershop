import "server-only";

import { getSql } from "@/lib/db";
import { hashPassword } from "@/lib/password";

let ensured = false;

const MOOSE_ID = "moose-main";

export async function ensureDbSchema() {
  if (ensured) return;
  ensured = true;

  const sql = getSql();

  await sql/* sql */ `
    create table if not exists admin_users (
      id text primary key,
      name text not null,
      email text not null unique,
      password_hash text not null,
      is_main_admin boolean not null default false,
      created_at timestamptz not null default now()
    );
  `;

  await sql/* sql */ `
    create table if not exists calendar_blocks (
      id text primary key,
      barber_id text not null,
      title text not null,
      start_at timestamptz not null,
      end_at timestamptz not null,
      created_at timestamptz not null default now()
    );
  `;

  await sql/* sql */ `
    create index if not exists calendar_blocks_barber_id_idx on calendar_blocks (barber_id);
  `;

  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin";
  const mooseHash = hashPassword(adminPassword);
  await sql/* sql */ `
    insert into admin_users (id, name, email, password_hash, is_main_admin)
    values (${MOOSE_ID}, 'Moose', 'moose@moosebarbershop.com', ${mooseHash}, true)
    on conflict (id) do nothing
  `;

  await sql/* sql */ `
    create table if not exists bookings (
      id text primary key,
      barber_id text not null,

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

  const hasBarberId = await sql/* sql */ `
    select column_name from information_schema.columns
    where table_name = 'bookings' and column_name = 'barber_id'
  `;
  if (hasBarberId.length === 0) {
    await sql/* sql */ `alter table bookings add column barber_id text`;
    await sql/* sql */ `update bookings set barber_id = ${MOOSE_ID} where barber_id is null`;
    await sql/* sql */ `alter table bookings alter column barber_id set not null`;
  }

  await sql/* sql */ `
    create index if not exists bookings_start_at_idx on bookings (start_at);
  `;

  await sql/* sql */ `
    create index if not exists bookings_status_idx on bookings (status);
  `;

  await sql/* sql */ `
    create index if not exists bookings_barber_id_idx on bookings (barber_id);
  `;
}

