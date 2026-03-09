


"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  bookingId: string;
};

function getCurrentTimeString() {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export default function QuickFinishButton({ bookingId }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFinish() {
    setLoading(true);

    const now = getCurrentTimeString();

    const { data: items } = await supabase
      .from("booking_items")
      .select("id, meta")
      .eq("booking_id", bookingId);

    for (const item of items ?? []) {
      const meta = (item.meta ?? {}) as Record<string, unknown>;

      if (!meta.time_out) {
        await supabase
          .from("booking_items")
          .update({
            meta: {
              ...meta,
              time_out: now,
            },
          })
          .eq("id", item.id);
      }
    }

    await supabase
      .from("bookings")
      .update({ status: "completed" })
      .eq("id", bookingId);

    router.refresh();
  }

  return (
    <button
      onClick={handleFinish}
      disabled={loading}
      className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-100 disabled:opacity-60"
    >
      {loading ? "..." : "FINISH"}
    </button>
  );
}