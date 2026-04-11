


"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingStore } from "../../store/bookingStore";
import { getMessages, normalizeLanguage } from "@/lib/i18n";
import { TIME_SLOTS } from "@/lib/time-slots";

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function BookShowerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addItem = useBookingStore((state) => state.addItem);

  const language = normalizeLanguage(searchParams.get("lang"));
  const source = searchParams.get("source") === "walkin" ? "walkin" : "";
  const t = getMessages(language);

  const showerSlots = TIME_SLOTS;

  const [date, setDate] = useState("");
  const [showerTime, setShowerTime] = useState("");
  const [showers, setShowers] = useState(1);
  const [comments, setComments] = useState("");

  const unitPrice = 12;
  const totalPrice = showers * unitPrice;

  const fieldClass =
    "mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2 text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-300 dark:bg-black dark:text-white dark:placeholder:text-zinc-400";
  const labelClass =
    "text-sm font-semibold text-zinc-900 dark:text-zinc-100";
  const mutedClass = "text-sm text-zinc-600 dark:text-zinc-300";
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

    const params = new URLSearchParams();
    params.set("lang", language);

    if (source === "walkin") {
      params.set("source", "walkin");
    }

    router.push(`/checkout?${params.toString()}`);
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6 text-zinc-900 dark:text-white">
      <button
        type="button"
        onClick={() => router.push(`/?lang=${language}`)}
        className={backClass}
      >
        ← {t.back}
      </button>

      <h1 className="text-2xl font-bold uppercase text-zinc-900 dark:text-white">
        {t.bookShowerTitle}
      </h1>

      <p className={mutedClass}>{t.bookShowerSubtitle}</p>

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
          <label className={labelClass}>{t.chooseShowerTime}</label>
          <select
            className={fieldClass}
            value={showerTime}
            onChange={(e) => setShowerTime(e.target.value)}
          >
            <option value="">Choose time</option>
            {showerSlots.map((slot) => (
              <option key={slot} value={slot}>
                {slot}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>{t.numberOfShowers}</label>

          <div className="mt-1 flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowers(Math.max(1, showers - 1))}
              className={qtyButtonClass}
            >
              -
            </button>

            <span className="text-lg font-medium text-zinc-900 dark:text-white">
              {showers}
            </span>

            <button
              type="button"
              onClick={() => setShowers(showers + 1)}
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

export default function BookShowerPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-md p-6" />}>
      <BookShowerContent />
    </Suspense>
  );
}


