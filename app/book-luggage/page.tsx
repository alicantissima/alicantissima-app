


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

export default function BookLuggagePage() {
  const router = useRouter();
  const addItem = useBookingStore((state) => state.addItem);

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
      alert("Please choose a date.");
      return;
    }

    if (!dropOff) {
      alert("Please choose a drop-off time.");
      return;
    }

    if (!pickUp) {
      alert("Please choose an estimated pick-up time.");
      return;
    }

    addItem({
      productCode: "luggage",
      productName: "Store Luggage",
      quantity: luggage,
      date,
      dropOffTime: dropOff,
      pickUpTime: pickUp,
      comments,
      unitPrice,
      totalPrice,
    });

    router.push("/checkout");
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold uppercase">Store Luggage</h1>

      <p className="text-sm text-gray-600">
        Safe & fast luggage storage in Alicante city center
      </p>

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

        <div>
          <label className="text-sm font-semibold">
            Choose drop-off time
          </label>
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

        <div>
          <label className="text-sm font-semibold">Number of luggage</label>

          <div className="mt-1 flex items-center gap-4">
            <button
              onClick={() => setLuggage(Math.max(1, luggage - 1))}
              className="rounded border px-3 py-1"
              type="button"
            >
              -
            </button>

            <span>{luggage}</span>

            <button
              onClick={() => setLuggage(luggage + 1)}
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
        Add to booking
      </button>
    </main>
  );
}