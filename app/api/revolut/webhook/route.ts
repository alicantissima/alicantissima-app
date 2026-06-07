


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
      .select("id, booking_code, payment_status")
      .eq("payment_reference", orderId)
      .maybeSingle();

    if (findError) {
      console.error("Revolut webhook find booking error:", findError);
      return NextResponse.json({ ok: false, error: "Booking lookup failed." }, { status: 500 });
    }

    if (!booking) {
      return NextResponse.json({ ok: true, ignored: "Booking not found.", orderId });
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json({
        ok: true,
        alreadyPaid: true,
        bookingCode: booking.booking_code,
      });
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "booked",
        payment_status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("Revolut webhook update booking error:", updateError);
      return NextResponse.json({ ok: false, error: "Booking update failed." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      bookingCode: booking.booking_code,
      orderId,
      eventName,
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