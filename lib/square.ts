import "server-only";

import crypto from "node:crypto";
import { SquareClient, SquareEnvironment } from "square";

import { DEPOSIT_CAD } from "@/lib/business";

export function getSquareClient() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Missing SQUARE_ACCESS_TOKEN");

  const env = process.env.SQUARE_ENVIRONMENT ?? "sandbox";
  const environment =
    env === "production"
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox;

  return new SquareClient({ token: accessToken, environment });
}

export async function createDepositPaymentLink(opts: {
  bookingId: string;
  buyerEmail: string;
  locationId: string;
  redirectUrl: string;
}) {
  const client = getSquareClient();

  const resp = await client.checkout.paymentLinks.create({
    idempotencyKey: crypto.randomUUID(),
    description: `Booking deposit for ${opts.bookingId}`,
    quickPay: {
      name: "Moose Barbershop — Booking Deposit",
      locationId: opts.locationId,
      priceMoney: { amount: BigInt(DEPOSIT_CAD * 100), currency: "CAD" },
    },
    checkoutOptions: {
      redirectUrl: opts.redirectUrl,
      allowTipping: false,
    },
    prePopulatedData: {
      buyerEmail: opts.buyerEmail,
    },
    paymentNote: `bookingId=${opts.bookingId}`,
  });

  const link = resp.paymentLink;
  if (!link?.id || !(link.longUrl || link.url)) {
    const msg = resp.errors?.[0]?.detail ?? "Square did not return a payment link URL";
    throw new Error(msg);
  }

  return {
    paymentLinkId: link.id,
    orderId: link.orderId ?? null,
    url: link.longUrl ?? link.url!,
  };
}

export function verifySquareWebhookSignature(opts: {
  signatureHeader: string | null;
  notificationUrl: string;
  bodyText: string;
}) {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key) throw new Error("Missing SQUARE_WEBHOOK_SIGNATURE_KEY");
  if (!opts.signatureHeader) return false;

  const payload = opts.notificationUrl + opts.bodyText;
  const digest = crypto
    .createHmac("sha256", key)
    .update(payload, "utf8")
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(opts.signatureHeader),
    );
  } catch {
    return false;
  }
}

