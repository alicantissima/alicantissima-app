


"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { validatePartnerPromo } from "@/app/checkout/promo-actions";
import { calculateDiscount } from "@/lib/promotions";
import { getPromoMessages } from "@/lib/promo-messages";
import { submitCheckout as submitCheckoutAction } from "@/app/checkout/actions";
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

function formatCheckoutTime(value?: string | null) {
  if (!value) return "";

  return value
    .trim()
    .replace("H", "h")
    .replace("h", ":");
}

function getCheckoutShowerQuantity(item: {
  quantity?: number | string;
  productCode?: string;
  productName?: string;
  breakdown?: unknown;
}) {
  const breakdown = item.breakdown;

  if (Array.isArray(breakdown) && breakdown.length > 0) {
    let totalShowers = 0;

    breakdown.forEach((entry) => {
      if (!entry || typeof entry !== "object") return;

      const part = entry as {
        label?: unknown;
        quantity?: unknown;
      };

      const label = String(part.label || "").toLowerCase();

      if (
  label.includes("shower") ||
  label.includes("duche") ||
  label.includes("ducha") ||
  label.includes("douche") ||
  label.includes("doccia") ||
  label.includes("dusche") ||
  label.includes("prysznic") ||
  label.includes("zuhany") ||
  label.includes("suihku") ||
  label.includes("dusj")
) {
  totalShowers += Number(part.quantity || 0);
}
    });

    if (totalShowers > 0) return totalShowers;
  }

  return Number(item.quantity || 1);
}

function getCheckoutShowerTimeRange(params: {
  showerTime?: string | null;
  quantity: number;
}) {
  if (!params.showerTime) return "";

  const startTime = formatCheckoutTime(params.showerTime);
  const endTime = formatCheckoutTime(
    getShowerEndTime(params.showerTime, params.quantity)
  );

  return `${startTime} – ${endTime}`;
}

function labelLooksLikeShower(label: unknown) {
  const normalized = String(label || "").toLowerCase();

  return (
    normalized.includes("shower") ||
    normalized.includes("ducha") ||
    normalized.includes("duche") ||
    normalized.includes("douche") ||
    normalized.includes("doccia") ||
    normalized.includes("dusche")
  );
}

function formatCheckoutTimeRange(value?: string | null) {
  if (!value) return "";

  return value
    .trim()
    .replace(/H/g, "h")
    .replace(/h/g, ":")
    .replace(
      /(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})/,
      "$1:$2 – $3:$4"
    );
}

function getReservedForPeopleLabel(quantity: number) {
  return quantity === 1 ? "1 person" : `${quantity} people`;
}

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number } | null>(null);
  const [promoPending, setPromoPending] = useState(false);
  const [promoError, setPromoError] = useState(false);

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
  const promoText = getPromoMessages(language);

  const total = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  }, [items]);

  const discount = calculateDiscount(total, appliedPromo?.percent ?? 0);

  async function applyPromo() {
    setPromoPending(true);
    setPromoError(false);
    try {
      const result = await validatePartnerPromo(promoCode);
      if (result.ok) setAppliedPromo({ code: result.code, percent: result.percent });
      else { setAppliedPromo(null); setPromoError(true); }
    } catch { setAppliedPromo(null); setPromoError(true); }
    finally { setPromoPending(false); }
  }

  async function handleSubmit(formData: FormData) {
    if (pending || promoPending) return;
    if (source === "site" && promoCode.trim() && !appliedPromo) {
      setPromoError(true);
      return;
    }

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
      promoCode: source === "site" ? appliedPromo?.code : undefined,
      items: items.map((item) => {
  const quantity = Number(item.quantity || 1);
  const productType = item.productCode;
  const showerTime = item.showerTime ?? null;

  const showerQuantity = showerTime
    ? getCheckoutShowerQuantity(item)
    : quantity;

  const showerDurationMinutes = showerTime
    ? getShowerDurationMinutes(showerQuantity)
    : null;

  const showerEndTime = showerTime
    ? getShowerEndTime(showerTime, showerQuantity)
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
      showerQuantity,
      comments: item.comments ?? null,
      breakdown: item.breakdown ?? [],
    },
  };
}),
    };

    startTransition(async () => {
      const result = await submitCheckoutAction(payload);

      if (!result.ok) {
        setError(result.error ?? t.checkoutError);
        return;
      }

      if (result.checkoutUrl) {
  clearItems();

  try {
    if (window.top && window.top !== window.self) {
      window.top.location.href = result.checkoutUrl;
    } else {
      window.location.assign(result.checkoutUrl);
    }
  } catch {
    window.location.assign(result.checkoutUrl);
  }

  return;
}

if (result.bookingCode) {
  clearItems();

  const successParams = new URLSearchParams();
  successParams.set("code", result.bookingCode);
  successParams.set("lang", language);

  if (source === "walkin") {
    successParams.set("source", "walkin");
  }

  router.push(`/checkout/success?${successParams.toString()}`);
  return;
}

setError("Could not complete booking.");
    });
  }

  function handleBack() {
  clearItems();
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

        {source === "site" && (
          <div className="space-y-2">
            <label htmlFor="promoCode" className="block text-sm font-medium">{promoText.code}</label>
            <div className="flex gap-2">
              <input id="promoCode" value={promoCode} maxLength={40} autoCapitalize="characters" autoComplete="off"
                disabled={pending || promoPending}
                onChange={(event) => { setPromoCode(event.target.value.toUpperCase()); setAppliedPromo(null); setPromoError(false); }}
                className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-transparent px-3 py-2" />
              <button type="button" disabled={pending || promoPending || !promoCode.trim()} onClick={applyPromo}
                className="rounded-xl border border-zinc-300 px-4 py-2 disabled:opacity-50">{promoPending ? "…" : promoText.apply}</button>
            </div>
            <p aria-live="polite" className={promoError ? "text-sm text-red-600" : "text-sm text-green-600"}>
              {promoError ? promoText.invalid : appliedPromo ? `${appliedPromo.code}: ${promoText.discount} 15%` : ""}
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-400 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={pending || promoPending}
          aria-disabled={pending || promoPending}
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
                  {Array.isArray(item.breakdown) && item.breakdown.length > 0 ? (
  <div className="space-y-1">
    {item.breakdown.map((part, partIndex) => {
      const breakdownPart = part as {
        label?: string;
        quantity?: number;
      };

      return (
        <p
          key={partIndex}
          className="font-semibold text-zinc-900 dark:text-white"
        >
          {Number(breakdownPart.quantity || 0)} × {breakdownPart.label}
        </p>
      );
    })}
  </div>
) : (
  <p className="font-semibold text-zinc-900 dark:text-white">
    {item.quantity} × {item.productName}
  </p>
)}

                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    {t.dateLabel} {item.date}
                  </p>

                  {item.dropOffTime && (
  <p className="text-sm text-zinc-600 dark:text-zinc-300">
    {t.dropOffLabel} {formatCheckoutTimeRange(item.dropOffTime)}
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
        quantity: getCheckoutShowerQuantity(item),
      })}
    </p>

    <p className="text-sm text-zinc-600 dark:text-zinc-300">
      Duration: {getShowerDurationLabel(getCheckoutShowerQuantity(item))}
    </p>

    {item.showerQuantity ? (
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        Reserved for: {Number(item.showerQuantity)}{" "}
        {Number(item.showerQuantity) === 1 ? "person" : "people"}
      </p>
    ) : null}
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
          {appliedPromo && <div className="mb-3 text-sm">
            <p>{promoText.subtotal}: € {discount.subtotal.toFixed(2)}</p>
            <p className="text-green-600">{promoText.discount} ({appliedPromo.percent}%): −€ {discount.discountAmount.toFixed(2)}</p>
          </div>}
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {t.totalLabel}
          </p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white">
            € {discount.total.toFixed(2)}
          </p>
        </div>
      </aside>
    </div>
  );
}
