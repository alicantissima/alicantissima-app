


"use client";

import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function getTodayMadridDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

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
  oscillator.frequency.value = 300; // som mais grave

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();

  setTimeout(() => {
    oscillator.stop();
    ctx.close();
  }, 300);
}

function formatServiceDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function extractBookingCodeFromScan(raw: string) {
  const value = raw.trim();

  // 1) código directo
  if (/^[A-Z]{3}-[A-Z0-9]+$/i.test(value)) {
    return value.toUpperCase();
  }

  // 2) tenta ler como URL
  try {
    const url = new URL(value);

    // formato: /admin?code=ALI-XXXX
    const codeParam = url.searchParams.get("code");
    if (codeParam && /^[A-Z]{3}-[A-Z0-9]+$/i.test(codeParam.trim())) {
      return codeParam.trim().toUpperCase();
    }

    // formato: /b/ALI-XXXX
    const parts = url.pathname.split("/").filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart && /^[A-Z]{3}-[A-Z0-9]+$/i.test(lastPart.trim())) {
      return lastPart.trim().toUpperCase();
    }
  } catch {
    // não era URL, seguimos abaixo
  }

  // 3) fallback: procurar um booking code perdido dentro do texto
  const match = value.match(/[A-Z]{3}-[A-Z0-9]+/i);
  if (match) {
    return match[0].toUpperCase();
  }

  return null;
}

export default function AdminQrScanner() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function openAdminBookingFromCode(code: string) {
    setLoading(true);
    setError("");

    const cleaned = extractBookingCodeFromScan(code);

if (!cleaned) {
  setError("QR inválido para reservas.");
  setLoading(false);
  return;
}
    const todayMadrid = getTodayMadridDate();

    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("id, booking_code, status, check_in_time, service_date")
      .eq("booking_code", cleaned)
      .maybeSingle();

    if (fetchError || !booking) {
      playErrorBeep();
setLoading(false);
setError("Reserva não encontrada.");
return;
    }

    if (booking.status === "finished") {
      playErrorBeep();
setLoading(false);
setError("Esta reserva já foi finalizada.");
return;
    }

    if (booking.status === "cancelled") {
      playErrorBeep();
setLoading(false);
setError("Esta reserva está cancelada.");
return;
    }

    if (booking.status !== "pending" && booking.status !== "inside") {
      playErrorBeep();
      setLoading(false);
      setError(`Estado inválido para check-in: ${booking.status}`);
      return;
    }



    if (!booking.service_date) {
      playErrorBeep();
      setLoading(false);
      setError("Esta reserva não tem data de serviço definida.");
      return;
    }

    if (booking.service_date !== todayMadrid) {
      const formattedDate = formatServiceDate(booking.service_date);
      playErrorBeep();
setLoading(false);
setError(`Esta reserva não é para hoje. Data da reserva: ${formattedDate}.`);
return;
    }

    const updateData: {
      status?: string;
      updated_at?: string;
      check_in_time?: string;
    } = {};

    if (booking.status === "pending") {
      updateData.status = "inside";
      updateData.updated_at = new Date().toISOString();
    }

    if (!booking.check_in_time) {
      updateData.check_in_time = new Date().toISOString();
    }

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from("bookings")
        .update(updateData)
        .eq("id", booking.id);

      if (updateError) {
        playErrorBeep();
        setLoading(false);
        setError("Não foi possível registar a entrada da reserva.");
        return;
      }
    }

    playBeep();
setTimeout(playBeep, 120);

if (typeof navigator !== "undefined" && "vibrate" in navigator) {
  navigator.vibrate([120, 80, 120]);
}

setLoading(false);
setOpen(false);
router.push(`/admin/booking/${booking.id}`);
  }

  async function handleScan(result: string) {
  await openAdminBookingFromCode(result);
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