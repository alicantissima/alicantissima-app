


"use client";

import { useState } from "react";
import QRCode from "react-qr-code";

export default function BookingPass({ code }: { code: string }) {
  const [open, setOpen] = useState(false);

  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${base}/b/${code}`;

  return (
    <div className="space-y-4">
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border px-4 py-2 font-semibold"
      >
        Show QR
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl p-8 space-y-6 text-center max-w-sm w-full">
            <h2 className="text-xl font-bold">Show this QR at reception</h2>

            <div className="flex justify-center">
              <QRCode value={url} size={260} />
            </div>

            <p className="text-sm break-all">{code}</p>

            <button
              onClick={() => setOpen(false)}
              className="rounded-xl border px-4 py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}