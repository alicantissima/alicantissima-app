


"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateBookingPaymentMethod } from "@/app/admin/payment-actions";

type PaymentMethod =
  | "unpaid"
  | "viator"
  | "card"
  | "cash"
  | "revolut"
  | "refunded"
  | "cancelled"
  | "missed_payment";

const OPTIONS: Array<{
  value: PaymentMethod;
  label: string;
}> = [
  { value: "unpaid", label: "Unpaid" },
  { value: "viator", label: "Viator" },
  { value: "card", label: "Card" },
  { value: "cash", label: "Cash" },
  { value: "revolut", label: "Revolut" },
  { value: "refunded", label: "Refunded" },
  { value: "cancelled", label: "Cancelled" },
  {
    value: "missed_payment",
    label: "Missed payment",
  },
];

export default function AdminPaymentMethodSelect({
  bookingId,
  value,
}: {
  bookingId: string;
  value: string;
}) {
  const router = useRouter();

  const [currentValue, setCurrentValue] =
    useState(value);

  const [isPending, startTransition] =
    useTransition();

  async function handleChange(
    nextValue: PaymentMethod
  ) {
    const previousValue = currentValue;

    setCurrentValue(nextValue);

    const result =
      await updateBookingPaymentMethod({
        bookingId,
        paymentMethod: nextValue,
      });

    if (!result.ok) {
      setCurrentValue(previousValue);

      alert(
        result.error ||
          "Não foi possível atualizar o payment method."
      );

      return;
    }

    if (
      result.invoiceError
    ) {
      console.error(
        "Walk-in paid but invoice failed:",
        result.invoiceError
      );
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <select
        value={currentValue}
        onChange={(e) =>
          handleChange(
            e.target.value as PaymentMethod
          )
        }
        disabled={isPending}
        className="h-8 w-full appearance-none truncate rounded-xl border border-gray-300 bg-white px-3 pr-8 text-[12px] font-medium leading-none outline-none transition focus:border-gray-400"
      >
        {OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
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