


"use client";

import { useTransition } from "react";
import { changeBookingItemProduct } from "@/app/desk/booking/[id]/actions";

type ProductType = "luggage" | "shower" | "combo";

type Props = {
  bookingId: string;
  itemId: string;
  currentType?: string | null;
};

export default function ChangeBookingItemProductSelect({
  bookingId,
  itemId,
  currentType,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const value =
    currentType === "shower" || currentType === "combo" || currentType === "luggage"
      ? currentType
      : "luggage";

  function handleChange(newType: ProductType) {
    startTransition(async () => {
      await changeBookingItemProduct({
        bookingId,
        itemId,
        newType,
      });
    });
  }

  return (
    <div className="mt-3">
      <label className="mb-1 block text-xs font-medium text-gray-500">
        Change product
      </label>

      <select
        value={value}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value as ProductType)}
        className="w-full rounded-xl border bg-white px-3 py-2 text-sm font-medium disabled:opacity-60"
      >
        <option value="luggage">Luggage</option>
        <option value="shower">Shower</option>
        <option value="combo">Luggage + Shower</option>
      </select>
    </div>
  );
}