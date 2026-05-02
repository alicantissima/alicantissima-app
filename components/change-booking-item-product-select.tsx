


"use client";

import { useEffect, useState, useTransition } from "react";
import { changeBookingItemProduct } from "@/app/desk/booking/[id]/actions";

type ProductType = "luggage" | "shower" | "combo";

type Props = {
  bookingId: string;
  itemId: string;
  currentType?: string | null;
  title?: string | null;
};

function getProductLabel(value: ProductType) {
  if (value === "combo") return "Luggage + Shower";
  if (value === "shower") return "Shower";
  return "Luggage";
}

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

  const value: ProductType =
    inferredType === "shower" ||
    inferredType === "combo" ||
    inferredType === "luggage"
      ? inferredType
      : "luggage";

  const [draft, setDraft] = useState<ProductType>(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  function handleSave() {
    startTransition(async () => {
      await changeBookingItemProduct({
        bookingId,
        itemId,
        newType: draft,
      });

      setIsEditing(false);
    });
  }

  function handleCancel() {
    setDraft(value);
    setIsEditing(false);
  }

  return (
    <div className="mt-3 w-full sm:col-span-3">
      {!isEditing ? (
        <div className="rounded-xl bg-gray-50 p-3 text-sm h-full flex flex-col justify-between transition hover:bg-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Product</span>

            <button
              type="button"
              onClick={() => {
                setDraft(value);
                setIsEditing(true);
              }}
              className="text-blue-600 hover:underline active:scale-95 transition"
            >
              Edit
            </button>
          </div>

          <div className="mt-1 font-medium">{getProductLabel(value)}</div>
        </div>
      ) : (
        <div className="rounded-xl bg-gray-50 p-3 text-sm">
          <div className="space-y-2">
            <select
              value={draft}
              disabled={isPending}
              onChange={(event) =>
                setDraft(event.target.value as ProductType)
              }
              className="w-full rounded-lg border px-2 py-2 text-sm"
            >
              <option value="luggage">Luggage</option>
              <option value="shower">Shower</option>
              <option value="combo">Luggage + Shower</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="inline-flex h-9 items-center justify-center rounded-xl bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Save"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={isPending}
                className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


