


"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminQrScanner() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function openAdminBookingFromCode(code: string) {
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

    if (booking.status === "pending") {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          status: "inside",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (updateError) {
        setLoading(false);
        setError("Não foi possível marcar a reserva como INSIDE.");
        return;
      }
    } else if (booking.status === "inside") {
      // já entrou, apenas abre a reserva
    } else if (booking.status === "finished") {
      setLoading(false);
      setError("Esta reserva já foi finalizada.");
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
      navigator.vibrate(100);
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
        await openAdminBookingFromCode(code);
        return;
      }

      setError("QR inválido para reservas.");
    } catch {
      if (result.startsWith("/b/")) {
        const code = decodeURIComponent(result.replace("/b/", ""));
        await openAdminBookingFromCode(code);
        return;
      }

      await openAdminBookingFromCode(result);
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
        {open ? "Close scanner" : "Scan QR"}
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
            <p className="text-sm text-gray-600">A procurar reserva...</p>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}