


"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { submitCheckout } from "@/app/checkout/actions";
import { getMessages, normalizeLanguage } from "@/lib/i18n";
import { useBookingStore } from "@/store/bookingStore";
import {
  getShowerDurationMinutes,
  getShowerEndTime,
} from "@/lib/showers";

function getShowerDurationLabel(quantity: number) {
  const minutes = getShowerDurationMinutes(quantity);

  if (minutes === 60) return "1 hour";

  return `${minutes} minutes`;
}

function getCheckoutShowerTimeRange(params: {
  showerTime?: string | null;
  quantity: number;
}) {
  if (!params.showerTime) return "";

  const endTime = getShowerEndTime(params.showerTime, params.quantity);

  return `${params.showerTime}-${endTime}`;
}

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
      items: items.map((item) => {
  const quantity = Number(item.quantity || 1);
  const productType = item.productCode;
  const showerTime = item.showerTime ?? null;

  const showerDurationMinutes = showerTime
    ? getShowerDurationMinutes(quantity)
    : null;

  const showerEndTime = showerTime
    ? getShowerEndTime(showerTime, quantity)
    : null;

  return {
    id: item.productCode,
    title: item.productName,
    quantity,
    unitPrice:
      item.quantity && Number(item.quantity) > 0
        ? Number(item.totalPrice) / Number(item.quantity)
        : Number(item.totalPrice),
    totalPrice: Number(item.totalPrice),
    productType,
    meta: {
      date: item.date,
      dropOffTime: item.dropOffTime ?? null,
      pickUpTime: item.pickUpTime ?? null,
      showerTime,
      showerEndTime,
      showerDurationMinutes,
      comments: item.comments ?? null,
      breakdown: item.breakdown ?? [],
    },
  };
}),
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
      <div className="rounded-2xl border border-zinc-300 bg-white p-6 text-zinc-900 dark:border-zinc-300 dark:bg-black dark:text-white">
        <p className="font-semibold">{t.checkoutEmpty}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      <form
        action={handleSubmit}
        className="space-y-4 rounded-2xl border border-zinc-300 bg-white p-6 text-zinc-900 dark:border-zinc-300 dark:bg-black dark:text-white"
      >
        <button
          type="button"
          onClick={handleBack}
          className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
        >
          ← {t.backToProductMenu}
        </button>

        <div>
          <label
            htmlFor="customerName"
            className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            {t.nameLabel}
          </label>
          <input
            id="customerName"
            name="customerName"
            required
            disabled={pending}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 dark:border-zinc-300 dark:bg-black dark:text-white dark:placeholder:text-zinc-400"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="city"
            className="text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            {t.cityLabel}
          </label>

          <input
            id="city"
            type="text"
            name="city"
            placeholder={t.cityPlaceholder}
            disabled={pending}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 dark:border-zinc-300 dark:bg-black dark:text-white dark:placeholder:text-zinc-400"
          />
        </div>

        <div>
          <label
            htmlFor="customerEmail"
            className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            {t.email}
          </label>
          <input
            id="customerEmail"
            name="customerEmail"
            type="email"
            required
            disabled={pending}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 dark:border-zinc-300 dark:bg-black dark:text-white dark:placeholder:text-zinc-400"
          />
        </div>

        <div>
          <label
            htmlFor="customerPhone"
            className="mb-1 block text-sm font-medium text-zinc-900 dark:text-zinc-100"
          >
            {t.phone}
          </label>
          <input
            id="customerPhone"
            name="customerPhone"
            disabled={pending}
            className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60 dark:border-zinc-300 dark:bg-black dark:text-white dark:placeholder:text-zinc-400"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          aria-disabled={pending}
          className="w-full rounded-xl border border-zinc-900 bg-zinc-900 px-6 py-3 text-base font-semibold uppercase tracking-wide text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#AFC3BE] dark:bg-[#AFC3BE] dark:text-black"
        >
          {pending ? t.creatingBooking : t.createBooking}
        </button>
      </form>

      <aside className="rounded-2xl border border-zinc-300 bg-white p-6 text-zinc-900 dark:border-zinc-300 dark:bg-black dark:text-white">
        <h2 className="mb-4 text-xl font-bold text-zinc-900 dark:text-white">
          {t.bookingSummary}
        </h2>

        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="border-b border-zinc-300 pb-3 last:border-b-0"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">
                    {item.quantity} × {item.productName}
                  </p>

                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {t.dateLabel} {item.date}
                  </p>

                  {item.dropOffTime && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {t.dropOffLabel} {item.dropOffTime}
                    </p>
                  )}

                  {item.pickUpTime && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {t.estimatedPickUpLabel} {item.pickUpTime}
                    </p>
                  )}

                  {item.showerTime && (
  <>
    <p className="text-sm text-zinc-600 dark:text-zinc-300">
      {t.showerTimeLabel}{" "}
      {getCheckoutShowerTimeRange({
        showerTime: item.showerTime,
        quantity: Number(item.quantity || 1),
      })}
    </p>

    <p className="text-sm text-zinc-600 dark:text-zinc-300">
      Duration: {getShowerDurationLabel(Number(item.quantity || 1))}
    </p>
  </>
)}

                  {item.comments && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      {t.commentsOptional} {item.comments}
                    </p>
                  )}
                </div>

                <div className="font-semibold text-zinc-900 dark:text-white">
                  € {Number(item.totalPrice).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 border-t border-zinc-300 pt-4">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {t.totalLabel}
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            € {total.toFixed(2)}
          </p>
        </div>
      </aside>
    </div>
  );
}