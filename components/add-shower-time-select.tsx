





"use client";

import { useEffect, useState, useTransition } from "react";
import { updateBookingItemShowerTime } from "@/app/desk/booking/[id]/actions";

type AvailabilitySlot = {
  value: string;
  label: string;
  available: boolean;
};

type Props = {
  bookingId: string;
  itemId: string;
  serviceDate: string | null;
  quantity: number;
};

export default function AddShowerTimeSelect({
  bookingId,
  itemId,
  serviceDate,
  quantity,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showerTime, setShowerTime] = useState("");
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function loadAvailability() {
      if (!isEditing || !serviceDate) return;

      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        params.set("date", serviceDate);
        params.set("quantity", String(quantity || 1));

        const response = await fetch(
          `/api/showers/availability?${params.toString()}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Could not load availability.");
        }

        setSlots(data.slots || []);
      } catch (err) {
        setSlots([]);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load shower availability."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, [isEditing, serviceDate, quantity]);

  function handleSave() {
    if (!showerTime) return;

    startTransition(async () => {
      await updateBookingItemShowerTime({
        bookingId,
        itemId,
        showerTime,
      });

      setIsEditing(false);
    });
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="mt-3 text-xs font-medium text-blue-600 hover:underline"
      >
        Add shower time
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <select
        value={showerTime}
        onChange={(e) => setShowerTime(e.target.value)}
        disabled={loading || slots.length === 0}
        className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
      >
        <option value="">
          {loading ? "Loading shower times..." : "Choose shower time"}
        </option>

        {slots.map((slot) => (
          <option key={slot.value} value={slot.value} disabled={!slot.available}>
            {slot.label}
          </option>
        ))}
      </select>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      {!loading && !error && slots.length === 0 ? (
        <p className="text-xs text-red-600">
          No shower times available for this date.
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || loading || !showerTime}
          className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={() => {
            setIsEditing(false);
            setShowerTime("");
            setError("");
          }}
          disabled={isPending}
          className="rounded-xl border px-3 py-2 text-xs font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}