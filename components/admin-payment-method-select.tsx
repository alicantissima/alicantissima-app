


"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type PaymentMethod =
  | "unpaid"
  | "viator"
  | "card"
  | "cash"
  | "online"
  | "refunded"
  | "cancelled"
  | "missed_payment";

const OPTIONS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "unpaid", label: "Unpaid" },
  { value: "viator", label: "Viator" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "online", label: "Online" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
  { value: "missed_payment", label: "Missed payment" },
];

export default function AdminPaymentMethodSelect({
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
      .update({ payment_method: nextValue })
      .eq("id", bookingId);

    if (error) {
      setCurrentValue(value);
      alert("Não foi possível atualizar o payment method.");
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