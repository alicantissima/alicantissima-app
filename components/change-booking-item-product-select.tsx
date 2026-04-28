


"use client";

import { useState, useTransition } from "react";
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
  const [isEditing, setIsEditing] = useState(false);
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

    {!isEditing ? (
      <div className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium">
        <span>
          {value === "combo"
            ? "Luggage + Shower"
            : value.charAt(0).toUpperCase() + value.slice(1)}
        </span>

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-blue-600 text-xs hover:underline"
        >
          Edit
        </button>
      </div>
    ) : (
      <select
        value={value}
        disabled={isPending}
        onChange={(event) => {
          handleChange(event.target.value as ProductType);
          setIsEditing(false);
        }}
        className="w-full rounded-xl border bg-white px-3 py-2 text-sm font-medium disabled:opacity-60"
      >
        <option value="luggage">Luggage</option>
        <option value="shower">Shower</option>
        <option value="combo">Luggage + Shower</option>
      </select>
    )}
  </div>
);
}