


"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitCheckout } from "@/app/checkout/actions";
import { getMessages, normalizeLanguage } from "@/lib/i18n";
import { useBookingStore } from "@/store/bookingStore";

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const items = useBookingStore((state) => state.items);
  const clearItems = useBookingStore((state) => state.clearItems);

  const language = useMemo(() => {
    return normalizeLanguage(searchParams.get("lang"));
  }, [searchParams]);

  const source = useMemo(() => {
    return searchParams.get("source") === "walkin" ? "walkin" : "site";
  }, [searchParams]);

  const t = getMessages(language);

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
  language,
  source,
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
        setError(result.error ?? t.checkoutError);
        return;
      }

      clearItems();

      const successParams = new URLSearchParams();
      successParams.set("code", result.bookingCode);
      successParams.set("lang", language);

      if (source === "walkin") {
        successParams.set("source", "walkin");
      }

      router.push(`/checkout/success?${successParams.toString()}`);
    });
  }

  function handleBack() {
    router.back();
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl border p-6">
        <p className="font-semibold">{t.checkoutEmpty}</p>
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
          ← {t.backToProductMenu}
        </button>

        <div>
          <label htmlFor="customerName" className="mb-1 block text-sm font-medium">
            {t.nameLabel}
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
            {t.cityLabel}
          </label>

          <input
            id="city"
            type="text"
            name="city"
            placeholder={t.cityPlaceholder}
            disabled={pending}
            className="w-full rounded-xl border px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="customerEmail" className="mb-1 block text-sm font-medium">
            {t.email}
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
            {t.phone}
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
          className="w-full rounded-xl border border-black bg-black px-6 py-3 text-base font-semibold uppercase tracking-wide text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t.creatingBooking : t.createBooking}
        </button>
      </form>

      <aside className="rounded-2xl border p-6">
        <h2 className="mb-4 text-xl font-bold">{t.bookingSummary}</h2>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border-b pb-3 last:border-b-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {item.quantity} × {item.productName}
                  </p>

                  <p className="text-sm text-gray-600">
                    {t.dateLabel} {item.date}
                  </p>

                  {item.dropOffTime && (
                    <p className="text-sm text-gray-600">
                      {t.dropOffLabel} {item.dropOffTime}
                    </p>
                  )}

                  {item.pickUpTime && (
                    <p className="text-sm text-gray-600">
                      {t.estimatedPickUpLabel} {item.pickUpTime}
                    </p>
                  )}

                  {item.showerTime && (
                    <p className="text-sm text-gray-600">
                      {t.showerTimeLabel} {item.showerTime}
                    </p>
                  )}

                  {item.comments && (
                    <p className="text-sm text-gray-600">
                      {t.commentsOptional} {item.comments}
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
          <p className="text-sm font-semibold">{t.totalLabel}</p>
          <p className="text-2xl font-bold">€ {total.toFixed(2)}</p>
        </div>
      </aside>
    </div>
  );
}