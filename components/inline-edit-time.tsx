


"use client";

import { useState, useTransition } from "react";
import { updateBookingItemTime } from "@/app/desk/booking/[id]/actions-items";
import { TIME_SLOTS } from "@/lib/time-slots";

type Props = {
  bookingId: string;
  itemId: string;
  label: string;
  field: "dropOffTime" | "pickUpTime" | "showerTime";
  value: string | null | undefined;
};

export default function InlineEditTime({
  bookingId,
  itemId,
  label,
  field,
  value,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [isPending, startTransition] = useTransition();

  function handleCancel() {
    setDraft(value ?? "");
    setIsEditing(false);
  }

  return (
    <div className="rounded-xl bg-gray-50 p-3 text-sm">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>

        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:underline"
          >
            Edit
          </button>
        )}
      </div>

      {!isEditing ? (
        <div className="font-medium">{value || "-"}</div>
      ) : (
        <div className="mt-2 space-y-2">
          <select
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border px-2 py-2 text-sm"
          >
            <option value="">Select time</option>
            {TIME_SLOTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await updateBookingItemTime({
                    bookingId,
                    itemId,
                    field,
                    value: draft,
                  });
                  setIsEditing(false);
                })
              }
              className="rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              disabled={isPending}
              onClick={handleCancel}
              className="rounded border px-2 py-1 text-xs disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}