


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FinishAllInsideButton() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleFinishAll() {
    const confirmed = window.confirm(
      "Finalizar todas as reservas com estado INSIDE?"
    );

    if (!confirmed) return;

    setLoading(true);

    const { error } = await supabase
      .from("bookings")
      .update({
        status: "finished",
        updated_at: new Date().toISOString(),
      })
      .eq("status", "inside");

    setLoading(false);

    if (error) {
      alert("Não foi possível finalizar todas as reservas.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={handleFinishAll}
      disabled={loading}
      className="rounded-xl border px-4 py-2 text-sm disabled:opacity-50"
    >
      {loading ? "A finalizar..." : "Finish all inside"}
    </button>
  );
}