


import { Suspense } from "react";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <Suspense fallback={<div className="rounded-2xl border p-6">Loading checkout...</div>}>
        <CheckoutClient />
      </Suspense>
    </main>
  );
}