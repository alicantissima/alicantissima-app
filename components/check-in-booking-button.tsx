"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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

  const router = useRouter();
  const supabase = createClient();

  const isWalkin =
    String(source || "").toLowerCase() === "walkin";

    const todayMadrid = getTodayMadridDate();

const isFutureWalkin =
  isWalkin &&
  !!serviceDate &&
  serviceDate > todayMadrid;

    async function handleFuturePayment() {
  if (loading) return;

  if (!isWalkin) return;

  if (!serviceDate) {
    alert("Esta reserva não tem data de serviço definida.");
    return;
  }

  const normalizedCurrentPaymentMethod =
  String(currentPaymentMethod || "").toLowerCase();

const isWalkinAlreadyPaid =
  isWalkin &&
  (normalizedCurrentPaymentMethod === "card" ||
    normalizedCurrentPaymentMethod === "cash");

  const todayMadrid = getTodayMadridDate();

  if (serviceDate <= todayMadrid) {
    alert("Este botão só deve ser usado para reservas futuras.");
    return;
  }

  if (!paymentMethod) {
    alert(
      "Selecione primeiro o método de pagamento: CARD, CASH ou UNPAID."
    );
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
      ? "A reserva ficará marcada como UNPAID e continuará BOOKED."
      : `A reserva ficará marcada como paga por ${paymentLabel}, será emitida a fatura automaticamente e continuará BOOKED até ao dia do serviço.`;

  const confirmed = window.confirm(
    "⚠️ ATENÇÃO — CONFIRMAÇÃO FINAL ⚠️\n\n" +
      `MÉTODO DE PAGAMENTO: ${paymentLabel}\n\n` +
      "TEM A CERTEZA QUE QUER CONFIRMAR ESTA OPERAÇÃO?\n\n" +
      "CONFIRME TODOS OS DADOS NOVAMENTE!!!\n\n" +
      consequence +
      "\n\n" +
      "NÃO será feito check-in nesta reserva.\n\n" +
      "CONFIRMAR?"
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
      "Não foi possível registar o pagamento.\n\n" +
        "CONFIRME ESTA RESERVA NO ADMIN."
    );
    return;
  }

  if (
    paymentMethod !== "unpaid" &&
    paymentResult.invoiced === false
  ) {
    alert(
      "O pagamento foi registado, mas a fatura não foi emitida automaticamente.\n\n" +
        "CONFIRME A FATURA NO ADMIN."
    );
  }

  window.location.replace(`/desk?refresh=${Date.now()}`);
}

  async function handleCheckIn() {
    if (loading) return;

    if (currentStatus !== "booked") {
      alert("Esta reserva não está em estado válido para check-in.");
      return;
    }

    if (!serviceDate) {
      alert("Esta reserva não tem data de serviço definida.");
      return;
    }

    const todayMadrid = getTodayMadridDate();

    if (serviceDate !== todayMadrid) {
      alert(
        `O check-in só pode ser feito no dia da reserva ${serviceDate}.`
      );
      return;
    }

    if (isWalkin && !paymentMethod) {
      alert(
        "Selecione primeiro o método de pagamento: CARD, CASH ou UNPAID."
      );
      return;
    }

    if (isWalkin) {
      const paymentLabel =
        paymentMethod === "card"
          ? "CARD"
          : paymentMethod === "cash"
            ? "CASH"
            : "UNPAID";

      const consequence =
        paymentMethod === "unpaid"
          ? "A reserva ficará marcada como UNPAID."
          : `A reserva ficará marcada como paga por ${paymentLabel} e será emitida a fatura automaticamente.`;

      const confirmed = window.confirm(
        "⚠️ ATENÇÃO — CONFIRMAÇÃO FINAL ⚠️\n\n" +
          `MÉTODO DE PAGAMENTO: ${paymentLabel}\n\n` +
          "TEM A CERTEZA QUE QUER CONFIRMAR ESTA OPERAÇÃO?\n\n" +
          "CONFIRME TODOS OS DADOS NOVAMENTE!!!\n\n" +
          consequence +
          "\n\n" +
          "Ao continuar, o check-in será registado.\n\n" +
          "CONFIRMAR?"
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
      alert("Não foi possível fazer o check-in.");
      return;
    }

    if (isWalkin && paymentMethod) {
      const paymentResult = await updateBookingPaymentMethod({
        bookingId,
        paymentMethod,
      });

      if (!paymentResult.ok) {
        setLoading(false);

        alert(
          "O check-in foi feito, mas houve um erro ao registar o pagamento.\n\n" +
            "CONFIRME ESTA RESERVA NO ADMIN."
        );

        window.location.replace(`/desk?refresh=${Date.now()}`);
return;
      }

      if (
        paymentMethod !== "unpaid" &&
        paymentResult.invoiced === false
      ) {
        alert(
          "O check-in e o pagamento foram registados, mas a fatura não foi emitida automaticamente.\n\n" +
            "CONFIRME A FATURA NO ADMIN."
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
            Pagamento do walk-in
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
      {loading ? "A registar pagamento..." : "Confirm payment"}
    </button>
  )
) : (
  <button
    type="button"
    onClick={handleCheckIn}
    disabled={loading}
    className="rounded-xl border border-green-700 bg-green-700 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
  >
    {loading ? "A registar entrada..." : "Check-in"}
  </button>
)}
    </div>
  );
}