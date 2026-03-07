

"use client";

import { useRouter } from "next/navigation";
import { useBookingStore } from "../../store/bookingStore";

export default function MyBookingPage() {
  const router = useRouter();
  const items = useBookingStore((state) => state.items);
  const clearItems = useBookingStore((state) => state.clearItems);

  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  function handleClearBooking() {
    clearItems();
    router.push("/");
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <h1 className="text-2xl font-bold uppercase">My Booking</h1>

      {items.length === 0 ? (
        <div className="border rounded-2xl p-4">
          <p className="font-semibold">Your booking is empty.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="border rounded-2xl p-4 space-y-3">
                <p className="font-bold uppercase">{item.productName}</p>

                <div className="space-y-1 text-sm">
                  <p>Date: {item.date}</p>
                  {item.dropOffTime && <p>Drop-off: {item.dropOffTime}</p>}
                  {item.pickUpTime && (
                    <p>Estimated pick-up: {item.pickUpTime}</p>
                  )}
                  {item.showerTime && <p>Shower time: {item.showerTime}</p>}
                  {item.comments ? <p>Comments: {item.comments}</p> : null}
                </div>

                {item.breakdown && item.breakdown.length > 0 ? (
                  <div className="border-t pt-3 space-y-2">
                    {item.breakdown.map((part, partIndex) => (
                      <div
                        key={partIndex}
                        className="flex justify-between gap-4 text-sm"
                      >
                        <span>
                          {part.quantity} × {part.label}
                        </span>
                        <span>€ {part.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border-t pt-3 space-y-1 text-sm">
                    <p>Quantity: {item.quantity}</p>
                    <p>€ {item.totalPrice}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border rounded-2xl p-4">
            <p className="text-sm font-semibold">Total</p>
            <p className="text-2xl font-bold">€ {total}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleClearBooking}
              className="w-full border rounded-2xl p-4 font-semibold uppercase"
              type="button"
            >
              Clear Booking
            </button>

            <button
              className="w-full border rounded-2xl p-4 font-semibold uppercase"
              type="button"
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </main>
  );
}