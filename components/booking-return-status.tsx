"use client";

import { useEffect, useState } from "react";

type Props = {
  bookingId: string | null;
  initialStatus: string | null;
};

export function BookingReturnStatus({ bookingId, initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [checking, setChecking] = useState(initialStatus === "PENDING_PAYMENT");

  useEffect(() => {
    if (!bookingId || initialStatus !== "PENDING_PAYMENT") return;

    let cancelled = false;
    let attempts = 0;

    async function checkStatus() {
      attempts += 1;
      try {
        const res = await fetch(`/api/booking/${bookingId}/status`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data = (await res.json()) as {
          status?: string;
          confirmed?: boolean;
        };

        if (cancelled) return;
        if (data.status) setStatus(data.status);
        if (data.confirmed) {
          setChecking(false);
          return;
        }
      } catch {
        /* ignore transient polling failures */
      }

      if (cancelled) return;
      if (attempts >= 20) {
        setChecking(false);
        return;
      }

      window.setTimeout(checkStatus, 3000);
    }

    window.setTimeout(checkStatus, 1500);

    return () => {
      cancelled = true;
    };
  }, [bookingId, initialStatus]);

  if (status === "CONFIRMED") {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
        Payment confirmed. Your booking is locked in and a confirmation email is on the way.
      </div>
    );
  }

  if (status === "PENDING_PAYMENT") {
    return (
      <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
        {checking
          ? "We’re checking Square for your completed payment now. This can take a few seconds."
          : "Your booking is still marked as awaiting payment. If you completed checkout, refresh this page in a moment."}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/80">
      Payment status: <span className="text-white">{status ?? "Unknown"}</span>
    </div>
  );
}
