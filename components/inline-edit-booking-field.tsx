


"use client";

import { useState, useTransition } from "react";
import { updateBookingField } from "@/app/desk/booking/[id]/actions";

type Props = {
  bookingId: string;
  label: string;
  field: "city" | "customer_phone" | "customer_email";
  value: string | null | undefined;
  type?: "text" | "email" | "tel";
};

export default function InlineEditBookingField({
  bookingId,
  label,
  field,
  value,
  type = "text",
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentValue = value?.trim() ? value : "-";

  function handleCancel() {
    setDraft(value ?? "");
    setError(null);
    setIsEditing(false);
  }

  function handleSave() {
    setError(null);

    startTransition(async () => {
      try {
        await updateBookingField({
          bookingId,
          field,
          value: draft,
        });
        setIsEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
  <div className="h-full">
    {!isEditing ? (
      <div className="rounded-xl bg-gray-50 p-3 text-sm h-full flex flex-col justify-between transition hover:bg-gray-100">
        <div className="flex justify-between text-xs text-gray-500">
          <span>{label}</span>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-blue-600 hover:underline active:scale-95 transition"
          >
            Edit
          </button>
        </div>

        <div className="font-medium break-words">{currentValue}</div>
      </div>
    ) : (
      <div className="rounded-xl bg-gray-50 p-3 text-sm">
        <div className="space-y-2">
          <input
            type={type}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-xl border px-3 py-2 text-sm outline-none focus:border-blue-400"
            placeholder={`Enter ${label.toLowerCase()}`}
          />

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

          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      </div>
    )}
  </div>
);
}