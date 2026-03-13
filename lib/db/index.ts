import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __moose_sql: ReturnType<typeof postgres> | undefined;
  // eslint-disable-next-line no-var
  var __moose_db:
    | ReturnType<typeof drizzle<typeof schema>>
    | undefined;
}

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing DATABASE_URL");
  }

  if (process.env.NODE_ENV === "production") {
    return postgres(url, { max: 1 });
  }

  if (!globalThis.__moose_sql) {
    globalThis.__moose_sql = postgres(url, { max: 1 });
  }
  return globalThis.__moose_sql;
}

export function getDb() {
  if (process.env.NODE_ENV === "production") {
    return drizzle(getSql(), { schema });
  }
  if (!globalThis.__moose_db) {
    globalThis.__moose_db = drizzle(getSql(), { schema });
  }
  return globalThis.__moose_db;
}

