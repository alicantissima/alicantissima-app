


"use client";

import { useState, useTransition } from "react";
import { updateBookingItemTime } from "@/app/desk/booking/[id]/actions-items";

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

  return (
    <div className="rounded-xl bg-gray-50 p-3 text-sm">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>

        {!isEditing && (
          <button
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
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border px-2 py-1 text-sm"
            placeholder="e.g. 10:30"
          />

          <div className="flex gap-2">
            <button
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
              className="text-xs text-white bg-blue-600 px-2 py-1 rounded"
            >
              Save
            </button>

            <button
              onClick={() => setIsEditing(false)}
              className="text-xs border px-2 py-1 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}