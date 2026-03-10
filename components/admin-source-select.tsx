


"use client";

import { createClient } from "@/lib/supabase/client";

const sources = [
  "site",
  "viator",
  "booking",
  "bokun",
  "porta",
  "na",
];

export default function AdminSourceSelect({
  bookingId,
  value,
}: {
  bookingId: string;
  value: string | null;
}) {
  const supabase = createClient();

  async function updateSource(newSource: string) {
    await supabase
      .from("bookings")
      .update({ source: newSource })
      .eq("id", bookingId);
  }

  return (
    <select
      defaultValue={value ?? "na"}
      onChange={(e) => updateSource(e.target.value)}
      className="rounded border px-2 py-1 text-sm"
    >
      {sources.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}