


"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

type ProductKey = "bags" | "shower" | "combo";

export default function BookLuggagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const addItem = useBookingStore((state) => state.addItem);
  const clearItems = useBookingStore((state) => state.clearItems);

  const timeSlots = useMemo(() => generateTimeSlots(10, 20), []);

  const rawProduct = searchParams.get("product");
  const product: ProductKey =
    rawProduct === "shower" || rawProduct === "combo" ? rawProduct : "bags";

  const [date, setDate] = useState("");
  const [dropOff, setDropOff] = useState(timeSlots[0] ?? "");
  const [pickUp, setPickUp] = useState(timeSlots[0] ?? "");
  const [showerTime, setShowerTime] = useState(timeSlots[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [comments, setComments] = useState("");

  const config = {
    bags: {
      productCode: "luggage" as const,
      productName: "Store Luggage",
      pageTitle: "Store Luggage",
      subtitle: "Safe & fast luggage storage in Alicante city center",
      quantityLabel: "Number of luggage",
      unitPrice: 8,
      showDropOff: true,
      showPickUp: true,
      showShowerTime: false,
    },
    shower: {
      productCode: "shower" as const,
      productName: "Shower Service",
      pageTitle: "Book Shower",
      subtitle: "Freshen up in Alicante city center",
      quantityLabel: "Number of showers",
      unitPrice: 12,
      showDropOff: false,
      showPickUp: false,
      showShowerTime: true,
    },
    combo: {
      productCode: "combo" as const,
      productName: "Luggage + Shower Combo",
      pageTitle: "Book Combo",
      subtitle: "Luggage storage + shower in one booking",
      quantityLabel: "Number of combos",
      unitPrice: 18,
      showDropOff: true,
      showPickUp: true,
      showShowerTime: true,
    },
  }[product];

  const totalPrice = quantity * config.unitPrice;

  function handleAddToBooking() {
    if (!date) {
      alert("Please choose a date.");
      return;
    }

    if (config.showDropOff && !dropOff) {
      alert("Please choose a drop-off time.");
      return;
    }

    if (config.showPickUp && !pickUp) {
      alert("Please choose an estimated pick-up time.");
      return;
    }

    if (config.showShowerTime && !showerTime) {
      alert("Please choose a shower time.");
      return;
    }

    clearItems();

    addItem({
      productCode: config.productCode,
      productName: config.productName,
      quantity,
      date,
      dropOffTime: config.showDropOff ? dropOff : undefined,
      pickUpTime: config.showPickUp ? pickUp : undefined,
      showerTime: config.showShowerTime ? showerTime : undefined,
      comments,
      unitPrice: config.unitPrice,
      totalPrice,
    });

    router.push("/checkout");
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold uppercase">{config.pageTitle}</h1>

      <p className="text-sm text-gray-600">{config.subtitle}</p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Choose date</label>
          <input
            type="date"
            min={getTodayString()}
            className="mt-1 w-full rounded border p-2"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {config.showDropOff && (
          <div>
            <label className="text-sm font-semibold">Choose drop-off time</label>
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
        )}

        {config.showPickUp && (
          <div>
            <label className="text-sm font-semibold">
              Estimated pick-up time
            </label>
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
            <p className="mt-1 text-xs text-gray-500">
              Helps us organize luggage during the day.
            </p>
          </div>
        )}

        {config.showShowerTime && (
          <div>
            <label className="text-sm font-semibold">Choose shower time</label>
            <select
              className="mt-1 w-full rounded border p-2"
              value={showerTime}
              onChange={(e) => setShowerTime(e.target.value)}
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold">{config.quantityLabel}</label>

          <div className="mt-1 flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="rounded border px-3 py-1"
              type="button"
            >
              -
            </button>

            <span>{quantity}</span>

            <button
              onClick={() => setQuantity(quantity + 1)}
              className="rounded border px-3 py-1"
              type="button"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">Comments (optional)</label>
          <textarea
            className="mt-1 w-full rounded border p-2"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-2xl border p-4">
        <p className="text-sm font-semibold">Total price</p>
        <p className="mt-1 text-2xl font-bold">€ {totalPrice}</p>
      </div>

      <button
        onClick={handleAddToBooking}
        className="w-full rounded-2xl border p-4 font-semibold uppercase"
      >
        BOOK NOW
      </button>
    </main>
  );
}