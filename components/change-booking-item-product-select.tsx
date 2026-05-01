


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
    <div className="mt-3">
  {!isEditing ? (
    <div className="flex w-full items-center justify-between gap-4 rounded-xl border bg-gray-50 px-4 py-3">
  <div className="min-w-0 flex-1 text-sm font-medium">
    {value === "combo"
      ? "Luggage + Shower"
      : value.charAt(0).toUpperCase() + value.slice(1)}
  </div>

  <button
    type="button"
    onClick={() => setIsEditing(true)}
    className="shrink-0 text-sm font-medium text-blue-600 hover:underline"
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