


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  count: number;
};

export default function FinishAllInsideButton({ count }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (count === 0) return null;

  async function handleFinishAll() {
    const confirmed = window.confirm(
      `Finalizar ${count} reservas com estado INSIDE?`
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
      alert("Erro ao finalizar reservas.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={handleFinishAll}
      disabled={loading}
      className="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
    >
      {loading ? "A finalizar..." : `Finish all inside (${count})`}
    </button>
  );
}