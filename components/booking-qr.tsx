


"use client";

import QRCode from "react-qr-code";

export default function BookingQr({ code }: { code: string }) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const url = `${base}/b/${code}`;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    alert("Booking link copied");
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 inline-block rounded-xl border">
        <QRCode value={url} size={180} />
      </div>

      <p className="text-xs break-all">{url}</p>

      <div className="flex gap-2">
        <a
          href={url}
          target="_blank"
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Open
        </a>

        <button
          onClick={copyLink}
          className="rounded-lg border px-3 py-2 text-sm font-medium"
        >
          Copy link
        </button>
      </div>
    </div>
  );
}