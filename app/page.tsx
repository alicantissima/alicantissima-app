

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

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border p-4 text-sm text-gray-600">
            Loading services...
          </div>
        ) : (
          products.map((product) => (
            <Link
              key={product.id}
              href={getHref(product.code)}
              className="block rounded-2xl border p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="font-semibold uppercase">
                  {product.name}
                  {product.is_popular ? " ★ Popular" : ""}
                </div>
                <div className="text-sm font-bold">€ {product.price}</div>
              </div>

              <div className="mt-1 text-sm text-gray-600">
                {product.description}
              </div>
            </Link>
          ))
        )}

        <Link href="/extras" className="block rounded-2xl border p-4">
          <div className="font-semibold uppercase">Explore Alicante</div>
          <div className="mt-1 text-sm text-gray-600">
            Restaurants · Activities · Beaches · Events
          </div>
        </Link>
      </section>

      <section className="rounded-2xl border p-4 space-y-2">
        <p className="font-semibold uppercase">Free extras included</p>
        <p className="text-sm text-gray-600">
          Wi-Fi · Coffee · Cold water · Phone charging · Beach towels
        </p>
        <Link href="/extras" className="text-sm font-semibold">
          WHAT&apos;S INCLUDED 🧞‍♂️
        </Link>
      </section>

      <Link
        href="/my-booking"
        className="block rounded-2xl border p-4 text-center font-semibold uppercase"
      >
        My Booking
      </Link>
    </main>
  );
}