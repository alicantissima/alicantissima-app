


"use client";

import Link from "next/link";

const products = [
  {
    title: "Store luggage",
    price: "€8",
    description: "Safe luggage storage in Alicante city center",
    href: "/book-luggage",
    accent: "bg-slate-950",
  },
  {
    title: "Take a shower",
    price: "€12",
    description: "Freshen up before your flight or after the beach",
    href: "/book-shower",
    accent: "bg-sky-500",
  },
  {
    title: "Luggage + shower",
    price: "€18",
    description: "Leave your bags and enjoy a refreshing shower",
    href: "/book-combo",
    accent: "bg-emerald-500",
  },
];

const extrasRows = [
  "Wi-Fi • Phone charging • WC • Sofa area",
  "Coffee • Cold water • Printer & scanner",
  "Luggage scale • Beach towels • Sun shade",
  "Hair dryer • Body gel • Shampoo • Shower towels",
  "Air conditioning everywhere",
];

export default function HomeClient() {
  return (
    <main className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <div className="mx-auto w-full max-w-[390px] px-4 pb-9 pt-6">
        <section className="rounded-[28px] bg-white px-6 pb-6 pt-7 shadow-[0_4px_18px_rgba(15,23,42,0.05)] ring-1 ring-slate-200/70">
          <div className="text-center">
            <h1 className="text-[2.05rem] font-extrabold uppercase tracking-[-0.03em] text-slate-950">
              Alicantissima
            </h1>

            <p className="mt-2.5 text-[1.02rem] font-medium leading-8 text-slate-700">
              Luggage Storage &amp; Shower Lounge
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.95rem] font-medium text-slate-700">
              ⭐ 4.9 rating
            </div>
            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[0.95rem] font-medium text-slate-700">
              📍 Alicante city center
            </div>
            <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.95rem] font-medium text-emerald-700">
              🟢 Open daily · 10:00–22:00
            </div>
          </div>
        </section>

        <section className="mt-5 space-y-3.5">
          {products.map((product) => (
            <Link
              key={product.title}
              href={product.href}
              className="group block rounded-[28px] bg-white px-6 py-5 shadow-[0_3px_14px_rgba(15,23,42,0.045)] ring-1 ring-slate-200/80 transition-all duration-200 active:scale-[0.995]"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`h-2.5 w-2.5 rounded-full ${product.accent}`} />
                  <h2 className="text-[1.02rem] font-extrabold uppercase tracking-[0.01em] text-slate-950">
                    {product.title}
                  </h2>
                </div>

                <div className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-base font-semibold text-slate-950 shadow-[0_2px_8px_rgba(15,23,42,0.05)]">
                  {product.price}
                </div>
              </div>

              <p className="max-w-[22rem] text-[0.98rem] leading-7 text-slate-600">
                {product.description}
              </p>

              <div className="mt-4 text-[0.95rem] font-medium text-slate-500 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-slate-700">
                Book now →
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-6 rounded-[28px] border border-emerald-200 bg-emerald-50/80 px-6 py-6">
          <h3 className="text-center text-[1rem] font-extrabold uppercase tracking-[0.18em] text-emerald-900">
            Free extras included
          </h3>

          <div className="mt-4 space-y-1.5 text-center text-[0.98rem] leading-7 text-emerald-950/85">
            {extrasRows.map((row) => (
              <p key={row}>{row}</p>
            ))}
          </div>
        </section>

        <section className="mt-6">
          <Link
            href="/find-my-booking"
            className="block rounded-[28px] border border-slate-200 bg-white px-6 py-4 text-center text-[1rem] font-extrabold uppercase tracking-[0.01em] text-slate-950 shadow-[0_3px_14px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
          >
            Find my booking
          </Link>
        </section>
      </div>
    </main>
  );
}