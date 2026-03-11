


"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/bookingStore";

export default function CheckoutClient() {
  const router = useRouter();
  const items = useBookingStore((state) => state.items);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [items]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    router.push("/confirmation");
  }

  return (
    <main className="min-h-screen bg-black px-5 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-3xl font-semibold">Checkout</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-[28px] border border-white/20 p-5">
            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold">Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/20 p-5">
            <h2 className="text-lg font-semibold">Booking summary</h2>

            <div className="mt-4 space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>
                    {item.quantity} × {item.productName}
                  </span>
                  <span>€ {item.totalPrice}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/20 p-4">
              <p className="text-sm text-white/60">Total price</p>
              <p className="text-2xl font-semibold">€ {total}</p>
            </div>
          </section>

          <button
            type="submit"
            className="w-full rounded-[28px] bg-white px-6 py-4 text-lg font-semibold text-black"
          >
            Confirm booking
          </button>

          <section className="rounded-[28px] border border-white/20 p-5">
            <label className="mb-2 block text-sm font-semibold">
              Comments (optional)
            </label>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3"
            />
          </section>
        </form>
      </div>
    </main>
  );
}