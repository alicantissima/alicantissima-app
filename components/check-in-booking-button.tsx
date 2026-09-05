"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateBookingPaymentMethod } from "@/app/admin/payment-actions";

type WalkinPaymentMethod = "card" | "cash" | "unpaid";

type Props = {
  bookingId: string;
  currentStatus: string;
  serviceDate?: string | null;
  checkInTime?: string | null;
  source?: string | null;
  paymentMethod?: string | null;
};

function getTodayMadridDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function CheckInBookingButton({
  bookingId,
  currentStatus,
  serviceDate,
  checkInTime,
  source,
  paymentMethod: currentPaymentMethod,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] =
    useState<WalkinPaymentMethod | null>(null);

  const supabase = createClient();

  const isWalkin =
    String(source || "").toLowerCase() === "walkin";

    const todayMadrid = getTodayMadridDate();

const isFutureWalkin =
  isWalkin &&
  !!serviceDate &&
  serviceDate > todayMadrid;

  const normalizedCurrentPaymentMethod =
  String(currentPaymentMethod || "").toLowerCase();

const isWalkinAlreadyPaid =
  isWalkin &&
  (normalizedCurrentPaymentMethod === "card" ||
    normalizedCurrentPaymentMethod === "cash");

    async function handleFuturePayment() {
  if (loading) return;

  if (!isWalkin) return;

  if (!serviceDate) {
    alert("This booking does not have a service date.");
    return;
  }

  const todayMadrid = getTodayMadridDate();

  if (serviceDate <= todayMadrid) {
    alert("This button can only be used for future bookings.");
    return;
  }

  if (!paymentMethod) {
    alert("Please select the payment method first: CARD, CASH or UNPAID.");
    return;
  }

  const paymentLabel =
    paymentMethod === "card"
      ? "CARD"
      : paymentMethod === "cash"
        ? "CASH"
        : "UNPAID";

  const consequence =
  paymentMethod === "unpaid"
    ? "The booking will remain UNPAID and BOOKED."
    : `The booking will be marked as paid by ${paymentLabel}, the invoice will be issued automatically, and the booking will remain BOOKED until the service date.`;

  const confirmed = window.confirm(
  "⚠️ FINAL CONFIRMATION ⚠️\n\n" +
    `PAYMENT METHOD: ${paymentLabel}\n\n` +
    "ARE YOU SURE YOU WANT TO CONFIRM THIS OPERATION?\n\n" +
    "PLEASE CHECK ALL DETAILS AGAIN!!!\n\n" +
    consequence +
    "\n\n" +
    "NO check-in will be recorded now.\n\n" +
    "CONFIRM?"
);

  if (!confirmed) return;

  setLoading(true);

  const paymentResult = await updateBookingPaymentMethod({
    bookingId,
    paymentMethod,
  });

  setLoading(false);

  if (!paymentResult.ok) {
    alert(
  "The payment could not be registered.\n\n" +
    "CHECK THIS BOOKING IN ADMIN."
);
    return;
  }

  if (
    paymentMethod !== "unpaid" &&
    paymentResult.invoiced === false
  ) {
    alert(
  "The payment was registered, but the invoice was not issued automatically.\n\n" +
    "CHECK THE INVOICE IN ADMIN."
    );
  }

  window.location.replace(`/desk?refresh=${Date.now()}`);
}

  async function handleCheckIn() {
    if (loading) return;

    if (currentStatus !== "booked") {
      alert("This booking is not in a valid status for check-in.");
      return;
    }

    if (!serviceDate) {
      alert("This booking does not have a service date.");
      return;
    }

    const todayMadrid = getTodayMadridDate();

    if (serviceDate !== todayMadrid) {
      alert(`Check-in can only be done on the booking date: ${serviceDate}.`);
      return;
    }

    if (isWalkin && !isWalkinAlreadyPaid && !paymentMethod) {
      alert("Please select the payment method first: CARD, CASH or UNPAID.");
      return;
    }

    if (isWalkin && !isWalkinAlreadyPaid) {
      const paymentLabel =
        paymentMethod === "card"
          ? "CARD"
          : paymentMethod === "cash"
            ? "CASH"
            : "UNPAID";

      const consequence =
  paymentMethod === "unpaid"
    ? "The booking will remain UNPAID."
    : `The booking will be marked as paid by ${paymentLabel} and the invoice will be issued automatically.`;

      const confirmed = window.confirm(
  "⚠️ FINAL CONFIRMATION ⚠️\n\n" +
    `PAYMENT METHOD: ${paymentLabel}\n\n` +
    "ARE YOU SURE YOU WANT TO CONFIRM THIS OPERATION?\n\n" +
    "PLEASE CHECK ALL DETAILS AGAIN!!!\n\n" +
    consequence +
    "\n\n" +
    "The check-in will now be recorded.\n\n" +
    "CONFIRM?"
);

      if (!confirmed) return;
    }

    setLoading(true);

    const updateData: {
      status: string;
      updated_at: string;
      check_in_time?: string;
    } = {
      status: "inside",
      updated_at: new Date().toISOString(),
    };

    if (!checkInTime) {
      updateData.check_in_time = new Date().toISOString();
    }

    const { error } = await supabase
      .from("bookings")
      .update(updateData)
      .eq("id", bookingId)
      .eq("status", "booked");

    if (error) {
      setLoading(false);
      alert("Check-in could not be completed.");
      return;
    }

    if (isWalkin && !isWalkinAlreadyPaid && paymentMethod) {
      const paymentResult = await updateBookingPaymentMethod({
        bookingId,
        paymentMethod,
      });

      if (!paymentResult.ok) {
        setLoading(false);

        alert(
  "Check-in was completed, but the payment could not be registered.\n\n" +
    "CHECK THIS BOOKING IN ADMIN."
);

        window.location.replace(`/desk?refresh=${Date.now()}`);
return;
      }

      if (
        paymentMethod !== "unpaid" &&
        paymentResult.invoiced === false
      ) {
        alert(
  "Check-in and payment were registered, but the invoice was not issued automatically.\n\n" +
    "CHECK THE INVOICE IN ADMIN."
);
      }
    }

   setLoading(false);

window.location.replace(`/desk?refresh=${Date.now()}`);  }

  return (
    <div className="space-y-3">
      {isWalkin && !isWalkinAlreadyPaid && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3">
          <div className="mb-2 text-sm font-semibold text-amber-900">
            Walk-in payment
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              disabled={loading}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                paymentMethod === "card"
                  ? "border-blue-700 bg-blue-700 text-white"
                  : "border-gray-300 bg-white text-gray-900"
              }`}
            >
              Card
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              disabled={loading}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                paymentMethod === "cash"
                  ? "border-green-700 bg-green-700 text-white"
                  : "border-gray-300 bg-white text-gray-900"
              }`}
            >
              Cash
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("unpaid")}
              disabled={loading}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                paymentMethod === "unpaid"
                  ? "border-red-700 bg-red-700 text-white"
                  : "border-gray-300 bg-white text-gray-900"
              }`}
            >
              Unpaid
            </button>
          </div>
        </div>
      )}

      {isFutureWalkin ? (
  isWalkinAlreadyPaid ? (
    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
      Payment confirmed:{" "}
      {normalizedCurrentPaymentMethod === "card" ? "Card" : "Cash"}
    </div>
  ) : (
    <button
      type="button"
      onClick={handleFuturePayment}
      disabled={loading}
      className="rounded-xl border border-blue-700 bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {loading ? "Registering payment..." : "Confirm payment"}
    </button>
  )
) : (
  <button
    type="button"
    onClick={handleCheckIn}
    disabled={loading}
    className="rounded-xl border border-green-700 bg-green-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
  >
{loading ? "Checking in..." : "Check-in"}  </button>
)}
    </div>
  );
}