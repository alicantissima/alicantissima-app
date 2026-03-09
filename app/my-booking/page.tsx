


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

  function handleCheckout() {
    router.push("/checkout");
  }

  return (
    <main className="mx-auto max-w-md space-y-6 p-6">
      <h1 className="text-2xl font-bold uppercase">My Booking</h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border p-4">
          <p className="font-semibold">Your booking is empty.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="space-y-3 rounded-2xl border p-4">
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
                  <div className="space-y-2 border-t pt-3">
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
                  <div className="space-y-1 border-t pt-3 text-sm">
                    <p>Quantity: {item.quantity}</p>
                    <p>€ {item.totalPrice}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border p-4">
            <p className="text-sm font-semibold">Total</p>
            <p className="text-2xl font-bold">€ {total}</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleCheckout}
              className="w-full rounded-[28px] border border-black bg-black p-5 text-xl font-bold uppercase text-white"
              type="button"
            >
              Checkout
            </button>

            <button
              onClick={() => {
                const confirmed = window.confirm("Clear this booking?");
                if (confirmed) {
                  handleClearBooking();
                }
              }}
              className="w-full rounded-[28px] border border-black bg-white p-4 text-lg font-semibold uppercase text-black"
              type="button"
            >
              Clear Booking
            </button>
          </div>
        </>
      )}
    </main>
  );
}