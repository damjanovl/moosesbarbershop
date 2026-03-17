import "server-only";

import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "moose_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("Missing ADMIN_SESSION_SECRET");
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export async function setAdminSession(userId: string) {
  const payload = `${userId}.${Date.now()}`;
  const token = `${payload}.${sign(payload)}`;
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
}

export async function getAdminUserIdFromCookies(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 3) return null;
  const sig = parts.pop();
  const payload = parts.join(".");
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  const [userId, ts] = payload.split(".");
  if (!userId || !ts) return null;
  const ageSeconds = (Date.now() - Number(ts)) / 1000;
  if (!Number.isFinite(ageSeconds) || ageSeconds < 0) return null;
  if (ageSeconds > MAX_AGE_SECONDS) return null;
  return userId;
}

export async function isAdminAuthedFromCookies() {
  return (await getAdminUserIdFromCookies()) !== null;
}

