


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
  try {
    setLoading(true);
    setError(null);

    await finishBooking({
      bookingId,
      currentStatus,
      checkOutTime,
    });

    router.replace("/desk");
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "Failed to finish booking"
    );
  } finally {
    setLoading(false);
  }
}

  return (
    <button
      type="button"
      onClick={handleFinish}
      disabled={loading}
      className="rounded-xl border border-blue-700 bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "A finalizar..." : "Confirm check-out"}
    </button>
  );
}