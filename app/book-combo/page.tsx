


"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../../store/bookingStore";

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

export default function BookComboPage() {
  const router = useRouter();
  const addItem = useBookingStore((state) => state.addItem);

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
      alert("Please choose a date.");
      return;
    }

    if (!dropOffTime) {
      alert("Please choose a luggage drop-off time.");
      return;
    }

    if (!showerTime) {
      alert("Please choose a shower time.");
      return;
    }

    addItem({
      productCode: "combo",
      productName: "Luggage + Shower",
      quantity: comboQty,
      date,
      dropOffTime,
      showerTime,
      comments: comments.trim() || undefined,
      unitPrice: comboPrice,
      totalPrice,
      breakdown: [
        {
          label: "Luggage + Shower",
          quantity: comboQty,
          unitPrice: comboPrice,
          totalPrice: comboQty * comboPrice,
        },
        {
          label: "Additional luggage",
          quantity: extraLuggageQty,
          unitPrice: extraLuggagePrice,
          totalPrice: extraLuggageQty * extraLuggagePrice,
        },
        {
          label: "Additional shower",
          quantity: extraShowerQty,
          unitPrice: extraShowerPrice,
          totalPrice: extraShowerQty * extraShowerPrice,
        },
      ].filter((item) => item.quantity > 0),
    });

    window.scrollTo({ top: 0, behavior: "auto" });
router.push("/checkout");
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
      <h1 className="text-2xl font-bold uppercase">Luggage + Shower</h1>

      <p className="text-sm text-gray-600">
        Leave your bags, enjoy the day and take a refreshing shower
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Choose the date</label>
          <input
            type="date"
            min={getTodayString()}
            className="mt-1 w-full rounded border p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold">Luggage drop-off time</label>
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
            Shower time (approx.)
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
          <p className="mt-1 text-xs text-gray-500">
            You can take your shower and still come back later to collect your
            luggage.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Luggage + Shower</p>
              <p className="text-sm text-gray-600">€18 / person</p>
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
              <p className="font-semibold">Additional luggage</p>
              <p className="text-sm text-gray-600">€8 / item / all day</p>
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
              <p className="font-semibold">Additional shower</p>
              <p className="text-sm text-gray-600">€12 / person</p>
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
        <p className="text-sm font-semibold">Total price</p>
        <p className="text-2xl font-bold">€ {totalPrice}</p>
      </div>

      <button
        type="button"
        onClick={handleAddToBooking}
        className="w-full rounded-[24px] border border-black bg-black px-6 py-3.5 text-center text-lg font-bold uppercase text-white transition active:scale-[0.99]"
      >
        Book now
      </button>

      <div>
        <label className="text-sm font-semibold">Comments (optional)</label>
        <textarea
          className="mt-1 w-full rounded border p-2"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
        />
      </div>
    </main>
  );
}