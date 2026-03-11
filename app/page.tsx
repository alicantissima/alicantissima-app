


"use client";

import Link from "next/link";

const products = [
  {
    title: "Store luggage",
    price: "€8",
    subtitle: "Safe luggage storage",
    href: "/book-luggage",
    image: "/images/products/luggage.jpg",
  },
  {
    title: "Take a shower",
    price: "€12",
    subtitle: "Freshen up anytime",
    href: "/book-shower",
    image: "/images/products/shower.jpg",
  },
  {
    title: "Luggage + shower",
    price: "€18",
    subtitle: "Comfort and convenience",
    href: "/book-combo",
    image: "/images/products/combo.jpg",
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
    <main className="min-h-screen bg-[#f7f7f5] text-slate-900">
      <div className="mx-auto w-full max-w-[430px] px-4 pb-8 pt-5">
        <section className="px-2 pb-2 pt-3 text-center">
          <h1 className="text-[2.1rem] font-extrabold uppercase tracking-[-0.04em] text-slate-950">
            Alicantissima
          </h1>

          <p className="mt-2 text-[1rem] font-medium text-slate-700">
            Luggage Storage &amp; Shower Lounge
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-[0.92rem] font-medium text-slate-700 ring-1 ring-slate-200">
              ⭐ 4.9 rating
            </span>
            <span className="rounded-full bg-white/90 px-3 py-1.5 text-[0.92rem] font-medium text-slate-700 ring-1 ring-slate-200">
              📍 Alicante city center
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[0.92rem] font-medium text-emerald-700 ring-1 ring-emerald-200">
              🟢 Open daily · 10:00–22:00
            </span>
          </div>
        </section>

        <section className="mt-5 space-y-4">
          {products.map((product) => (
            <Link
              key={product.title}
              href={product.href}
              className="group relative block overflow-hidden rounded-[28px] bg-white shadow-[0_6px_24px_rgba(15,23,42,0.08)]"
            >
              <div className="relative h-[220px] w-full">
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <h2 className="text-[1.35rem] font-bold tracking-[-0.02em] text-white">
                        {product.title}
                      </h2>
                      <p className="mt-1 text-[0.95rem] text-white/85">
                        {product.subtitle}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-full bg-white/92 px-4 py-2 text-[1rem] font-semibold text-slate-950 shadow-sm backdrop-blur-sm">
                      {product.price}
                    </div>
                  </div>

                  <div className="mt-3 text-[0.95rem] font-medium text-white/90">
                    Book now →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>

        <section className="mt-5 rounded-[28px] border border-emerald-200 bg-emerald-50/70 px-5 py-6">
          <h3 className="text-center text-[1rem] font-extrabold uppercase tracking-[0.18em] text-emerald-900">
            Free extras included
          </h3>

          <div className="mt-4 space-y-2 text-center text-[0.98rem] leading-7 text-emerald-950/85">
            {extrasRows.map((row) => (
              <p key={row}>{row}</p>
            ))}
          </div>
        </section>

        <section className="mt-5">
          <Link
            href="/find-my-booking"
            className="block rounded-[28px] bg-white px-6 py-4 text-center text-[1rem] font-extrabold uppercase tracking-[0.01em] text-slate-950 ring-1 ring-slate-200 shadow-[0_4px_16px_rgba(15,23,42,0.05)]"
          >
            Find my booking
          </Link>
        </section>
      </div>
    </main>
  );
}