


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

    try {
      setLoading(true);

      const { error } = await supabase
        .from("bookings")
        .update({
          status: "completed",
          check_out_time: checkOutTime ?? new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) {
        throw error;
      }

      router.replace("/desk");
    } catch (error) {
      console.error("Failed to finish booking:", error);
      alert("Não foi possível concluir o check-out. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  }

  const alreadyFinished =
    currentStatus === "completed" || currentStatus === "finished";

  return (
    <button
      type="button"
      onClick={handleFinish}
      disabled={loading || alreadyFinished}
      className="rounded-xl border border-blue-700 bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading
        ? "A finalizar..."
        : alreadyFinished
          ? "Check-out concluído"
          : "Confirm check-out"}
    </button>
  );
}