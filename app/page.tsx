


"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RecoveryRedirect from "@/components/recovery-redirect";


const extrasRows = [
  "Wi-Fi • Phone charging • WC • Sofa area",
  "Coffee • Cold water • Printer & scanner",
  "Luggage scale • Beach towels • Sun shade",
  "Hair dryer • Body gel • Shampoo • Shower towels",
  "Air conditioning everywhere",
];

type HomeClientProps = {
  forcedSource?: string;
};

export default function HomeClient({ forcedSource }: HomeClientProps) {
  const searchParams = useSearchParams();
  const urlSource = searchParams.get("source");
  const finalSource = forcedSource ?? urlSource ?? "";
  const sourceSuffix = finalSource ? `?source=${finalSource}` : "";

  const products = [
    {
      title: "Store luggage",
      price: "€8",
      subtitle: "Safe luggage storage",
      href: `/book-luggage${sourceSuffix}`,
      image: "/images/products/luggage.jpg",
    },
    {
      title: "Take a shower",
      price: "€12",
      subtitle: "Freshen up anytime",
      href: `/book-shower${sourceSuffix}`,
      image: "/images/products/shower.jpg",
    },
    {
      title: "Luggage + shower",
      price: "€18",
      subtitle: "Comfort and convenience",
      href: `/book-combo${sourceSuffix}`,
      image: "/images/products/combo.jpg",
    },
  ];

  return (
    <>
      <RecoveryRedirect />

      <main className="min-h-screen bg-[#f6f6f3] text-slate-900 dark:bg-black dark:text-white">
        <div className="mx-auto w-full max-w-[430px] px-4 pb-8 pt-5">
          <section className="px-2 pb-1 pt-3 text-center">
            <h1 className="text-[1.9rem] font-extrabold uppercase tracking-[-0.045em] text-slate-950 dark:text-white">
              Alicantissima
            </h1>

            <p className="mt-1.5 text-[0.93rem] font-medium text-slate-600 dark:text-zinc-300">
              Luggage Storage &amp; Shower Lounge
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full bg-white px-3 py-1.5 text-[0.84rem] font-medium text-slate-700 ring-1 ring-slate-200/90 dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-700">
                ⭐ 4.9 rating
              </span>

              <span className="rounded-full bg-white px-3 py-1.5 text-[0.84rem] font-medium text-slate-700 ring-1 ring-slate-200/90 dark:bg-zinc-950 dark:text-zinc-200 dark:ring-zinc-700">
                📍 Alicante city center
              </span>

              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[0.84rem] font-medium text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800">
                🟢 Open every day · 10:00–22:00
              </span>
            </div>
          </section>

          <section className="mt-5 space-y-4">
            {products.map((product) => (
              <Link
                key={product.title}
                href={product.href}
                className="group relative block overflow-hidden rounded-[30px] shadow-[0_10px_28px_rgba(15,23,42,0.10)]"
              >
                <div className="relative h-[220px] w-full">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/8 to-transparent" />
                  <div className="absolute inset-0 bg-black/8" />

                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="flex items-end justify-between gap-3">
                      <div className="max-w-[68%]">
                        <h2 className="text-[1rem] font-semibold tracking-[-0.015em] text-white">
                          {product.title}
                        </h2>

                        <p className="mt-1 text-[0.8rem] font-normal text-white/85">
                          {product.subtitle}
                        </p>

                        <div className="mt-2.5 text-[0.82rem] font-medium text-white/90">
                          Book now →
                        </div>
                      </div>

                      <div className="shrink-0 rounded-full bg-white/92 px-4 py-2 text-[0.92rem] font-semibold text-slate-950 shadow-[0_4px_16px_rgba(15,23,42,0.12)] backdrop-blur-md dark:bg-[#AFC3BE] dark:text-black">
                        {product.price}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </section>

          <section className="mt-5 rounded-[30px] border border-emerald-200/90 bg-[#eef8f2] px-5 py-6 shadow-[0_4px_18px_rgba(16,24,40,0.04)] dark:border-emerald-800 dark:bg-emerald-950/25">
            <h3 className="text-center text-[0.92rem] font-extrabold uppercase tracking-[0.22em] text-emerald-900 dark:text-emerald-300">
              Free extras included
            </h3>

            <div className="mt-4 space-y-2 text-center text-[0.93rem] leading-7 text-emerald-950/85 dark:text-emerald-100/90">
              {extrasRows.map((row) => (
                <p key={row}>{row}</p>
              ))}
            </div>
          </section>

          <section className="mt-5">
            <Link
              href="/find-my-booking"
              className="block rounded-[30px] bg-white px-6 py-4 text-center text-[0.96rem] font-bold uppercase tracking-[0.02em] text-slate-950 ring-1 ring-slate-200 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition hover:opacity-95 dark:bg-zinc-950 dark:text-white dark:ring-zinc-700"
            >
              Find my booking
            </Link>
          </section>
        </div>
      </main>
    </>
  );
}