


"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingStore } from "../../store/bookingStore";
import { getMessages, normalizeLanguage } from "@/lib/i18n";
import { TIME_SLOTS } from "@/lib/time-slots";
import {
  getShowerDurationMinutes,
  getShowerEndTime,
} from "@/lib/showers";

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getCurrentMadridMinutes() {
  const now = new Date();

  const madrid = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(madrid.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(madrid.find((p) => p.type === "minute")?.value ?? "0");

  return hour * 60 + minute;
}

function timeToMinutes(value?: string | null) {
  if (!value) return 0;

  const normalized = value
    .trim()
    .replace("H", "h")
    .replace("h", ":");

  const start = normalized.split("-")[0].trim();
  const [hourRaw, minuteRaw] = start.split(":");

  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;

  return hour * 60 + minute;
}

function getSlotEnd(slot: string) {
  return slot.split("-")[1] || "";
}

function formatComboTime(value?: string | null) {
  if (!value) return "";

  return value
    .trim()
    .replace("H", "h")
    .replace("h", ":");
}

function getCurrentMadridSlotStart() {
  const now = new Date();

  const madrid = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const hour = Number(madrid.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(madrid.find((p) => p.type === "minute")?.value ?? "0");

  if (minute === 0) return `${String(hour).padStart(2, "0")}h00`;
  if (minute <= 30) return `${String(hour).padStart(2, "0")}h30`;
  return `${String(hour + 1).padStart(2, "0")}h00`;
}

function getSlotStart(slot: string) {
  return slot.split("-")[0];
}

function getSlotIndex(slot: string, slots: string[]) {
  return slots.indexOf(slot);
}

type ShowerAvailabilitySlot = {
  value: string;
  label: string;
  startTime: string;
  endTime: string;
  available: boolean;
};

function BookComboContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
const addItem = useBookingStore((state) => state.addItem);
const clearItems = useBookingStore((state) => state.clearItems);

  const language = normalizeLanguage(searchParams.get("lang"));
  const source = searchParams.get("source") === "walkin" ? "walkin" : "";
  const t = getMessages(language);

  const timeSlots = TIME_SLOTS;

  const [date, setDate] = useState("");
  const [dropOffTime, setDropOffTime] = useState("");
  const [showerTime, setShowerTime] = useState("");

  const [comboQty, setComboQty] = useState(1);
  const [extraLuggageQty, setExtraLuggageQty] = useState(0);
  const [extraShowerQty, setExtraShowerQty] = useState(0);

const totalShowerPeople = comboQty + extraShowerQty;

  const [comments, setComments] = useState("");

const [availabilitySlots, setAvailabilitySlots] = useState<
  ShowerAvailabilitySlot[]
>([]);
const [availabilityLoading, setAvailabilityLoading] = useState(false);
const [availabilityError, setAvailabilityError] = useState("");


  const baseAvailableSlots = useMemo(() => {
  if (!date) return timeSlots;

  const today = getTodayString();

  if (date !== today) return timeSlots;

  const currentMinutes = getCurrentMadridMinutes();

  return timeSlots.filter((slot) => {
    const slotEndMinutes = timeToMinutes(getSlotEnd(slot));

    return slotEndMinutes > currentMinutes;
  });
}, [date, timeSlots]);

  const availableShowerSlots = useMemo(() => {
  if (!date || !dropOffTime) return [];

  const dropOffMinutes = timeToMinutes(getSlotStart(dropOffTime));
  const today = getTodayString();
const currentMinutes = date === today ? getCurrentMadridMinutes() : 0;

  return availabilitySlots.filter((slot) => {
    const showerMinutes = timeToMinutes(slot.startTime || slot.value);

    const showerEndMinutes = timeToMinutes(slot.endTime);

return (
  showerMinutes >= dropOffMinutes &&
  showerEndMinutes > currentMinutes
  });
 });
}, [availabilitySlots, date, dropOffTime]);

useEffect(() => {
  async function loadAvailability() {
    if (!date) {
      setAvailabilitySlots([]);
      setAvailabilityError("");
      setAvailabilityLoading(false);
      return;
    }

    setAvailabilityLoading(true);
    setAvailabilityError("");

    try {
      const params = new URLSearchParams();
      params.set("date", date);
      params.set("quantity", String(totalShowerPeople));

      const response = await fetch(
        `/api/showers/availability?${params.toString()}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Could not load availability.");
      }

      setAvailabilitySlots(data.slots || []);
    } catch (error) {
      console.error("combo shower availability error:", error);
      setAvailabilitySlots([]);
      setAvailabilityError(
        error instanceof Error
          ? error.message
          : "Could not load available shower times."
      );
    } finally {
      setAvailabilityLoading(false);
    }
  }

  loadAvailability();
}, [date, totalShowerPeople]);

  useEffect(() => {
    if (dropOffTime && !baseAvailableSlots.includes(dropOffTime)) {
      setDropOffTime("");
    }
  }, [dropOffTime, baseAvailableSlots]);

  useEffect(() => {
  if (
    showerTime &&
    availableShowerSlots.length > 0 &&
    !availableShowerSlots.some((slot) => slot.value === showerTime)
  ) {
    setShowerTime("");
  }
}, [showerTime, availableShowerSlots]);

useEffect(() => {
  setShowerTime("");
}, [totalShowerPeople]);


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

    if (timeToMinutes(showerTime) < timeToMinutes(getSlotStart(dropOffTime))) {
  alert("Shower time must be after drop-off time.");
  return;
}

clearItems();

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
        type="button"
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
      onChange={(e) => {
        setDate(e.target.value);
        setDropOffTime("");
        setShowerTime("");
      }}
    />
  </div>

  <div>
    <label className={labelClass}>{t.chooseLuggageDropOffTime}</label>
    <select
      className={fieldClass}
      value={dropOffTime}
      onChange={(e) => {
        const newDropOff = e.target.value;
        setDropOffTime(newDropOff);

        if (
          showerTime &&
          timeToMinutes(showerTime) < timeToMinutes(getSlotStart(newDropOff))
        ) {
          setShowerTime("");
        }
      }}
    >
      <option value="">Choose time</option>
      {baseAvailableSlots.map((slot) => (
        <option key={slot} value={slot}>
          {slot}
        </option>
      ))}
    </select>
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
          onClick={() => {
            decrease(comboQty, setComboQty, 1);
            setShowerTime("");
          }}
          className={qtyButtonClass}
        >
          -
        </button>
        <span className="min-w-[1.5rem] text-center text-lg font-medium text-zinc-900 dark:text-white">
          {comboQty}
        </span>
        <button
          type="button"
          onClick={() => {
            increase(comboQty, setComboQty);
            setShowerTime("");
          }}
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
          onClick={() => {
            decrease(extraShowerQty, setExtraShowerQty);
            setShowerTime("");
          }}
          className={qtyButtonClass}
        >
          -
        </button>

        <span className="min-w-[1.5rem] text-center text-lg font-medium text-zinc-900 dark:text-white">
          {extraShowerQty}
        </span>

        <button
          type="button"
          onClick={() => {
            increase(extraShowerQty, setExtraShowerQty);
            setShowerTime("");
          }}
          className={qtyButtonClass}
        >
          +
        </button>
      </div>
    </div>
  </div>

    {date && dropOffTime ? (
    <div>
      <label className={labelClass}>{t.chooseApproxShowerTime}</label>

      <select
        className={fieldClass}
        value={showerTime}
        onChange={(e) => setShowerTime(e.target.value)}
        disabled={availabilityLoading || availableShowerSlots.length === 0}
      >
        <option value="">Choose time</option>

        {availableShowerSlots.map((slot) => (
          <option key={slot.value} value={slot.value} disabled={!slot.available}>
            {slot.label}
          </option>
        ))}
      </select>

      {availabilityLoading ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Loading available shower times...
        </p>
      ) : availabilityError ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          {availabilityError}
        </p>
      ) : availableShowerSlots.length === 0 ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">
          No shower times available for this date and number of showers.
        </p>
      ) : null}
    </div>
  ) : null}
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