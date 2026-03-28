


"use client";

import { useRef, useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function playBeep() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 900;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();

  setTimeout(() => {
    oscillator.stop();
    ctx.close();
  }, 80);
}

function playErrorBeep() {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 300;

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();

  setTimeout(() => {
    oscillator.stop();
    ctx.close();
  }, 300);
}

function extractBookingCodeFromScan(raw: string) {
  const value = raw.trim();

  if (/^[A-Z]{3}-[A-Z0-9]+$/i.test(value)) {
    return value.toUpperCase();
  }

  try {
    const url = new URL(value);

    const codeParam = url.searchParams.get("code");
    if (codeParam && /^[A-Z]{3}-[A-Z0-9]+$/i.test(codeParam.trim())) {
      return codeParam.trim().toUpperCase();
    }

    const parts = url.pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart && /^[A-Z]{3}-[A-Z0-9]+$/i.test(lastPart.trim())) {
      return lastPart.trim().toUpperCase();
    }
  } catch {
    // não era URL
  }

  const match = value.match(/[A-Z]{3}-[A-Z0-9]+/i);
  if (match) {
    return match[0].toUpperCase();
  }

  return null;
}

export default function AdminFinishQrScanner() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const lastScanRef = useRef("");
  const lastScanAtRef = useRef(0);
  const router = useRouter();
  const supabase = createClient();

  async function finishBookingFromCode(code: string) {
    setLoading(true);
    setError("");

    const cleaned = extractBookingCodeFromScan(code);

    if (!cleaned) {
      playErrorBeep();
      setLoading(false);
      setError("QR inválido para reservas.");
      return;
    }

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, booking_code, status, check_out_time")
      .eq("booking_code", cleaned)
      .maybeSingle();

    if (fetchError || !booking) {
      playErrorBeep();
      setLoading(false);
      setError("Reserva não encontrada.");
      return;
    }

    if (booking.status === "inside") {
      const updateData: {
        status: string;
        updated_at: string;
        check_out_time?: string;
      } = {
        status: "finished",
        updated_at: new Date().toISOString(),
      };

      if (!booking.check_out_time) {
        updateData.check_out_time = new Date().toISOString();
      }

      const { error: updateError } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", booking.id);

      if (updateError) {
        playErrorBeep();
        setLoading(false);
        setError("Não foi possível finalizar a reserva.");
        return;
      }

      playBeep();
      setTimeout(playBeep, 120);

      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([120, 80, 120]);
      }

      lastScanRef.current = "";
      lastScanAtRef.current = 0;

      setLoading(false);
      setOpen(false);
      router.push(`/admin/booking/${booking.id}`);
      return;
    }

    if (booking.status === "finished") {
      playErrorBeep();
      lastScanRef.current = "";
      lastScanAtRef.current = 0;
      setLoading(false);
      setOpen(false);
      router.push(`/admin/booking/${booking.id}`);
      return;
    }

    if (booking.status === "inside") {
      playErrorBeep();
      setLoading(false);
      setError("Esta reserva ainda não entrou. Use primeiro o Scan QR.");
      return;
    }

    if (booking.status === "cancelled") {
      playErrorBeep();
      setLoading(false);
      setError("Esta reserva está cancelada.");
      return;
    }

    playErrorBeep();
    setLoading(false);
    setError(`Estado inválido: ${booking.status}`);
  }

  async function handleScan(result: string) {
    await finishBookingFromCode(result);
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setError("");
          lastScanRef.current = "";
          lastScanAtRef.current = 0;
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
                const rawValue = detectedCodes?.[0]?.rawValue?.trim();
                if (!rawValue || loading) return;

                const now = Date.now();
                const isSameAsLast = rawValue === lastScanRef.current;
                const isTooSoon = now - lastScanAtRef.current < 2000;

                if (isSameAsLast && isTooSoon) {
                  return;
                }

                lastScanRef.current = rawValue;
                lastScanAtRef.current = now;

                void handleScan(rawValue);
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