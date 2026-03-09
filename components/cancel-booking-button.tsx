


"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CancelBookingButton({
  bookingId,
}: {
  bookingId: string;
}) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleCancel() {
    const confirmed = window.confirm(
      "Marcar esta reserva como cancelada / no-show?"
    );

    if (!confirmed) return;

    setLoading(true);

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    setLoading(false);

    if (error) {
      alert("Não foi possível cancelar a reserva.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="rounded-xl border px-4 py-2 text-sm font-medium"
    >
      {loading ? "A cancelar..." : "Mark as cancelled"}
    </button>
  );
}