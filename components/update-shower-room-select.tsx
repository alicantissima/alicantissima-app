


"use client";

import { useState, useTransition } from "react";
import { updateBookingItemShowerRoom } from "@/app/desk/booking/[id]/actions";

type Props = {
  bookingId: string;
  itemId: string;
  value?: string | number | null;
};

function normalizeRoom(value?: string | number | null): "s1" | "s2" {
  const clean = String(value || "s1").toLowerCase().trim();

  if (clean === "2" || clean === "s2") return "s2";

  return "s1";
}

export default function UpdateShowerRoomSelect({
  bookingId,
  itemId,
  value,
}: Props) {
  const [room, setRoom] = useState<"s1" | "s2">(normalizeRoom(value));
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleChange(nextRoom: "s1" | "s2") {
    setRoom(nextRoom);
    setMessage("");

    startTransition(async () => {
      try {
        await updateBookingItemShowerRoom({
          bookingId,
          itemId,
          showerRoom: nextRoom,
        });

        setMessage("Saved");
      } catch (err) {
        setRoom(room);
        setMessage(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <div className="rounded-xl bg-gray-50 p-3 text-sm">
      <div className="text-xs text-gray-500">Room</div>

      <select
        value={room}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as "s1" | "s2")}
        className="mt-1 w-full rounded-lg border bg-white px-2 py-2 text-sm font-medium disabled:opacity-60"
      >
        <option value="s1">S1</option>
        <option value="s2">S2</option>
      </select>

      <div className="mt-1 text-xs text-gray-500">
        {isPending ? "Saving..." : message}
      </div>
    </div>
  );
}