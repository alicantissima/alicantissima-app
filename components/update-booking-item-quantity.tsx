


"use client";

import { useTransition } from "react";
import { updateBookingItemQuantity } from "@/app/desk/booking/[id]/actions";

type Props = {
  bookingId: string;
  itemId: string;
  quantity: number;
};

export default function UpdateBookingItemQuantity({
  bookingId,
  itemId,
  quantity,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: number) {
    if (value < 1) return;

    startTransition(async () => {
      await updateBookingItemQuantity({
        bookingId,
        itemId,
        quantity: value,
      });
    });
  }

  return (
    <div className="mt-2 flex items-center gap-2">
      <button
        disabled={isPending}
        onClick={() => handleChange(quantity - 1)}
        className="h-8 w-8 rounded-lg border"
      >
        -
      </button>

      <div className="min-w-[24px] text-center font-semibold">
        {quantity}
      </div>

      <button
        disabled={isPending}
        onClick={() => handleChange(quantity + 1)}
        className="h-8 w-8 rounded-lg border"
      >
        +
      </button>
    </div>
  );
}