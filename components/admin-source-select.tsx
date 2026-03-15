


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

const sourceStyles: Record<string, string> = {
  site: "bg-pink-100 text-pink-800",
  viator: "bg-green-100 text-green-800",
  booking: "bg-blue-100 text-blue-800",
  porta: "bg-yellow-100 text-yellow-800",
  hector: "bg-orange-200 text-gray-800",
  na: "bg-gray-100 text-gray-500",
};

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

  const current = value ?? "na";

  return (
    <select
      defaultValue={current}
      onChange={(e) => updateSource(e.target.value)}
      className={`w-full rounded border px-2 py-1 text-[12px] font-medium ${sourceStyles[current]}`}
    >
      {sources.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}