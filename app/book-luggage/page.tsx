


"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMessages, normalizeLanguage } from "@/lib/i18n";
import { useBookingStore } from "@/store/bookingStore";

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

export default function BookLuggagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useBookingStore((state) => state.addItem);
  const clearItems = useBookingStore((state) => state.clearItems);

  const language = useMemo(() => {
    return normalizeLanguage(searchParams.get("lang"));
  }, [searchParams]);

  const t = getMessages(language);
  const timeSlots = useMemo(() => generateTimeSlots(10, 20), []);

  const [date, setDate] = useState("");
  const [dropOff, setDropOff] = useState(timeSlots[0] ?? "");
  const [pickUp, setPickUp] = useState(timeSlots[0] ?? "");
  const [luggage, setLuggage] = useState(1);
  const [comments, setComments] = useState("");

  const unitPrice = 8;
  const totalPrice = luggage * unitPrice;

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
    router.push(`/checkout?lang=${language}`);
  }

  function handleBack() {
    router.back();
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <button
        type="button"
        onClick={handleBack}
        className="text-sm text-gray-600 hover:text-black"
      >
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold uppercase">{t.bookLuggageTitle}</h1>

      <p className="text-sm text-gray-600">{t.bookLuggageSubtitle}</p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold">{t.chooseDate}</label>
          <input
            type="date"
            min={getTodayString()}
            className="mt-1 w-full rounded border p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold">{t.chooseDropOffTime}</label>
          <select
            className="mt-1 w-full rounded border p-2"
            value={dropOff}
            onChange={(e) => setDropOff(e.target.value)}
          >
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">{t.estimatedPickUpTime}</label>
          <select
            className="mt-1 w-full rounded border p-2"
            value={pickUp}
            onChange={(e) => setPickUp(e.target.value)}
          >
            {timeSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">{t.pickUpHelpText}</p>
        </div>

        <div>
          <label className="text-sm font-semibold">{t.numberOfLuggage}</label>

          <div className="mt-1 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLuggage(Math.max(1, luggage - 1))}
              className="rounded border px-3 py-1"
            >
              -
            </button>

            <span>{luggage}</span>

            <button
              type="button"
              onClick={() => setLuggage(luggage + 1)}
              className="rounded border px-3 py-1"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <p className="text-sm font-semibold">{t.totalPrice}</p>
        <p className="mt-1 text-2xl font-bold">€ {totalPrice}</p>
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