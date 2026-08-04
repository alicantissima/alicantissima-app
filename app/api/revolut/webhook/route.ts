


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizePaidBookingByPaymentReference } from "@/app/checkout/actions";
import { issueAlegraInvoice } from "@/lib/alegra/issueInvoice";

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
  state?: string;
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
      return NextResponse.json({ ok: true, ignored: "Missing order id." });
    }

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
const revolutOrder = await retrieveRevolutOrder(orderId);

const revolutOrderId = String(revolutOrder.id || "");
const revolutState = String(revolutOrder.state || "").toLowerCase();
const revolutCurrency = String(revolutOrder.currency || "").toUpperCase();

const revolutAmount = Number(revolutOrder.amount);
const revolutOutstandingAmount = Number(
  revolutOrder.outstanding_amount ?? 0
);

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