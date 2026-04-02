





"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useBookingStore } from "@/store/bookingStore";

export default function ConfirmationPage() {
  const items = useBookingStore((state) => state.items);
  const clearItems = useBookingStore((state) => state.clearItems);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-md space-y-6">
        <section className="rounded-[28px] border border-white/20 p-6 text-center">
          <h1 className="text-2xl font-bold">Booking confirmed</h1>
          <p className="mt-3 text-white/60">See you soon at Alicantissima.</p>
        </section>

        <section className="rounded-[28px] border border-white/20 p-6">
          <p className="text-sm text-white/60">Total paid</p>
          <p className="mt-2 text-2xl font-semibold">€ {total}</p>
        </section>

        <Link
          href="/"
          onClick={() => clearItems()}
          className="block w-full rounded-[28px] bg-white px-4 py-4 text-center text-sm font-bold uppercase text-black"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}