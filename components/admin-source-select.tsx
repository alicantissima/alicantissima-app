


"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type SourceValue =
  | "choose"
  | "site"
  | "viator"
  | "walkin"
  | "turismo"
  | "hector"
  | "pilar"
  | "melia"
  | "other_host"
  | "other";

const OPTIONS: Array<{ value: SourceValue; label: string }> = [
  { value: "choose", label: "Choose" },
  { value: "site", label: "Site" },
  { value: "viator", label: "Viator" },
  { value: "walkin", label: "Walk-in" },
  { value: "turismo", label: "Turismo" },
  { value: "hector", label: "Héctor" },
  { value: "pilar", label: "Pilar" },
  { value: "melia", label: "Meliá" },
  { value: "other_host", label: "Outro host" },
  { value: "other", label: "Other" },
];

function getSelectTone(value: string) {
  switch (value) {
    case "site":
      return "border-pink-200 bg-pink-50 text-pink-700";
    case "viator":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "walkin":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "turismo":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "hector":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "pilar":
      return "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700";
    case "melia":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "other_host":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";
    case "other":
      return "border-gray-200 bg-gray-50 text-gray-700";
    default:
      return "border-gray-200 bg-white text-gray-500";
  }
}

export default function AdminSourceSelect({
  bookingId,
  value,
}: {
  bookingId: string;
  value: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [currentValue, setCurrentValue] = useState(value || "choose");
  const [isPending, startTransition] = useTransition();

  async function handleChange(nextValue: string) {
    setCurrentValue(nextValue);

    const { error } = await supabase
      .from("bookings")
      .update({ source: nextValue })
      .eq("id", bookingId);

    if (error) {
      setCurrentValue(value || "choose");
      alert("Não foi possível atualizar a source.");
      return;
    }

    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <div className="relative inline-block w-[128px] min-w-[128px]">
      <select
        value={currentValue}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className={`h-8 w-full appearance-none rounded-xl border px-3 pr-8 text-[12px] font-medium leading-none outline-none transition ${getSelectTone(
          currentValue
        )} ${isPending ? "opacity-60" : ""}`}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] opacity-60">
        ▾
      </div>
    </div>
  );
}