


"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

type CancelBookingClientProps = {
  code: string;
  token: string;
};

export default function CancelBookingClient({
  code,
  token,
}: CancelBookingClientProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const canSubmit = Boolean(code && token && !done && !isPending);

  function handleCancel() {
    setMessage("");
    setError("");

    if (!code || !token) {
      setError("Invalid cancellation link.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/bookings/cancel", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingCode: code,
            token,
            reason: "Customer cancelled online",
          }),
        });

        const result = await response.json().catch(() => null);

        if (!response.ok || !result?.ok) {
          setError(
            result?.error ||
              "This booking could not be cancelled online. Please contact us."
          );
          return;
        }

        setDone(true);
        setMessage(
          result?.message ||
            "Your booking has been cancelled and your payment has been refunded."
        );
      } catch (err) {
        console.error("Cancel booking request failed:", err);
        setError(
          "This booking could not be cancelled online. Please contact us."
        );
      }
    });
  }

  if (!code || !token) {
    return (
      <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
        Invalid cancellation link.
      </div>
    );
  }

  return (
    <div className="mt-6">
      {!done ? (
        <>
          <button
            type="button"
            onClick={handleCancel}
            disabled={!canSubmit}
            className="inline-flex rounded-full bg-emerald-800 px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending
              ? "Cancelling booking..."
              : "Cancel booking and refund payment"}
          </button>

          <p className="mt-4 text-xs leading-5 text-zinc-500">
            This action can only be completed if the booking is still within the
            free cancellation period.
          </p>
        </>
      ) : null}

      {message ? (
        <div className="mt-6 rounded-2xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-700">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
          {error}
        </div>
      ) : null}

      {done ? (
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex rounded-full border border-zinc-900 bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Back home
          </Link>
        </div>
      ) : null}
    </div>
  );
}