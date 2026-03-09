


"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminFinishQrScanner() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function finishBookingFromCode(code: string) {
    setLoading(true);
    setError("");

    const cleaned = code.trim().toUpperCase();

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, booking_code, status")
      .eq("booking_code", cleaned)
      .maybeSingle();

    if (fetchError || !booking) {
      setLoading(false);
      setError("Reserva não encontrada.");
      return;
    }

    if (booking.status === "inside") {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "finished",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (updateError) {
        setLoading(false);
        setError("Não foi possível finalizar a reserva.");
        return;
      }
    } else if (booking.status === "finished") {
      setLoading(false);
      setOpen(false);
      router.push(`/admin/booking/${booking.id}`);
      return;
    } else if (booking.status === "pending") {
      setLoading(false);
      setError("Esta reserva ainda não entrou. Use primeiro o Scan QR.");
      return;
    } else if (booking.status === "cancelled") {
      setLoading(false);
      setError("Esta reserva está cancelada.");
      return;
    } else {
      setLoading(false);
      setError(`Estado inválido: ${booking.status}`);
      return;
    }

    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(120);
    }

    setLoading(false);
    setOpen(false);
    router.push(`/admin/booking/${booking.id}`);
  }

  async function handleScan(result: string) {
    try {
      const url = new URL(result);

      if (url.pathname.startsWith("/b/")) {
        const code = decodeURIComponent(url.pathname.replace("/b/", ""));
        await finishBookingFromCode(code);
        return;
      }

      setError("QR inválido para reservas.");
    } catch {
      if (result.startsWith("/b/")) {
        const code = decodeURIComponent(result.replace("/b/", ""));
        await finishBookingFromCode(code);
        return;
      }

      await finishBookingFromCode(result);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setError("");
          setOpen((prev) => !prev);
        }}
        className="rounded-xl border px-4 py-2 font-medium"
      >
        {open ? "Close finish scanner" : "Finish QR"}
      </button>

      {open && (
        <div className="space-y-3 rounded-2xl border p-4">
          <div className="overflow-hidden rounded-xl">
            <Scanner
              onScan={(detectedCodes) => {
                const rawValue = detectedCodes?.[0]?.rawValue;
                if (rawValue && !loading) {
                  void handleScan(rawValue);
                }
              }}
              onError={(err: unknown) => {
  const isCameraPermissionError =
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name?: string }).name === "NotAllowedError";

  if (isCameraPermissionError) {
    setError("Permissão da câmara recusada.");
  } else {
    setError("Erro ao iniciar a câmara.");
  }
}}
              constraints={{ facingMode: "environment" }}
            />
          </div>

          {loading && (
            <p className="text-sm text-gray-600">A finalizar reserva...</p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}