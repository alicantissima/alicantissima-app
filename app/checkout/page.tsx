


import { Suspense } from "react";
import CheckoutClient from "@/components/checkout/CheckoutClient";
import { getBookingPaymentMode } from "@/lib/booking-payment-mode";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const mode = await getBookingPaymentMode();
  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6">
      <Suspense fallback={<div className="rounded-2xl border p-6">Loading checkout...</div>}>
        <CheckoutClient payOnArrival={mode === "on_arrival"} />
      </Suspense>
    </main>
  );
}