


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

function BookShowerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useBookingStore((state) => state.addItem);

  const language = normalizeLanguage(searchParams.get("lang"));
  const source = searchParams.get("source") === "walkin" ? "walkin" : "";
  const t = getMessages(language);

  const showerSlots = useMemo(() => generateTimeSlots(10, 20), []);

  const [date, setDate] = useState("");
  const [showerTime, setShowerTime] = useState(showerSlots[0] ?? "");
  const [showers, setShowers] = useState(1);
  const [comments, setComments] = useState("");

  const unitPrice = 12;
  const totalPrice = showers * unitPrice;

  function handleAddToBooking() {
    if (!date) {
      alert(t.bookShowerChooseDateAlert);
      return;
    }

    if (!showerTime) {
      alert(t.bookShowerChooseTimeAlert);
      return;
    }

    addItem({
      productCode: "shower",
      productName: t.bookShowerProductName,
      quantity: showers,
      date,
      showerTime,
      comments: comments.trim() || undefined,
      unitPrice,
      totalPrice,
    });

    window.scrollTo({ top: 0, behavior: "auto" });
    const checkoutParams = new URLSearchParams();
checkoutParams.set("lang", language);

if (source === "walkin") {
  checkoutParams.set("source", "walkin");
}

const params = new URLSearchParams();
params.set("lang", language);

if (searchParams.get("source") === "walkin") {
  params.set("source", "walkin");
}

router.push(`/checkout?${params.toString()}`);
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <button
        onClick={() => router.push(`/?lang=${language}`)}
        className="text-sm text-gray-600 hover:text-black"
      >
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold uppercase">{t.bookShowerTitle}</h1>

      <p className="text-sm text-gray-600">{t.bookShowerSubtitle}</p>

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
          <label className="text-sm font-semibold">{t.chooseShowerTime}</label>
          <select
            className="mt-1 w-full rounded border p-2"
            value={showerTime}
            onChange={(e) => setShowerTime(e.target.value)}
          >
            {showerSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold">{t.numberOfShowers}</label>

          <div className="mt-1 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowers(Math.max(1, showers - 1))}
              className="rounded border px-3 py-1"
            >
              -
            </button>

            <span>{showers}</span>

            <button
              type="button"
              onClick={() => setShowers(showers + 1)}
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

export default function BookShowerPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md p-6" />}>
      <BookShowerContent />
    </Suspense>
  );
}