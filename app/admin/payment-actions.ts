


"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { issueAlegraInvoice } from "@/lib/alegra/issueInvoice";

type PaymentMethod =
  | "unpaid"
  | "viator"
  | "card"
  | "cash"
  | "revolut"
  | "refunded"
  | "cancelled"
  | "missed_payment";

export async function updateBookingPaymentMethod(params: {
  bookingId: string;
  paymentMethod: PaymentMethod;
}) {
  const bookingId = String(params.bookingId || "").trim();
  const paymentMethod = params.paymentMethod;

  if (!bookingId) {
    return {
      ok: false,
      error: "Missing booking id.",
    };
  }

  const supabase = createAdminClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_code,
      source,
      payment_method,
      payment_status,
      paid_at,
      invoice_id
    `)
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError) {
    console.error(
      "Payment method booking lookup error:",
      bookingError
    );

    return {
      ok: false,
      error: bookingError.message,
    };
  }

  if (!booking) {
    return {
      ok: false,
      error: "Booking not found.",
    };
  }

  const isWalkin =
    String(booking.source || "").toLowerCase() === "walkin";

  const isPaidWalkinMethod =
    paymentMethod === "card" ||
    paymentMethod === "cash";

  /*
   * Para reservas que não são walk-in,
   * preservamos o comportamento antigo:
   * apenas alteramos payment_method.
   */
  if (!isWalkin) {
    const { error } = await supabase
      .from("bookings")
      .update({
        payment_method: paymentMethod,
      })
      .eq("id", booking.id);

    if (error) {
      return {
        ok: false,
        error: error.message,
      };
    }

    return {
      ok: true,
      invoiced: false,
    };
  }

  /*
   * WALK-IN CARD / CASH:
   * o pagamento fica imediatamente confirmado.
   */
  if (isPaidWalkinMethod) {
    const paidAt =
      booking.paid_at ??
      new Date().toISOString();

    const { error: paymentError } = await supabase
      .from("bookings")
      .update({
        payment_method: paymentMethod,
        payment_status: "paid",
        paid_at: paidAt,
      })
      .eq("id", booking.id);

    if (paymentError) {
      console.error(
        "Walk-in payment update error:",
        paymentError
      );

      return {
        ok: false,
        error: paymentError.message,
      };
    }

    /*
     * O pagamento já está confirmado.
     *
     * Se a Alegra falhar, NÃO desfazemos
     * o pagamento nem bloqueamos a Desk.
     */
    try {
      const invoiceResult =
        await issueAlegraInvoice(booking.id);

      console.log(
        "ALEGRA WALKIN AUTO INVOICE SUCCESS:",
        {
          bookingCode: booking.booking_code,
          paymentMethod,
          invoiceResult,
        }
      );

      return {
        ok: true,
        invoiced: true,
        invoiceResult,
      };
    } catch (invoiceError) {
      console.error(
        "ALEGRA WALKIN AUTO INVOICE FAILED:",
        {
          bookingCode: booking.booking_code,
          paymentMethod,
          error: invoiceError,
        }
      );

      return {
        ok: true,
        invoiced: false,
        invoiceError:
          invoiceError instanceof Error
            ? invoiceError.message
            : "Unexpected Alegra invoice error.",
      };
    }
  }

  /*
   * Outros estados continuam apenas a alterar
   * o payment_method, como anteriormente.
   */
  const { error } = await supabase
    .from("bookings")
    .update({
      payment_method: paymentMethod,
    })
    .eq("id", booking.id);

  if (error) {
    return {
      ok: false,
      error: error.message,
    };
  }

  return {
    ok: true,
    invoiced: false,
  };
}