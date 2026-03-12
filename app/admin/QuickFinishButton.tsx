


"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
};

export default function QuickFinishButton({ bookingId }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    if (loading) return;

    setLoading(true);

    const now = new Date();
    const timeOut = new Intl.DateTimeFormat("pt-PT", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);

    const { error: bookingError } = await supabase
      .from("bookings")
      .update({
        status: "finished",
        check_out_at: now.toISOString(),
      })
      .eq("id", bookingId);

    if (!bookingError) {
      const { data: items } = await supabase
        .from("booking_items")
        .select("booking_id, meta")
        .eq("booking_id", bookingId);

      if (items?.length) {
        for (const item of items) {
          const currentMeta =
            item.meta && typeof item.meta === "object" ? item.meta : {};

          await supabase
            .from("booking_items")
            .update({
              meta: {
                ...currentMeta,
                time_out: timeOut,
              },
            })
            .eq("booking_id", bookingId);
        }
      }
    }

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleFinish}
      disabled={loading}
      className="rounded-lg border px-2 py-1 text-[11px] font-medium leading-none hover:bg-gray-50 disabled:opacity-60"
    >
      {loading ? "..." : "FINISH"}
    </button>
  );
}