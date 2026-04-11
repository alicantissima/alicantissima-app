


"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMessages, normalizeLanguage } from "@/lib/i18n";
import { useBookingStore } from "@/store/bookingStore";
import { TIME_SLOTS } from "@/lib/time-slots";

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getSlotIndex(slot: string, slots: string[]) {
  return slots.indexOf(slot);
}

function BookLuggageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useBookingStore((state) => state.addItem);
  const clearItems = useBookingStore((state) => state.clearItems);

  const language = normalizeLanguage(searchParams.get("lang"));
  const t = getMessages(language);
  const timeSlots = TIME_SLOTS;

  const [date, setDate] = useState("");
  const [dropOff, setDropOff] = useState("");
  const [pickUp, setPickUp] = useState("");
  const [luggage, setLuggage] = useState(1);
  const [comments, setComments] = useState("");

  const availablePickUpSlots = useMemo(() => {
    if (!dropOff) return timeSlots;

    const dropOffIndex = timeSlots.indexOf(dropOff);
    if (dropOffIndex === -1) return timeSlots;

    return timeSlots.slice(dropOffIndex);
  }, [dropOff, timeSlots]);

  const unitPrice = 8;
  const totalPrice = luggage * unitPrice;

  const fieldClass =
    "mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-300 dark:bg-black dark:text-white dark:placeholder:text-zinc-400";
  const labelClass =
    "text-sm font-semibold text-zinc-900 dark:text-zinc-100";
  const mutedClass = "text-sm text-zinc-600 dark:text-zinc-300";
  const helpClass = "mt-1 text-xs text-zinc-500 dark:text-zinc-400";
  const qtyButtonClass =
    "rounded-xl border border-zinc-300 bg-white px-3 py-1 text-zinc-900 transition hover:bg-zinc-100 active:scale-[0.98] dark:border-zinc-300 dark:bg-black dark:text-white dark:hover:bg-zinc-900";
  const panelClass =
    "rounded-2xl border border-zinc-300 bg-white p-4 text-zinc-900 dark:border-zinc-300 dark:bg-black dark:text-white";
  const ctaClass =
    "w-full rounded-xl border border-zinc-900 bg-zinc-900 px-6 py-3 text-base font-semibold uppercase tracking-wide text-white transition hover:opacity-90 active:scale-[0.98] dark:border-[#AFC3BE] dark:bg-[#AFC3BE] dark:text-black";
  const backClass =
    "text-sm font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white";

  function handleAddToBooking() {
    if (!date) {
      alert(t.bookLuggageChooseDateAlert);
      return;
    }

    if (!dropOff) {
      alert(t.bookLuggageChooseDropOffAlert);
      return;
    }

    if (!pickUp) {
      alert(t.bookLuggageChoosePickUpAlert);
      return;
    }

    if (
      getSlotIndex(pickUp, timeSlots) < getSlotIndex(dropOff, timeSlots)
    ) {
      alert("Pick-up time must be after drop-off time.");
      return;
    }

    clearItems();

    addItem({
      productCode: "luggage",
      productName: t.bookLuggageProductName,
      quantity: luggage,
      date,
      dropOffTime: dropOff,
      pickUpTime: pickUp,
      comments: comments.trim() || undefined,
      unitPrice,
      totalPrice,
    });

    window.scrollTo({ top: 0, behavior: "auto" });

    const params = new URLSearchParams();
    params.set("lang", language);

    if (searchParams.get("source") === "walkin") {
      params.set("source", "walkin");
    }

    router.push(`/checkout?${params.toString()}`);
  }

  function handleBack() {
    router.back();
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 text-zinc-900 dark:text-white">
      <button type="button" onClick={handleBack} className={backClass}>
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold uppercase text-zinc-900 dark:text-white">
        {t.bookLuggageTitle}
      </h1>

      <p className={mutedClass}>{t.bookLuggageSubtitle}</p>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>{t.chooseDate}</label>
          <input
            type="date"
            min={getTodayString()}
            className={fieldClass}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className={labelClass}>{t.chooseDropOffTime}</label>
          <select
            className={fieldClass}
            value={dropOff}
            onChange={(e) => {
              const newDropOff = e.target.value;
              setDropOff(newDropOff);

              if (
                pickUp &&
                timeSlots.indexOf(pickUp) < timeSlots.indexOf(newDropOff)
              ) {
                setPickUp("");
              }
            }}
          >
            <option value="">Choose time</option>
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>{t.estimatedPickUpTime}</label>
          <select
            className={fieldClass}
            value={pickUp}
            onChange={(e) => setPickUp(e.target.value)}
          >
            <option value="">Choose time</option>
            {availablePickUpSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          <p className={helpClass}>{t.pickUpHelpText}</p>
        </div>

        <div>
          <label className={labelClass}>{t.numberOfLuggage}</label>

          <div className="mt-1 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLuggage(Math.max(1, luggage - 1))}
              className={qtyButtonClass}
            >
              -
            </button>

            <span className="text-lg font-medium text-zinc-900 dark:text-white">
              {luggage}
            </span>

            <button
              type="button"
              onClick={() => setLuggage(luggage + 1)}
              className={qtyButtonClass}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className={panelClass}>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {t.totalPrice}
        </p>
        <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-white">
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

export default function BookLuggagePage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md p-6">Loading...</main>}>
      <BookLuggageContent />
    </Suspense>
  );
}