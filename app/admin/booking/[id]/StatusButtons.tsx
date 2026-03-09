

"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Props = {
  bookingId: string;
  currentStatus: string;
};

type BookingItem = {
  id: string;
  meta: Record<string, unknown> | null;
};

function getCurrentTimeString() {
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export default function StatusButtons({ bookingId, currentStatus }: Props) {
  const supabase = createClient();
  const router = useRouter();

  function normalizeStatus(status: string) {
    if (status === "received") return "booked";
    if (status === "inside") return "inside";
    if (status === "completed") return "completed";
    return status;
  }

  async function setTimeMeta(field: "time_in" | "time_out") {
    const now = getCurrentTimeString();

    const { data: items, error: fetchError } = await supabase
      .from("booking_items")
      .select("id, meta")
      .eq("booking_id", bookingId);

    if (fetchError) {
      console.error("Erro ao carregar booking_items:", fetchError.message);
      return false;
    }

    for (const item of ((items as BookingItem[] | null) ?? [])) {
      const currentMeta = item.meta ?? {};
      const currentValue = currentMeta[field];

      if (typeof currentValue === "string" && currentValue.trim() !== "") {
        continue;
      }

      const updatedMeta = {
        ...currentMeta,
        [field]: now,
      };

      const { error: updateItemError } = await supabase
        .from("booking_items")
        .update({ meta: updatedMeta })
        .eq("id", item.id);

      if (updateItemError) {
        console.error(
          `Erro ao atualizar ${field} no item ${item.id}:`,
          updateItemError.message
        );
        return false;
      }
    }

    return true;
  }

  async function updateBookingStatus(status: string) {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    if (error) {
      console.error("Erro ao atualizar status da reserva:", error.message);
      return false;
    }

    return true;
  }

  async function handleCheckIn() {
    const okMeta = await setTimeMeta("time_in");
    if (!okMeta) return;

    const okStatus = await updateBookingStatus("inside");
    if (!okStatus) return;

    router.refresh();
  }

  async function handleFinish() {
    const okMeta = await setTimeMeta("time_out");
    if (!okMeta) return;

    const okStatus = await updateBookingStatus("completed");
    if (!okStatus) return;

    router.refresh();
  }

  const status = normalizeStatus(currentStatus);

  return (
    <div className="flex gap-2">
      {status === "booked" && (
        <button
          onClick={handleCheckIn}
          className="rounded-xl border bg-green-50 px-3 py-1 text-sm hover:bg-green-100"
        >
          CHECK-IN
        </button>
      )}

      {status === "inside" && (
        <button
          onClick={handleFinish}
          className="rounded-xl border bg-gray-50 px-3 py-1 text-sm hover:bg-gray-100"
        >
          FINISH
        </button>
      )}
    </div>
  );
}