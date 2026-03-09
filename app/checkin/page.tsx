


"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CheckinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleOpen() {
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return;
    router.push(`/b/${cleaned}`);
  }

  return (
    <main className="max-w-md mx-auto p-6">
      <div className="rounded-2xl border p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Open your booking</h1>
          <p className="text-sm text-gray-600">
            Enter your booking code to access your reservation.
          </p>
        </div>

        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleOpen();
          }}
          placeholder="Enter booking code"
          className="w-full rounded-xl border px-4 py-3 uppercase"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />

        <button
          onClick={handleOpen}
          className="w-full rounded-xl border px-4 py-3 font-semibold"
        >
          Open booking
        </button>
      </div>
    </main>
  );
}