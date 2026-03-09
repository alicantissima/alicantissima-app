

import CheckoutClient from '@/components/checkout/CheckoutClient';

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-semibold">Checkout</h1>
      <CheckoutClient />
    </main>
  );
}