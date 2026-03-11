


"use client";

import { useState } from "react";

export default function CheckoutPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const totalPrice = 18;

  function handleConfirmBooking(e: React.FormEvent) {
    e.preventDefault();

    // aqui metes a tua lógica real de submit
    console.log({
      name,
      email,
      phone,
      notes,
      totalPrice,
    });
  }

  return (
    <main className="min-h-screen bg-black px-5 pb-28 pt-6 text-white">
      <div className="mx-auto max-w-md space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-white">
          Checkout
        </h1>

        <form onSubmit={handleConfirmBooking} className="space-y-6">
          {/* CUSTOMER DETAILS */}
          <section className="rounded-[28px] border border-white/70 p-5">
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-lg font-medium text-white"
                >
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 bg-black px-4 py-4 text-base text-white outline-none placeholder:text-white/35"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-lg font-medium text-white"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 bg-black px-4 py-4 text-base text-white outline-none placeholder:text-white/35"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-lg font-medium text-white"
                >
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-2xl border border-white/70 bg-black px-4 py-4 text-base text-white outline-none placeholder:text-white/35"
                />
              </div>
            </div>
          </section>

          {/* BOOKING SUMMARY */}
          <section className="rounded-[28px] border border-white/70 p-5">
            <h2 className="text-2xl font-semibold text-white">Booking summary</h2>

            <div className="mt-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-medium text-white">
                    1 × Luggage + Shower
                  </p>
                  <p className="mt-2 text-base text-white/55">Date: 2026-03-28</p>
                  <p className="mt-1 text-base text-white/55">
                    Drop-off: 10h00-10h30
                  </p>
                  <p className="mt-1 text-base text-white/55">
                    Shower time: 10h00-10h30
                  </p>
                </div>

                <p className="text-2xl font-semibold text-white">€ {totalPrice}.00</p>
              </div>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/70 p-4">
              <p className="text-lg font-medium text-white/80">Total price</p>
              <p className="mt-2 text-4xl font-semibold text-white">€ {totalPrice}</p>
            </div>
          </section>

          {/* PRIMARY ACTION */}
          <section className="space-y-4">
            <button
              type="submit"
              className="w-full rounded-[28px] bg-white px-6 py-4.5 text-center text-xl font-semibold text-black shadow-[0_6px_22px_rgba(255,255,255,0.10)] transition active:scale-[0.99]"
            >
              Confirm booking
            </button>
          </section>

          {/* OPTIONAL NOTES AFTER BUTTON */}
          <section className="rounded-[28px] border border-white/50 p-5">
            <label
              htmlFor="notes"
              className="mb-2 block text-lg font-medium text-white/90"
            >
              Comments <span className="text-white/45">(optional)</span>
            </label>

            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full rounded-2xl border border-white/60 bg-black px-4 py-4 text-base text-white outline-none placeholder:text-white/30"
              placeholder="Any extra information?"
            />
          </section>
        </form>
      </div>
    </main>
  );
}