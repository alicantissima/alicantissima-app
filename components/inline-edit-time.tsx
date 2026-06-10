


"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { updateBookingItemTime } from "@/app/desk/booking/[id]/actions-items";
import { TIME_SLOTS } from "@/lib/time-slots";
import {
  getShowerDurationMinutes,
  getShowerEndTime,
  timeToMinutes,
} from "@/lib/showers";

type AvailabilitySlot = {
  value: string;
  label: string;
  startTime: string;
  endTime: string;
  available: boolean;
};

type Props = {
  bookingId: string;
  itemId: string;
  label: string;
  field: "dropOffTime" | "pickUpTime" | "showerTime";
  value: string | null | undefined;
  showerQuantity?: number;
  serviceDate?: string | null;
};

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function generateShowerStartTimes(quantity: number) {
  const durationMinutes = getShowerDurationMinutes(quantity);
  const openingMinutes = timeToMinutes("10:00");
  const closingMinutes = timeToMinutes("19:00");
  const stepMinutes = 15;

  const times: string[] = [];

  for (
    let start = openingMinutes;
    start + durationMinutes <= closingMinutes;
    start += stepMinutes
  ) {
    times.push(minutesToTime(start));
  }

  return times;
}

function normalizeTimeValue(value?: string | null) {
  if (!value) return "";

  if (value.includes("-")) {
    return value.split("-")[0].replace("h", ":").trim();
  }

  return value.replace("h", ":").trim();
}

function formatShowerOption(startTime: string, quantity: number) {
  const endTime = getShowerEndTime(startTime, quantity);
  return `${startTime}-${endTime}`;
}

export default function InlineEditTime({
  bookingId,
  itemId,
  label,
  field,
  value,
  showerQuantity = 1,
  serviceDate,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(normalizeTimeValue(value));
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const isShowerField = field === "showerTime";
  const quantity = Math.max(1, Number(showerQuantity || 1));
  const normalizedValue = normalizeTimeValue(value);

  useEffect(() => {
    setDraft(normalizeTimeValue(value));
  }, [value]);

  useEffect(() => {
    async function loadAvailability() {
      if (!isShowerField || !serviceDate || !isEditing) {
        return;
      }

      setAvailabilityLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("date", serviceDate);
        params.set("quantity", String(quantity));
        params.set("excludeBookingId", bookingId);

        const response = await fetch(
          `/api/showers/availability?${params.toString()}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || "Could not load shower availability.");
        }

        setAvailabilitySlots(data.slots || []);
      } catch (err) {
        setAvailabilitySlots([]);
        setError(
          err instanceof Error
            ? err.message
            : "Could not load shower availability."
        );
      } finally {
        setAvailabilityLoading(false);
      }
    }

    loadAvailability();
  }, [isShowerField, serviceDate, quantity, isEditing, bookingId]);

  const options = useMemo(() => {
    if (!isShowerField) {
      return TIME_SLOTS.map((slot) => ({
        value: slot,
        label: slot,
        available: true,
      }));
    }

    if (availabilitySlots.length > 0) {
      const hasCurrentValue = availabilitySlots.some(
        (slot) => slot.value === normalizedValue
      );

      if (normalizedValue && !hasCurrentValue) {
        return [
          {
            value: normalizedValue,
            label: `${formatShowerOption(normalizedValue, quantity)} · Current`,
            available: true,
          },
          ...availabilitySlots,
        ];
      }

      return availabilitySlots;
    }

    return generateShowerStartTimes(quantity).map((startTime) => ({
      value: startTime,
      label: formatShowerOption(startTime, quantity),
      available: true,
    }));
  }, [isShowerField, availabilitySlots, normalizedValue, quantity]);

  function handleCancel() {
    setDraft(normalizeTimeValue(value));
    setError(null);
    setIsEditing(false);
  }

  function handleSave() {
    setError(null);

    startTransition(async () => {
      try {
        await updateBookingItemTime({
          bookingId,
          itemId,
          field,
          value: draft,
        });

        setIsEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  const displayValue =
    isShowerField && value
      ? formatShowerOption(normalizeTimeValue(value), quantity)
      : value || "-";

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
        <div className="font-medium">{displayValue}</div>
      ) : (
        <div className="mt-2 space-y-2">
          <select
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full rounded-lg border px-2 py-2 text-sm"
            disabled={availabilityLoading || isPending}
          >
            <option value="">
              {availabilityLoading ? "Loading times..." : "Select time"}
            </option>

            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={!option.available && option.value !== normalizedValue}
              >
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isPending || availabilityLoading}
              onClick={handleSave}
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

          {error ? <p className="text-xs text-red-600">{error}</p> : null}
        </div>
      )}
    </div>
  );
}