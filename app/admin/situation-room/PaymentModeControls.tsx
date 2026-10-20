"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setBookingPaymentModeAction } from "./actions";
import type { BookingPaymentMode } from "@/lib/booking-payment-mode";

export default function PaymentModeControls({
  mode,
  databaseReady,
}: {
  mode: BookingPaymentMode;
  databaseReady: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  function changeMode(next: BookingPaymentMode) {
    if (pending || !databaseReady || next === mode) return;

    const word = next === "online" ? "RESTORE" : "SOS";
    const explanation =
      next === "online"
        ? "This immediately sends new site bookings to Revolut. Have you verified Revolut is working? Existing unpaid bookings stay unpaid."
        : "This immediately confirms new site bookings without online payment. Customers pay at reception.";

    const answer = window.prompt(
      explanation + "\n\nType " + word + " to confirm:"
    );
    if (answer !== word) return;

    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await setBookingPaymentModeAction(next, word);
        setFeedback(result.message);
        if (result.ok) router.refresh();
      } catch {
        setFeedback("Could not switch payment mode. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled={!databaseReady || pending || mode === "online"}
          onClick={() => changeMode("online")}
          className="rounded-xl border border-emerald-400 bg-emerald-50 px-5 py-4 text-left text-emerald-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="block text-lg font-bold">RESTORE NORMAL</span>
          <span className="mt-1 block text-sm">Revolut checkout for new site bookings</span>
        </button>
        <button
          type="button"
          disabled={!databaseReady || pending || mode === "on_arrival"}
          onClick={() => changeMode("on_arrival")}
          className="rounded-xl border border-amber-400 bg-amber-50 px-5 py-4 text-left text-amber-950 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="block text-lg font-bold">ACTIVATE SOS</span>
          <span className="mt-1 block text-sm">Confirm bookings; collect payment on arrival</span>
        </button>
      </div>
      {feedback && <p role="status" className="rounded-lg border px-3 py-2 text-sm">{feedback}</p>}
      {pending && <p role="status" className="text-sm">Switching mode…</p>}
      <p className="text-sm text-gray-600">
        Affects new site reservations only. Existing bookings, payment statuses and invoices are never rewritten.
        Changes take effect without a redeploy. A confirmation word is required for each switch.
      </p>
    </div>
  );
}
