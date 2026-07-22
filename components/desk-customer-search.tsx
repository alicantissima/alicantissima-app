


"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

export default function DeskCustomerSearch({
  initialValue,
}: {
  initialValue: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());

      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [value, pathname, router, searchParams]);

  return (
    <div className="relative flex-1">
      <input
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search name, city, email or date"
        className="h-11 w-full rounded-xl border px-4 pr-12 text-sm outline-none focus:border-blue-400"
      />

      {isPending ? (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
          Searching…
        </div>
      ) : value ? (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-gray-400 hover:text-gray-700"
          aria-label="Clear search"
        >
          ×
        </button>
      ) : null}
    </div>
  );
}