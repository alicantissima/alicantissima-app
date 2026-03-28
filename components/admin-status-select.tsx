


"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type BookingStatus =
  | "booked"
  | "inside"
  | "completed"
  | "cancelled"
  | "no_show";

const OPTIONS: Array<{ value: BookingStatus; label: string }> = [
  { value: "booked", label: "Booked" },
  { value: "inside", label: "Inside" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

export default function AdminStatusSelect({
  bookingId,
  value,
}: {
  bookingId: string;
  value: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [currentValue, setCurrentValue] = useState(value);
  const [isPending, startTransition] = useTransition();

  async function handleChange(nextValue: string) {
    setCurrentValue(nextValue);

    const { error } = await supabase
      .from("bookings")
      .update({ status: nextValue })
      .eq("id", bookingId);

    if (error) {
      setCurrentValue(value);
      alert("Não foi possível atualizar o status.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <select
      value={currentValue}
      onChange={(e) => handleChange(e.target.value)}
      disabled={isPending}
      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-[12px] outline-none focus:border-gray-400"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}