

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBookingStore } from "../../store/bookingStore";

export default function BookLuggagePage() {
  const router = useRouter();
  const addItem = useBookingStore((state) => state.addItem);

  const [date, setDate] = useState("");
  const [dropOff, setDropOff] = useState("10:00");
  const [pickUp, setPickUp] = useState("18:00");
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

    router.push("/my-booking");
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-bold uppercase">Store Luggage</h1>

      <p className="text-sm text-gray-600">
        Safe & fast luggage storage in Alicante city center
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold">Choose date</label>
          <input
            type="date"
            className="w-full border rounded p-2 mt-1"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold">
            Choose drop-off time
          </label>
          <input
            type="time"
            className="w-full border rounded p-2 mt-1"
            value={dropOff}
            onChange={(e) => setDropOff(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold">
            Estimated pick-up time
          </label>
          <input
            type="time"
            className="w-full border rounded p-2 mt-1"
            value={pickUp}
            onChange={(e) => setPickUp(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">
            Helps us organize luggage during the day.
          </p>
        </div>

        <div>
          <label className="text-sm font-semibold">Number of luggage</label>

          <div className="flex items-center gap-4 mt-1">
            <button
              onClick={() => setLuggage(Math.max(1, luggage - 1))}
              className="border px-3 py-1 rounded"
              type="button"
            >
              -
            </button>

            <span>{luggage}</span>

            <button
              onClick={() => setLuggage(luggage + 1)}
              className="border px-3 py-1 rounded"
              type="button"
            >
              +
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold">Comments (optional)</label>
          <textarea
            className="w-full border rounded p-2 mt-1"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-2xl p-4">
        <p className="text-sm font-semibold">Total price</p>
        <p className="text-2xl font-bold mt-1">€ {totalPrice}</p>
      </div>

      <button
        onClick={handleAddToBooking}
        className="w-full border rounded-2xl p-4 font-semibold uppercase"
      >
        Add to booking
      </button>
    </main>
  );
}