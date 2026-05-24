


"use client";

import { useState, useTransition } from "react";
import { updateBookingItemShowerTime } from "@/app/desk/booking/[id]/actions";

type Props = {
  bookingId: string;
  itemId: string;
};

const SHOWER_SLOTS = [
  "10h00-10h30",
  "10h30-11h00",
  "11h00-11h30",
  "11h30-12h00",
  "12h00-12h30",
  "12h30-13h00",
  "13h00-13h30",
  "13h30-14h00",
  "14h00-14h30",
  "14h30-15h00",
  "15h00-15h30",
  "15h30-16h00",
  "16h00-16h30",
  "16h30-17h00",
  "17h00-17h30",
  "17h30-18h00",
  "18h00-18h30",
  "18h30-19h00",
];

export default function AddShowerTimeSelect({ bookingId, itemId }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [showerTime, setShowerTime] = useState("");
  const [isPending, startTransition] = useTransition();

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
        className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
      >
        <option value="">Choose shower time</option>
        {SHOWER_SLOTS.map((slot) => (
          <option key={slot} value={slot}>
            {slot}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !showerTime}
          className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={() => setIsEditing(false)}
          disabled={isPending}
          className="rounded-xl border px-3 py-2 text-xs font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}