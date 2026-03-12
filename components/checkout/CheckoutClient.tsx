


"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "@/store/bookingStore";
import { submitCheckout } from "@/app/checkout/actions";

export default function CheckoutClient() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const items = useBookingStore((state) => state.items);
  const clearItems = useBookingStore((state) => state.clearItems);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  }, [items]);

  async function handleSubmit(formData: FormData) {
    if (pending) return;

    setError(null);

    const city = String(formData.get("city") || "");

    const payload = {
      customerName: String(formData.get("customerName") || ""),
      customerCity: city,
      customerEmail: String(formData.get("customerEmail") || ""),
      customerPhone: String(formData.get("customerPhone") || ""),
      notes: "",
      items: items.map((item) => ({
        id: item.productCode,
        title: item.productName,
        quantity: Number(item.quantity || 1),
        unitPrice:
          item.quantity && Number(item.quantity) > 0
            ? Number(item.totalPrice) / Number(item.quantity)
            : Number(item.totalPrice),
        totalPrice: Number(item.totalPrice),
        productType: "booking",
        meta: {
          date: item.date,
          dropOffTime: item.dropOffTime ?? null,
          pickUpTime: item.pickUpTime ?? null,
          showerTime: item.showerTime ?? null,
          comments: item.comments ?? null,
          breakdown: item.breakdown ?? [],
        },
      })),
    };

    startTransition(async () => {
      const result = await submitCheckout(payload);

      if (!result.ok) {
        setError(result.error ?? "Ocorreu um erro no checkout.");
        return;
      }

      clearItems();
      router.push(`/checkout/success?code=${result.bookingCode}`);
    });
  }

  function handleBack() {
    router.back();
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border p-6">
        <p className="font-semibold">Your booking is empty.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      <form action={handleSubmit} className="space-y-4 rounded-2xl border p-6">
        <button
          type="button"
          onClick={handleBack}
          className="text-sm font-medium text-gray-600 hover:text-black"
        >
          ← Back to product menu
        </button>

        <div>
          <label htmlFor="customerName" className="mb-1 block text-sm font-medium">
            Name
          </label>
          <input
            id="customerName"
            name="customerName"
            required
            disabled={pending}
            className="w-full rounded-xl border px-3 py-2 disabled:opacity-60"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="city" className="text-sm font-medium">
            City (where you are from)
          </label>

          <input
            id="city"
            type="text"
            name="city"
            placeholder="London, Berlin, Madrid..."
            disabled={pending}
            className="w-full rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="customerEmail" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            required
            disabled={pending}
            className="w-full rounded-xl border px-3 py-2 disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="customerPhone" className="mb-1 block text-sm font-medium">
            Phone
          </label>
          <input
            id="customerPhone"
            name="customerPhone"
            disabled={pending}
            className="w-full rounded-xl border px-3 py-2 disabled:opacity-60"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="mt-2 w-full rounded-[28px] border border-black bg-black px-6 py-5 text-center text-2xl font-bold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating booking..." : "Create booking"}
        </button>
      </form>

      <aside className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-bold">Booking summary</h2>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border-b pb-3 last:border-b-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {item.quantity} × {item.productName}
                  </p>

                  <p className="text-sm text-gray-600">Date: {item.date}</p>

                  {item.dropOffTime && (
                    <p className="text-sm text-gray-600">
                      Drop-off: {item.dropOffTime}
                    </p>
                  )}

                  {item.pickUpTime && (
                    <p className="text-sm text-gray-600">
                      Estimated pick-up: {item.pickUpTime}
                    </p>
                  )}

                  {item.showerTime && (
                    <p className="text-sm text-gray-600">
                      Shower time: {item.showerTime}
                    </p>
                  )}

                  {item.comments && (
                    <p className="text-sm text-gray-600">
                      Comments: {item.comments}
                    </p>
                  )}
                </div>

                <div className="font-semibold">
                  € {Number(item.totalPrice).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t pt-4">
          <p className="text-sm font-semibold">Total</p>
          <p className="text-2xl font-bold">€ {total.toFixed(2)}</p>
        </div>
      </aside>
    </div>
  );
}