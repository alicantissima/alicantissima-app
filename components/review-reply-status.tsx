


"use client";

import { useState, useTransition } from "react";
import { setReviewReplyStatus } from "@/app/desk/history/actions";

type Props = {
  bookingId: string;
  replied: boolean;
  repliedAt?: string | null;
  repliedBy?: string | null;
};

function formatReplyDate(value?: string | null) {
  if (!value) return null;

  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ReviewReplyStatus({
  bookingId,
  replied,
  repliedAt,
  repliedBy,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    setError(null);

    startTransition(async () => {
      try {
        await setReviewReplyStatus({
          bookingId,
          replied: !replied,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update review status"
        );
      }
    });
  }

  const formattedDate = formatReplyDate(repliedAt);

  return (
    <div className="min-w-[150px]">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`inline-flex min-h-9 items-center justify-center rounded-xl border px-3 text-xs font-semibold disabled:opacity-60 ${
          replied
            ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
        }`}
      >
        {isPending
          ? "Saving..."
          : replied
            ? "✓ Replied"
            : "○ Pending"}
      </button>

      {replied && (formattedDate || repliedBy) ? (
        <div className="mt-1 text-[11px] leading-tight text-gray-500">
          {repliedBy ? <div>{repliedBy}</div> : null}
          {formattedDate ? <div>{formattedDate}</div> : null}
        </div>
      ) : null}

      {error ? (
        <div className="mt-1 text-[11px] text-red-600">{error}</div>
      ) : null}
    </div>
  );
}