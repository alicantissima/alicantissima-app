


"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/bookingStore";

export default function CheckoutClient() {
  const router = useRouter();

  const items = useBookingStore((state) => state.items);
  const setCustomer = useBookingStore((state) => state.setCustomer);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [staffComments, setStaffComments] = useState("");

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [items]);

  const hasItems = items.length > 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!hasItems) {
      alert("Your booking is empty.");
      return;
    }

    if (!fullName.trim()) {
      alert("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    setCustomer({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      comments: staffComments.trim() || undefined,
    });

    router.push("/confirmation");
  }

  if (!hasItems) {
    return (
      <section className="space-y-6">
        <div className="rounded-[28px] border border-white/20 bg-black p-6 text-center text-white">
          <p className="mb-2 text-lg font-semibold">Your booking is empty.</p>
          <p className="text-sm text-white/55">
            Add a service before going to checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="block w-full rounded-[28px] bg-white px-4 py-4 text-center text-sm font-bold uppercase text-black"
        >
          Back to home
        </button>
      </section>
    );
  }

  return (
    <main className="min-h-screen bg-black pb-28 pt-2 text-white">
      <div className="mx-auto max-w-md space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-[28px] border border-white/20 bg-black p-5">
            <h2 className="text-base font-bold text-white">Your booking</h2>

            <div className="mt-4 space-y-4">
              {items.map((item, index) => (
                <article
                  key={index}
                  className="space-y-2 border-t border-white/10 pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="font-semibold text-white">
                    {item.quantity} × {item.productName}
                  </div>

                  <div className="space-y-1 text-sm text-white/65">
                    <div>{item.bookingDate}</div>

                    {item.productCode === "luggage" && (
                      <>
                        <div>Drop-off {item.dropOffTime || "-"}</div>
                        <div>Pick-up {item.pickUpTime || "-"}</div>
                      </>
                    )}

                    {item.productCode === "shower" && (
                      <div>Shower {item.showerTime || "-"}</div>
                    )}

                    {item.productCode === "combo" && (
                      <>
                        <div>Drop-off {item.dropOffTime || "-"}</div>
                        <div>Shower {item.showerTime || "-"}</div>
                      </>
                    )}

                    {item.comments ? <div>Comments: {item.comments}</div> : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/20 bg-black p-5">
            <h2 className="text-base font-bold text-white">Your details</h2>

            <div className="mt-4 space-y-5">
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-sm font-semibold text-white">
                  Full name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-white outline-none placeholder:text-white/30"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-white">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-white outline-none placeholder:text-white/30"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-semibold text-white">
                  Phone number <span className="text-white/45">(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-white outline-none placeholder:text-white/30"
                />
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/20 bg-black p-5">
            <div className="mb-2 text-sm font-semibold text-white/70">Total</div>
            <div className="text-3xl font-bold text-white">€ {total.toFixed(2)}</div>
          </section>

          <section className="space-y-4">
            <button
              type="submit"
              className="w-full rounded-[28px] bg-white px-6 py-5 text-center text-lg font-semibold text-black shadow-[0_6px_22px_rgba(255,255,255,0.10)] transition active:scale-[0.99]"
            >
              Confirm booking
            </button>
          </section>

          <section className="rounded-[28px] border border-white/15 bg-black p-5">
            <label
              htmlFor="staffComments"
              className="mb-2 block text-sm font-semibold text-white/90"
            >
              Comments for staff <span className="text-white/45">(optional)</span>
            </label>

            <textarea
              id="staffComments"
              value={staffComments}
              onChange={(e) => setStaffComments(e.target.value)}
              placeholder="Add comment"
              rows={4}
              className="w-full rounded-2xl border border-white/20 bg-black px-4 py-3 text-white outline-none placeholder:text-white/30"
            />
          </section>
        </form>
      </div>
    </main>
  );
}