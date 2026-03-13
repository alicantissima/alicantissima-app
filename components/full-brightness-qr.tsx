


"use client";

import { useState } from "react";
import BookingQr from "@/components/booking-qr";

type Props = {
  code: string;
  label?: string;
  closeLabel?: string;
};

export default function FullBrightnessQr({
  code,
  label = "Full brightness QR",
  closeLabel = "Tap anywhere to close",
}: Props) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-3 rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        {label}
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
      onClick={() => setOpen(false)}
    >
      <div className="text-center">
        <BookingQr code={code} />

        <p className="mt-6 text-sm text-gray-500">{closeLabel}</p>
      </div>
    </div>
  );
}