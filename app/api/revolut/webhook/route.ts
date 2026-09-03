


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizePaidBookingByPaymentReference } from "@/app/checkout/actions";
import { issueAlegraInvoice } from "@/lib/alegra/issueInvoice";
import { issueAlegraCreditNote } from "@/lib/alegra/creditNotes";
import { sendCancellationEmails } from "@/lib/email/sendCancellationEmails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getOrderIdFromPayload(payload: Record<string, unknown>) {
  const data =
    payload.data && typeof payload.data === "object"
      ? (payload.data as Record<string, unknown>)
      : null;

  const order =
    data?.order && typeof data.order === "object"
      ? (data.order as Record<string, unknown>)
      : null;

  const candidates = [
    payload.order_id,
    payload.orderId,
    payload.id,
    data?.id,
    data?.order_id,
    data?.orderId,
    order?.id,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getEventName(payload: Record<string, unknown>) {
  const event =
    payload.event ||
    payload.type ||
    payload.event_type ||
    payload.name;

  return typeof event === "string" ? event : "";
}

function isPaidEvent(eventName: string, payload: Record<string, unknown>) {
  const normalizedEvent = eventName.toUpperCase();

  if (
    normalizedEvent === "ORDER_COMPLETED" ||
    normalizedEvent === "ORDER_AUTHORISED" ||
    normalizedEvent === "ORDER_AUTHORIZED"
  ) {
    return true;
  }

  const state =
    payload.state ||
    payload.status ||
    ((payload.data as Record<string, unknown> | undefined)?.state) ||
    ((payload.data as Record<string, unknown> | undefined)?.status);

  const normalizedState =
    typeof state === "string" ? state.toLowerCase() : "";

  return normalizedState === "completed" || normalizedState === "authorised";
}

type RevolutOrder = {
  id?: string;
  type?: string;
  state?: string;
  related_order_id?: string;

  amount?: number;
  outstanding_amount?: number;
  refunded_amount?: number;
  currency?: string;

  merchant_order_data?: {
    reference?: string;
  };

  metadata?: Record<string, unknown>;
};

async function retrieveRevolutOrder(orderId: string): Promise<RevolutOrder> {
  const secretKey = process.env.REVOLUT_SECRET_KEY;

  if (!secretKey) {
    throw new Error("REVOLUT_SECRET_KEY is missing.");
  }

  const response = await fetch(
    `https://merchant.revolut.com/api/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "Revolut-Api-Version": "2024-09-01",
      },
      cache: "no-store",
    }
  );

  const data = (await response.json().catch(() => null)) as RevolutOrder | null;

  if (!response.ok || !data) {
    throw new Error(
      `Revolut retrieve order error: ${response.status} ${JSON.stringify(data)}`
    );
  }

  return data;
}


export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;

    if (!payload) {
      return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
    }

    console.log("REVOLUT WEBHOOK:", JSON.stringify(payload));

    const eventName = getEventName(payload);
const orderId = getOrderIdFromPayload(payload);

if (!orderId) {
  return NextResponse.json({
    ok: true,
    ignored: "Missing order id.",
  });
}

/*
 * ORDER_COMPLETED pode ser:
 *
 * 1. uma order normal de pagamento;
 * 2. uma nova order criada pelo Revolut para um refund.
 *
 * Por isso consultamos sempre a order real antes
 * de decidir qual fluxo executar.
 */
const revolutOrder = await retrieveRevolutOrder(orderId);

const revolutOrderType = String(
  revolutOrder.type || ""
).toLowerCase();

const revolutState = String(
  revolutOrder.state || ""
).toLowerCase();

/*
 * REFUND MANUAL NO REVOLUT
 *
 * O dinheiro já foi devolvido.
 * NÃO voltamos a chamar o endpoint de refund.
 *
 * Apenas sincronizamos Alicantissima + Alegra + emails.
 */
if (
  eventName.toUpperCase() === "ORDER_COMPLETED" &&
  revolutOrderType === "refund" &&
  revolutState === "completed"
) {
  const originalOrderId = String(
    revolutOrder.related_order_id || ""
  ).trim();

  if (!originalOrderId) {
    throw new Error(
      `Refund order ${orderId} has no related_order_id.`
    );
  }

  const supabase = createAdminClient();

  const { data: booking, error: findRefundBookingError } =
    await supabase
      .from("bookings")
      .select(`
        id,
        booking_code,
        customer_name,
        customer_email,
        total_amount,
        currency,
        status,
        payment_status,
        refund_status,
        refunded_at,
        credit_note_id,
        payment_reference,
        revolut_order_id
      `)
      .or(
        `payment_reference.eq.${originalOrderId},revolut_order_id.eq.${originalOrderId}`
      )
      .maybeSingle();

  if (findRefundBookingError) {
    throw new Error(
      `Refund booking lookup failed: ${findRefundBookingError.message}`
    );
  }

  if (!booking) {
    console.error(
      "REVOLUT REFUND ALERT: Booking not found",
      {
        refundOrderId: orderId,
        originalOrderId,
      }
    );

    return NextResponse.json({
      ok: true,
      ignored: "Refund booking not found.",
      refundOrderId: orderId,
      originalOrderId,
    });
  }

  /*
   * O amount da refund order vem em cêntimos.
   */
  const refundAmount =
    Number(revolutOrder.amount || 0) / 100;

  if (
    !Number.isFinite(refundAmount) ||
    refundAmount <= 0
  ) {
    throw new Error(
      `Invalid refund amount for ${booking.booking_code}.`
    );
  }

  /*
   * Idempotência:
   * o Revolut pode repetir webhooks.
   *
   * Se este refund já ficou registado, não repetimos
   * emails nem criamos nova rectificativa.
   */
  if (
    booking.refund_status === "succeeded" &&
    booking.refunded_at
  ) {
    return NextResponse.json({
      ok: true,
      alreadyRefunded: true,
      bookingCode: booking.booking_code,
    });
  }

  const nowIso = new Date().toISOString();

  const { error: refundUpdateError } =
    await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: nowIso,
        cancellation_reason:
          "Manual refund in Revolut",
        refund_status: "succeeded",
        refund_amount: refundAmount,
        revolut_refund_order_id: orderId,
        refunded_at: nowIso,
        refund_error: null,
      })
      .eq("id", booking.id);

  if (refundUpdateError) {
    throw new Error(
      `Refund booking update failed: ${refundUpdateError.message}`
    );
  }

  let creditNoteResult: unknown = null;

  try {
    creditNoteResult =
      await issueAlegraCreditNote(
        booking.id,
        refundAmount
      );

    console.log(
      "ALEGRA MANUAL REVOLUT REFUND CREDIT NOTE SUCCESS:",
      {
        bookingCode: booking.booking_code,
        creditNoteResult,
      }
    );
  } catch (error) {
    console.error(
      "ALEGRA MANUAL REVOLUT REFUND CREDIT NOTE FAILED:",
      {
        bookingCode: booking.booking_code,
        error,
      }
    );
  }

  try {
    await sendCancellationEmails({
      bookingCode: booking.booking_code,
      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      amount: refundAmount,
      currency: String(
        booking.currency || "EUR"
      ).toUpperCase(),
      reason: "Manual refund in Revolut",
    });

    console.log(
      "MANUAL REVOLUT REFUND EMAILS SENT:",
      {
        bookingCode: booking.booking_code,
      }
    );
  } catch (error) {
    console.error(
      "MANUAL REVOLUT REFUND EMAILS FAILED:",
      {
        bookingCode: booking.booking_code,
        error,
      }
    );
  }

  return NextResponse.json({
    ok: true,
    refundProcessed: true,
    bookingCode: booking.booking_code,
    refundOrderId: orderId,
    originalOrderId,
    refundAmount,
    creditNoteResult,
  });
}

/*
 * A partir daqui continua o fluxo normal
 * de pagamento que já tínhamos.
 */
if (!isPaidEvent(eventName, payload)) {
  return NextResponse.json({
    ok: true,
    ignored: "Not a paid event.",
    eventName,
    orderId,
  });
}

const supabase = createAdminClient();

const { data: booking, error: findError } = await supabase
  .from("bookings")
  .select(`
    id,
    booking_code,
    total_amount,
    currency,
    payment_status,
    payment_reference
  `)
  .eq("payment_reference", orderId)
  .maybeSingle();

if (findError) {
  console.error("Revolut webhook find booking error:", findError);

  return NextResponse.json(
    {
      ok: false,
      error: "Booking lookup failed.",
    },
    { status: 500 }
  );
}

if (!booking) {
  console.error(
    "REVOLUT PAYMENT ALERT: Booking not found for order:",
    orderId
  );

  return NextResponse.json({
    ok: true,
    ignored: "Booking not found.",
    orderId,
  });
}

if (booking.payment_status === "paid") {
  return NextResponse.json({
    ok: true,
    alreadyPaid: true,
    bookingCode: booking.booking_code,
  });
}

/*
 * O webhook apenas nos avisa de que algo aconteceu.
 * A API do Revolut é consultada diretamente antes de confirmar o pagamento.
 */
const revolutOrderId = String(revolutOrder.id || "");

const revolutAmount = Number(revolutOrder.amount);

const revolutOutstandingAmount = Number(
  revolutOrder.outstanding_amount ?? 0
);

const revolutCurrency = String(
  revolutOrder.currency || ""
).toUpperCase();

const expectedAmount = Math.round(
  Number(booking.total_amount) * 100
);

const expectedCurrency = String(
  booking.currency || "EUR"
).toUpperCase();

/*
 * 1. A Order recuperada tem de ser exatamente a Order da booking.
 */
if (!revolutOrderId || revolutOrderId !== orderId) {
  console.error("REVOLUT PAYMENT ALERT: Order ID mismatch", {
    bookingCode: booking.booking_code,
    expectedOrderId: orderId,
    receivedOrderId: revolutOrderId,
  });

  throw new Error(
    `Revolut order ID mismatch for booking ${booking.booking_code}.`
  );
}

/*
 * 2. A Order tem de estar realmente concluída.
 */
if (revolutState !== "completed") {
  console.error("REVOLUT PAYMENT ALERT: Order not completed", {
    bookingCode: booking.booking_code,
    orderId,
    revolutState,
  });

  throw new Error(
    `Revolut order ${orderId} is not completed. Current state: ${revolutState}.`
  );
}

/*
 * 3. O montante pago tem de corresponder exatamente ao total da booking.
 */
if (
  !Number.isInteger(revolutAmount) ||
  revolutAmount !== expectedAmount
) {
  console.error("REVOLUT PAYMENT ALERT: Amount mismatch", {
    bookingCode: booking.booking_code,
    orderId,
    bookingAmount: expectedAmount,
    revolutAmount,
  });

  throw new Error(
    `Payment amount mismatch for booking ${booking.booking_code}.`
  );
}

/*
 * 4. A moeda também tem de corresponder.
 */
if (revolutCurrency !== expectedCurrency) {
  console.error("REVOLUT PAYMENT ALERT: Currency mismatch", {
    bookingCode: booking.booking_code,
    orderId,
    bookingCurrency: expectedCurrency,
    revolutCurrency,
  });

  throw new Error(
    `Payment currency mismatch for booking ${booking.booking_code}.`
  );
}

/*
 * 5. Não pode existir qualquer valor ainda por pagar.
 */
if (
  !Number.isFinite(revolutOutstandingAmount) ||
  revolutOutstandingAmount !== 0
) {
  console.error("REVOLUT PAYMENT ALERT: Outstanding amount", {
    bookingCode: booking.booking_code,
    orderId,
    revolutOutstandingAmount,
  });

  throw new Error(
    `Revolut order ${orderId} still has an outstanding amount.`
  );
}

console.log("REVOLUT PAYMENT VERIFIED:", {
  bookingCode: booking.booking_code,
  orderId,
  amount: revolutAmount,
  currency: revolutCurrency,
  state: revolutState,
});

const result = await finalizePaidBookingByPaymentReference(orderId);

let invoiceResult: unknown = null;

try {
  invoiceResult = await issueAlegraInvoice(booking.id);

  console.log("ALEGRA AUTO INVOICE SUCCESS:", {
    bookingCode: booking.booking_code,
    invoiceResult,
  });
} catch (error) {
  console.error("ALEGRA AUTO INVOICE FAILED:", {
    bookingCode: booking.booking_code,
    error,
  });
}

return NextResponse.json({
  ok: true,
  orderId,
  eventName,
  result,
  invoiceResult,
});

  } catch (error) {
    console.error("Revolut webhook error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected webhook error.",
      },
      { status: 500 }
    );
  }
}