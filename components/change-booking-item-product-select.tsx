


"use client";

import { useState, useTransition } from "react";
import { changeBookingItemProduct } from "@/app/desk/booking/[id]/actions";

type ProductType = "luggage" | "shower" | "combo";

type Props = {
  bookingId: string;
  itemId: string;
  currentType?: string | null;
  title?: string | null;
};

export default function ChangeBookingItemProductSelect({
  bookingId,
  itemId,
  currentType,
  title,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const titleLower = (title || "").toLowerCase();

  const inferredType =
    titleLower.includes("shower") && titleLower.includes("luggage")
      ? "combo"
      : currentType === "booking"
        ? "luggage"
        : currentType;

  const value =
    inferredType === "shower" ||
    inferredType === "combo" ||
    inferredType === "luggage"
      ? inferredType
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
<div className="mt-3 w-full sm:col-span-3">
  {!isEditing ? (
    <div className="rounded-xl bg-gray-50 p-3 text-sm h-full flex flex-col justify-between">
      
      {/* header */}
      <div className="flex justify-between text-xs text-gray-500">
        <span>Product</span>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="text-blue-600 hover:underline"
        >
          Edit
        </button>
      </div>

      {/* value */}
      <div className="font-medium mt-1">
        {value === "combo"
          ? "Luggage + Shower"
          : value.charAt(0).toUpperCase() + value.slice(1)}
      </div>

    </div>
  ) : (
    <select
      value={value}
      disabled={isPending}
      onChange={(event) => {
        handleChange(event.target.value as ProductType);
        setIsEditing(false);
      }}
      className="mt-2 w-full rounded-lg border px-2 py-2 text-sm"
    >
      <option value="luggage">Luggage</option>
      <option value="shower">Shower</option>
      <option value="combo">Luggage + Shower</option>
    </select>
  )}
</div>
  );
}