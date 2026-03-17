"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

import { Button, Card } from "@/components/ui";

type Barber = { id: string; name: string };

export function AddBarberForm({ barbers }: { barbers: Barber[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/barbers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Failed to add barber");
      setName("");
      setEmail("");
      setPassword("");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add barber");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="!border-white/10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-semibold">Manage barbers</div>
          <div className="text-sm text-white/70">
            Add barber accounts so they can log in and manage their own calendars.
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Add barber
        </Button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-white/10 pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs text-white/60">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Barber name"
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Email (for login)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="barber@example.com"
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/60">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                className="h-10 w-full rounded-xl border border-white/10 bg-black/30 px-3 text-sm text-white outline-none focus:border-white/25"
                required
                minLength={6}
              />
            </div>
          </div>
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add barber"}
            </Button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sm text-white/60 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {barbers.length > 0 && (
        <div className="mt-4 text-sm text-white/70">
          Current barbers: {barbers.map((b) => b.name).join(", ")}
        </div>
      )}
    </Card>
  );
}
