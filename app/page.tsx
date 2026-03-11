

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: number;
  code: string;
  name: string;
  description: string;
  price: number;
  is_popular: boolean;
  sort_order: number;
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("id, code, name, description, price, is_popular, sort_order")
        .eq("city_id", 1)
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error loading products:", error.message);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    }

    loadProducts();
  }, []);

  function getHref(code: string) {
    if (code === "luggage") return "/book-luggage";
    if (code === "shower") return "/book-shower";
    if (code === "combo") return "/book-combo";
    return "/";
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <section className="text-center space-y-2">
        <h1 className="text-3xl font-bold uppercase">Alicantissima</h1>
        <p className="text-base">Luggage Storage & Shower Lounge</p>
        <p className="text-sm">⭐ 4.9 rating</p>
        <p className="text-sm">📍 Premium location – Alicante city center</p>
        <p className="text-sm">🟢 Open every day · 10:00–22:00</p>
      </section>

      <section className="space-y-8">
  <div className="space-y-3">
    {loading ? (
      <div className="rounded-3xl border border-black bg-white p-4 text-sm text-gray-600 shadow-sm">
        Loading services...
      </div>
    ) : (
      products.map((product) => (
        <Link
          key={product.id}
          href={getHref(product.code)}
          className="block rounded-3xl border border-black bg-white p-5 shadow-sm transition hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="font-semibold uppercase tracking-wide">
              {product.name}
                      </div>

            <div className="rounded-full border border-black px-3 py-1 text-sm font-bold">
              € {product.price}
            </div>
          </div>

          <div className="mt-2 text-sm leading-relaxed text-gray-600">
            {product.description}
          </div>
        </Link>
      ))
    )}
  </div>

  <section className="space-y-2 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-900">
      Free extras included
    </p>
    <p className="text-sm leading-relaxed text-emerald-950">
      Wi-Fi · Phone charging · WC · Sofas areas · Coffee · Cold water · Printer & scanner · Luggage scale · Beach towels · Sun shade · Hair dryer · Body gel · Shampoo · Shower towels · Air conditioned everywhere
    </p>
    <Link href="/extras" className="inline-block text-sm font-semibold text-emerald-900">
      WHAT&apos;S INCLUDED 🧞‍♂️
    </Link>
  </section>

  <section className="rounded-3xl border border-sky-200 bg-sky-50 p-5">
    <Link href="/extras" className="block space-y-1">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-800">
        Explore Alicante
      </div>
      <div className="text-sm leading-relaxed text-sky-950">
        Restaurants · Activities · Beaches · Events
      </div>
    </Link>
  </section>
  </section>
      <Link
        href="/find-booking"
        className="block rounded-2xl border p-4 text-center font-semibold uppercase"
      >
        FIND MY BOOKING
      </Link>
    </main>
  );
}