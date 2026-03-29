


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

function getStatusSelectClass(value: string) {
  if (value === "booked") {
    return "border-yellow-200 bg-yellow-100 text-yellow-800";
  }

  if (value === "inside") {
    return "border-green-200 bg-green-100 text-green-800";
  }

  if (value === "completed") {
    return "border-gray-300 bg-gray-200 text-gray-800";
  }

  if (value === "no_show") {
    return "border-orange-200 bg-orange-100 text-orange-800";
  }

  if (value === "cancelled") {
    return "border-red-200 bg-red-100 text-red-700";
  }

  return "border-gray-300 bg-white text-gray-700";
}

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
    <div className="relative inline-block w-[118px] min-w-[118px] shrink-0">
      <select
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className={`h-8 w-full appearance-none truncate rounded-xl border px-3 pr-8 text-[12px] font-medium leading-none outline-none transition focus:border-gray-400 ${getStatusSelectClass(
          currentValue
        )}`}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] opacity-60">
        ▾
      </div>
    </div>
  );
}