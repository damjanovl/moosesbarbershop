"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button, Card, Container, cn } from "@/components/ui";
import { getDepositCad } from "@/lib/business";
import { SERVICES, type ServiceKey, getService } from "@/lib/services";

type Barber = { id: string; name: string };

function formatTimeToronto(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    hour: "numeric",
    minute: "2-digit",
  }).format(d);
}

function isSlotInPast(iso: string) {
  return new Date(iso) <= new Date();
}

function todayTorontoISO() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => {
      if (p.type !== "literal") acc[p.type] = p.value;
      return acc;
    }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export default function BookClient() {
  const search = useSearchParams();
  const preselect = (search.get("service") ?? "") as ServiceKey;

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [serviceKey, setServiceKey] = useState<ServiceKey | null>(
    SERVICES.some((s) => s.key === preselect) ? preselect : null,
  );
  const [dateISO, setDateISO] = useState(() => todayTorontoISO());
  const [slots, setSlots] = useState<string[]>([]);
  const [slotIso, setSlotIso] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const service = useMemo(
    () => (serviceKey ? getService(serviceKey) : null),
    [serviceKey],
  );

  useEffect(() => {
    let cancelled = false;
    fetch("/api/barbers")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setBarbers(Array.isArray(data.barbers) ? data.barbers : []);
        if (data.barbers?.length === 1) setBarberId(data.barbers[0].id);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setSlotIso(null);
    setError(null);
    if (!serviceKey || !barberId) return;

    let cancelled = false;
    setLoadingSlots(true);
    fetch(
      `/api/availability?date=${encodeURIComponent(
        dateISO,
      )}&service=${encodeURIComponent(serviceKey)}&barberId=${encodeURIComponent(barberId)}`,
    )
      .then(async (r) => {
        if (!r.ok)
          throw new Error(
            (await r.json().catch(() => null))?.error ?? "Failed to load slots",
          );
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setSlots(Array.isArray(data.slots) ? data.slots : []);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setSlots([]);
        setError(e instanceof Error ? e.message : "Failed to load slots");
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [dateISO, serviceKey, barberId]);

  async function onCheckout() {
    if (!barberId || !serviceKey || !slotIso) return;
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          barberId,
          serviceKey,
          startAtIso: slotIso,
          customerName: name,
          customerEmail: email,
          customerPhone: phone,
          notes: notes.trim() ? notes.trim() : undefined,
        }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(data?.error ?? "Unable to start checkout");
      if (!data?.checkoutUrl) throw new Error("Missing checkout URL");
      window.location.href = data.checkoutUrl as string;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const step =
    !barberId ? 0 : !serviceKey ? 1 : !slotIso ? 2 : !name || !email || !phone ? 3 : 4;

  return (
    <div className="min-h-screen">
      <Container className="py-10">
        <div className="space-y-2">
          <div className="text-xs font-semibold tracking-widest text-white/60">
            BOOK APPOINTMENT
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Book your appointment
          </h1>
          <p className="text-sm text-white/70">
            Choose a service, pick a time, then secure your slot with a{" "}
            <span className="font-semibold text-white">50% deposit</span>{" "}
            via Square.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Card className="md:col-span-3">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/60">
              <span
                className={cn(
                  "rounded-full px-3 py-1 border border-white/10",
                  step === 0 && "text-white border-white/25",
                )}
              >
                1 Barber
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 border border-white/10",
                  step === 1 && "text-white border-white/25",
                )}
              >
                2 Service
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 border border-white/10",
                  step === 2 && "text-white border-white/25",
                )}
              >
                3 Date & Time
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 border border-white/10",
                  step === 3 && "text-white border-white/25",
                )}
              >
                4 Details
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 border border-white/10",
                  step === 4 && "text-white border-white/25",
                )}
              >
                5 Payment
              </span>
            </div>

            <div className="mt-6 space-y-8">
              <div className="space-y-3">
                <div className="text-sm font-semibold">Choose your barber</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {barbers.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setBarberId(b.id)}
                      className={cn(
                        "text-left rounded-2xl border p-4 transition",
                        barberId === b.id
                          ? "border-[color:var(--color-accent)]/50 bg-white/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10",
                      )}
                    >
                      <div className="font-semibold">{b.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={cn(
                  "space-y-3",
                  !barberId && "opacity-50 pointer-events-none",
                )}
              >
              <div className="text-sm font-semibold">Choose your service</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SERVICES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setServiceKey(s.key)}
                      className={cn(
                        "text-left rounded-2xl border p-4 transition",
                        serviceKey === s.key
                          ? "border-[color:var(--color-accent)]/50 bg-white/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10",
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-semibold">{s.name}</div>
                          <div className="text-xs text-white/70">
                            {s.durationMinutes} min
                          </div>
                        </div>
                        <div className="font-semibold">${s.priceCAD}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div
                className={cn(
                  "space-y-3",
                  !serviceKey && "opacity-50 pointer-events-none",
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold">
                      Select date & time
                    </div>
                    <div className="text-xs text-white/60">
                      Times shown in Hamilton (America/Toronto).
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-white/60" htmlFor="date">
                      Date
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={dateISO}
                      onChange={(e) => setDateISO(e.target.value)}
                      className="h-10 rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {loadingSlots ? (
                    <div className="text-sm text-white/70">Loading slots…</div>
                  ) : slots.length === 0 ? (
                    <div className="text-sm text-white/70">
                      No available times on this date.
                    </div>
                  ) : (
                    slots.map((iso) => {
                      const past = isSlotInPast(iso);
                      return (
                        <button
                          key={iso}
                          type="button"
                          disabled={past}
                          onClick={() => !past && setSlotIso(iso)}
                          className={cn(
                            "h-11 rounded-xl border text-sm font-semibold transition",
                            past && "cursor-not-allowed opacity-50",
                            slotIso === iso
                              ? "border-[color:var(--color-accent)]/60 bg-white/10"
                              : "border-white/10 bg-white/5 hover:bg-white/10",
                          )}
                        >
                          {formatTimeToronto(iso)}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "space-y-3",
                  !slotIso && "opacity-50 pointer-events-none",
                )}
              >
                <div className="text-sm font-semibold">Your information</div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1">
                    <div className="text-xs text-white/60">Full name</div>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-white/60">Email</div>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
                      placeholder="you@email.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-white/60">Phone</div>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
                      placeholder="(289) 244-4562"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <div className="text-xs text-white/60">
                      Special requests (optional)
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="min-h-24 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/25"
                      placeholder="Any notes for your barber…"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="h-fit">
            <div className="space-y-4">
              <div className="text-sm font-semibold">Booking summary</div>
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex justify-between gap-4">
                  <span>Barber</span>
                  <span className="text-white">{barbers.find((b) => b.id === barberId)?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Service</span>
                  <span className="text-white">{service?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Date</span>
                  <span className="text-white">
                    {serviceKey ? dateISO : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Time</span>
                  <span className="text-white">
                    {slotIso ? formatTimeToronto(slotIso) : "—"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Deposit (50%)</span>
                  <span className="text-white">
                    ${service ? getDepositCad(service.priceCAD) : "—"}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/70">
                Your booking is only confirmed once Square payment is completed.
              </div>

              {error ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
                  {error}
                </div>
              ) : null}

              <Button
                className="w-full"
                disabled={
                  submitting ||
                  !barberId ||
                  !serviceKey ||
                  !slotIso ||
                  !name ||
                  !email ||
                  !phone
                }
                onClick={onCheckout}
              >
                {submitting ? "Redirecting to Square…" : "Pay deposit & confirm"}
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    </div>
  );
}

