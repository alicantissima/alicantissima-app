


"use client";

import QRCode from "react-qr-code";

export default function BookingQr({ code }: { code: string }) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://app.alicantissima.es";

  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const url = `${cleanBaseUrl}/b/${code}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      alert("Booking link copied");
    } catch {
      alert("Could not copy link");
    }
  }

  return (
    <div className="space-y-3">
      <div className="inline-block rounded-xl border bg-white p-3">
        <QRCode value={url} size={160} />
      </div>

      <p className="max-w-[220px] break-all text-xs text-gray-700">{url}</p>

      <div className="flex gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Open
        </a>

        <button
          onClick={copyLink}
          className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Copy link
        </button>
      </div>
    </div>
  );
}