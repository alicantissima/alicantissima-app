


"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingStore } from "../../store/bookingStore";
import { getMessages, normalizeLanguage } from "@/lib/i18n";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function generateTimeSlots(startHour: number, endHour: number) {
  const slots: string[] = [];

  for (let hour = startHour; hour < endHour; hour++) {
    for (const minute of [0, 30]) {
      const startH = hour;
      const startM = minute;

      let endH = hour;
      let endM = minute + 30;

      if (endM === 60) {
        endH += 1;
        endM = 0;
      }

      const start = `${pad(startH)}h${pad(startM)}`;
      const end = `${pad(endH)}h${pad(endM)}`;

      slots.push(`${start}-${end}`);
    }
  }

  return slots;
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  return `${year}-${month}-${day}`;
}

function BookComboContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useBookingStore((state) => state.addItem);

  const language = normalizeLanguage(searchParams.get("lang"));
  const t = getMessages(language);

  const luggageTimeSlots = useMemo(() => generateTimeSlots(10, 20), []);
  const showerTimeSlots = useMemo(() => generateTimeSlots(10, 20), []);

  const [date, setDate] = useState("");
  const [dropOffTime, setDropOffTime] = useState(luggageTimeSlots[0] ?? "");
  const [showerTime, setShowerTime] = useState(showerTimeSlots[0] ?? "");

  const [comboQty, setComboQty] = useState(1);
  const [extraLuggageQty, setExtraLuggageQty] = useState(0);
  const [extraShowerQty, setExtraShowerQty] = useState(0);

  const [comments, setComments] = useState("");

  const comboPrice = 18;
  const extraLuggagePrice = 8;
  const extraShowerPrice = 12;

  const totalPrice =
    comboQty * comboPrice +
    extraLuggageQty * extraLuggagePrice +
    extraShowerQty * extraShowerPrice;

  function handleAddToBooking() {
    if (!date) {
      alert(t.bookComboChooseDateAlert);
      return;
    }

    if (!dropOffTime) {
      alert(t.bookComboChooseDropOffAlert);
      return;
    }

    if (!showerTime) {
      alert(t.bookComboChooseShowerAlert);
      return;
    }

    addItem({
      productCode: "combo",
      productName: t.bookComboProductName,
      quantity: comboQty,
      date,
      dropOffTime,
      showerTime,
      comments: comments.trim() || undefined,
      unitPrice: comboPrice,
      totalPrice,
      breakdown: [
        {
          label: t.comboBreakdownMainLabel,
          quantity: comboQty,
          unitPrice: comboPrice,
          totalPrice: comboQty * comboPrice,
        },
        {
          label: t.comboBreakdownExtraLuggageLabel,
          quantity: extraLuggageQty,
          unitPrice: extraLuggagePrice,
          totalPrice: extraLuggageQty * extraLuggagePrice,
        },
        {
          label: t.comboBreakdownExtraShowerLabel,
          quantity: extraShowerQty,
          unitPrice: extraShowerPrice,
          totalPrice: extraShowerQty * extraShowerPrice,
        },
      ].filter((item) => item.quantity > 0),
    });

    window.scrollTo({ top: 0, behavior: "auto" });
    router.push(`/checkout?lang=${language}`);
  }

  function decrease(
    value: number,
    setter: (value: number) => void,
    min = 0
  ) {
    setter(Math.max(min, value - 1));
  }

  function increase(value: number, setter: (value: number) => void) {
    setter(value + 1);
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <button
        onClick={() => router.push(`/?lang=${language}`)}
        className="text-sm text-gray-600 hover:text-black"
      >
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold uppercase">{t.bookComboTitle}</h1>

      <p className="text-sm text-gray-600">{t.bookComboSubtitle}</p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold">{t.chooseComboDate}</label>
          <input
            type="date"
            min={getTodayString()}
            className="mt-1 w-full rounded border p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold">
            {t.chooseLuggageDropOffTime}
          </label>
          <select
            className="mt-1 w-full rounded border p-2"
            value={dropOffTime}
            onChange={(e) => setDropOffTime(e.target.value)}
          >
            {luggageTimeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">
            {t.chooseApproxShowerTime}
          </label>
          <select
            className="mt-1 w-full rounded border p-2"
            value={showerTime}
            onChange={(e) => setShowerTime(e.target.value)}
          >
            {showerTimeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">{t.comboShowerHelpText}</p>
        </div>

        <div className="space-y-3 rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{t.comboMainLabel}</p>
              <p className="text-sm text-gray-600">{t.comboMainPriceLabel}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => decrease(comboQty, setComboQty, 1)}
                className="rounded border px-3 py-1"
              >
                -
              </button>
              <span>{comboQty}</span>
              <button
                type="button"
                onClick={() => increase(comboQty, setComboQty)}
                className="rounded border px-3 py-1"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{t.comboExtraLuggageLabel}</p>
              <p className="text-sm text-gray-600">
                {t.comboExtraLuggagePriceLabel}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => decrease(extraLuggageQty, setExtraLuggageQty)}
                className="rounded border px-3 py-1"
              >
                -
              </button>
              <span>{extraLuggageQty}</span>
              <button
                type="button"
                onClick={() => increase(extraLuggageQty, setExtraLuggageQty)}
                className="rounded border px-3 py-1"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{t.comboExtraShowerLabel}</p>
              <p className="text-sm text-gray-600">
                {t.comboExtraShowerPriceLabel}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => decrease(extraShowerQty, setExtraShowerQty)}
                className="rounded border px-3 py-1"
              >
                -
              </button>
              <span>{extraShowerQty}</span>
              <button
                type="button"
                onClick={() => increase(extraShowerQty, setExtraShowerQty)}
                className="rounded border px-3 py-1"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-2xl border p-4">
        <p className="text-sm font-semibold">{t.totalPrice}</p>
        <p className="text-2xl font-bold">€ {totalPrice}</p>
      </div>

      <button
        type="button"
        onClick={handleAddToBooking}
        className="w-full rounded-xl border border-black bg-black px-6 py-3 text-base font-semibold uppercase tracking-wide text-white transition hover:opacity-90 active:scale-[0.98]"
      >
        {t.bookNow}
      </button>

      <div>
        <label className="text-sm font-semibold">{t.commentsOptional}</label>
        <textarea
          className="mt-1 w-full rounded border p-2"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>
    </main>
  );
}

export default function BookComboPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md p-6" />}>
      <BookComboContent />
    </Suspense>
  );
}