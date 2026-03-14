


"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
  currentStatus: string;
  checkOutTime?: string | null;
};

export default function FinishBookingButton({
  bookingId,
  currentStatus,
  checkOutTime,
}: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleFinish() {
    if (loading) return;

    if (currentStatus !== "inside") {
      alert("Esta reserva não está em estado válido para check-out.");
      return;
    }

    setLoading(true);

    const updateData: {
      status: string;
      updated_at: string;
      check_out_time?: string;
    } = {
      status: "finished",
      updated_at: new Date().toISOString(),
    };

    if (!checkOutTime) {
      updateData.check_out_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId);

    setLoading(false);

    if (error) {
      alert("Não foi possível finalizar a reserva.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleFinish}
      disabled={loading}
      className="rounded-xl border border-blue-700 bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "A finalizar..." : "Check-out"}
    </button>
  );
}