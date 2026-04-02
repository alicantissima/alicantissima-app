


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
  const source = searchParams.get("source") === "walkin" ? "walkin" : "";
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

  const fieldClass =
    "mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-300 dark:bg-black dark:text-white dark:placeholder:text-zinc-400";
  const labelClass =
    "text-sm font-semibold text-zinc-900 dark:text-zinc-100";
  const mutedClass = "text-sm text-zinc-600 dark:text-zinc-300";
  const helpClass = "mt-1 text-xs text-zinc-500 dark:text-zinc-400";
  const qtyButtonClass =
    "rounded-xl border border-zinc-300 bg-white px-3 py-1 text-zinc-900 transition hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-300 dark:bg-black dark:text-white dark:hover:bg-zinc-900";
  const boxClass =
    "space-y-3 rounded-2xl border border-zinc-300 bg-white p-4 text-zinc-900 dark:border-zinc-300 dark:bg-black dark:text-white";
  const ctaClass =
    "w-full rounded-xl border border-zinc-900 bg-zinc-900 px-6 py-3 text-base font-semibold uppercase tracking-wide text-white transition hover:opacity-90 active:scale-[0.98] dark:border-[#AFC3BE] dark:bg-[#AFC3BE] dark:text-black";
  const backClass =
    "text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white";

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

    const params = new URLSearchParams();
    params.set("lang", language);

    if (source === "walkin") {
      params.set("source", "walkin");
    }

    router.push(`/checkout?${params.toString()}`);
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
    <main className="mx-auto max-w-md space-y-6 p-6 text-zinc-900 dark:text-white">
      <button
        onClick={() => router.push(`/?lang=${language}`)}
        className={backClass}
      >
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold uppercase text-zinc-900 dark:text-white">
        {t.bookComboTitle}
      </h1>

      <p className={mutedClass}>{t.bookComboSubtitle}</p>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>{t.chooseComboDate}</label>
          <input
            type="date"
            min={getTodayString()}
            className={fieldClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>{t.chooseLuggageDropOffTime}</label>
          <select
            className={fieldClass}
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
          <label className={labelClass}>{t.chooseApproxShowerTime}</label>
          <select
            className={fieldClass}
            value={showerTime}
            onChange={(e) => setShowerTime(e.target.value)}
          >
            {showerTimeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          <p className={helpClass}>{t.comboShowerHelpText}</p>
        </div>

        <div className={boxClass}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {t.comboMainLabel}
              </p>
              <p className={mutedClass}>{t.comboMainPriceLabel}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => decrease(comboQty, setComboQty, 1)}
                className={qtyButtonClass}
              >
                -
              </button>
              <span className="min-w-[1.5rem] text-center text-lg font-medium text-zinc-900 dark:text-white">
                {comboQty}
              </span>
              <button
                type="button"
                onClick={() => increase(comboQty, setComboQty)}
                className={qtyButtonClass}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className={boxClass}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {t.comboExtraLuggageLabel}
              </p>
              <p className={mutedClass}>{t.comboExtraLuggagePriceLabel}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => decrease(extraLuggageQty, setExtraLuggageQty)}
                className={qtyButtonClass}
              >
                -
              </button>
              <span className="min-w-[1.5rem] text-center text-lg font-medium text-zinc-900 dark:text-white">
                {extraLuggageQty}
              </span>
              <button
                type="button"
                onClick={() => increase(extraLuggageQty, setExtraLuggageQty)}
                className={qtyButtonClass}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className={boxClass}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {t.comboExtraShowerLabel}
              </p>
              <p className={mutedClass}>{t.comboExtraShowerPriceLabel}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => decrease(extraShowerQty, setExtraShowerQty)}
                className={qtyButtonClass}
              >
                -
              </button>
              <span className="min-w-[1.5rem] text-center text-lg font-medium text-zinc-900 dark:text-white">
                {extraShowerQty}
              </span>
              <button
                type="button"
                onClick={() => increase(extraShowerQty, setExtraShowerQty)}
                className={qtyButtonClass}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={boxClass}>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {t.totalPrice}
        </p>
        <p className="text-2xl font-bold text-zinc-900 dark:text-white">
          € {totalPrice}
        </p>
      </div>

      <button type="button" onClick={handleAddToBooking} className={ctaClass}>
        {t.bookNow}
      </button>

      <div>
        <label className={labelClass}>{t.commentsOptional}</label>
        <textarea
          className={fieldClass}
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