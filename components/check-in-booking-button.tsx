


"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
  currentStatus: string;
  serviceDate?: string | null;
  checkInTime?: string | null;
};

function getTodayMadridDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function CheckInBookingButton({
  bookingId,
  currentStatus,
  serviceDate,
  checkInTime,
}: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleCheckIn() {
    if (loading) return;

    if (currentStatus !== "pending") {
      alert("Esta reserva não está em estado válido para check-in.");
      return;
    }

    if (!serviceDate) {
      alert("Esta reserva não tem data de serviço definida.");
      return;
    }

    const todayMadrid = getTodayMadridDate();

    if (serviceDate !== todayMadrid) {
      alert("Esta reserva não é para hoje.");
      return;
    }

    setLoading(true);

    const updateData: {
      status: string;
      updated_at: string;
      check_in_time?: string;
    } = {
      status: "inside",
      updated_at: new Date().toISOString(),
    };

    if (!checkInTime) {
      updateData.check_in_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId);

    setLoading(false);

    if (error) {
      alert("Não foi possível fazer o check-in.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleCheckIn}
      disabled={loading}
      className="rounded-xl border border-green-700 bg-green-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "A registar entrada..." : "Check-in"}
    </button>
  );
}