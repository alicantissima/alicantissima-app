


"use client";

import { useMemo, useState } from "react";
import BookingQr from "@/components/booking-qr";

type Props = {
  code: string;
};

export default function BookingPass({ code }: Props) {
  const [open, setOpen] = useState(false);

  const bookingUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/b/${code}`;
    }

    return `https://app.alicantissima.es/b/${code}`;
  }, [code]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(bookingUrl);
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-xl border px-4 py-2 font-medium"
      >
        {open ? "Hide QR" : "Show QR"}
      </button>

      {open && (
        <div className="space-y-3 pt-2">
          <div className="flex justify-center">
            <BookingQr code={code} />
          </div>

          <p className="text-xs break-all text-gray-600 text-center">
            {bookingUrl}
          </p>

          <div className="flex gap-2 justify-center">
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border px-4 py-2"
            >
              Open
            </a>

            <button
              onClick={copyLink}
              className="rounded-xl border px-4 py-2"
            >
              Copy link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}