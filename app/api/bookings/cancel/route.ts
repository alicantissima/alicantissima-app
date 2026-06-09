



import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type CancelBookingRow = {
  id: string;
  booking_code: string;
  status: string | null;
  total_amount: number | string | null;
  currency: string | null;
  payment_status: string | null;
  payment_provider: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  revolut_order_id: string | null;
  cancel_until: string | null;
  cancelled_at: string | null;
  refund_status: string | null;
  refunded_at: string | null;
  cancellation_token: string | null;
  cancellation_token_expires_at: string | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toCents(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.round(amount * 100);
}

async function refundRevolutOrder({
  orderId,
  amount,
  currency,
}: {
  orderId: string;
  amount: number;
  currency: string;
}) {
  const secretKey = process.env.REVOLUT_SECRET_KEY;

  if (!secretKey) {
    throw new Error("REVOLUT_SECRET_KEY is missing.");
  }

  const amountInCents = toCents(amount);

  if (!amountInCents) {
    throw new Error("Invalid refund amount.");
  }

  const response = await fetch(
    `https://merchant.revolut.com/api/orders/${encodeURIComponent(orderId)}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "Revolut-Api-Version": "2024-09-01",
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency,
      }),
      cache: "no-store",
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Revolut refund failed:", {
      status: response.status,
      data,
    });

    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : "Revolut refund failed."
    );
  }

  return data;
}

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();

  try {
    const body = await request.json().catch(() => ({}));

    const bookingCode = String(body.bookingCode || "").trim().toUpperCase();
    const token = String(body.token || "").trim();
    const reason = String(body.reason || "").trim();

    if (!bookingCode || !token) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing booking code or cancellation token.",
        },
        { status: 400 }
      );
    }

    const { data: booking, error: bookingError } = await supabase
  .from("bookings")
  .select(`
    id,
    booking_code,
    status,
    total_amount,
    currency,
    payment_status,
    payment_provider,
    payment_method,
    payment_reference,
    revolut_order_id,
    cancel_until,
    cancelled_at,
    refund_status,
    refunded_at,
    cancellation_token,
    cancellation_token_expires_at
  `)
  .eq("booking_code", bookingCode)
  .eq("cancellation_token", token)
  .maybeSingle<CancelBookingRow>();

    if (bookingError) {
      console.error("Cancel booking lookup error:", bookingError);

      return NextResponse.json(
        {
          ok: false,
          error: "Could not find booking.",
        },
        { status: 500 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid cancellation link.",
        },
        { status: 404 }
      );
    }

    if (booking.cancelled_at || booking.status === "cancelled") {
      return NextResponse.json({
        ok: true,
        alreadyCancelled: true,
        message: "This booking has already been cancelled.",
      });
    }

    if (booking.refunded_at || booking.refund_status === "succeeded") {
      return NextResponse.json({
        ok: true,
        alreadyRefunded: true,
        message: "This booking has already been refunded.",
      });
    }

    const now = new Date();

    if (booking.cancellation_token_expires_at) {
      const tokenExpiresAt = new Date(booking.cancellation_token_expires_at);

      if (Number.isFinite(tokenExpiresAt.getTime()) && now > tokenExpiresAt) {
        return NextResponse.json(
          {
            ok: false,
            error: "This cancellation link has expired.",
          },
          { status: 403 }
        );
      }
    }

    if (!booking.cancel_until) {
      return NextResponse.json(
        {
          ok: false,
          error: "This booking does not have a cancellation deadline.",
        },
        { status: 403 }
      );
    }

    const cancelUntil = new Date(booking.cancel_until);

    if (!Number.isFinite(cancelUntil.getTime()) || now > cancelUntil) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Free cancellation is no longer available for this booking.",
        },
        { status: 403 }
      );
    }

    if (!["booked", "pending_payment"].includes(String(booking.status))) {
      return NextResponse.json(
        {
          ok: false,
          error: "This booking can no longer be cancelled online.",
        },
        { status: 403 }
      );
    }

    if (booking.payment_status !== "paid") {
      return NextResponse.json(
        {
          ok: false,
          error: "This booking has not been paid yet.",
        },
        { status: 403 }
      );
    }

    const revolutOrderId =
      String(booking.revolut_order_id || "").trim() ||
      String(booking.payment_reference || "").trim();

    if (!revolutOrderId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing Revolut order ID for refund.",
        },
        { status: 500 }
      );
    }

    const amount = Number(booking.total_amount || 0);
    const currency = String(booking.currency || "EUR").toUpperCase();

    await supabase
      .from("bookings")
      .update({
        refund_status: "pending",
        refund_error: null,
      })
      .eq("id", booking.id);

    let refundData: any = null;

    try {
      refundData = await refundRevolutOrder({
        orderId: revolutOrderId,
        amount,
        currency,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown refund error.";

      await supabase
        .from("bookings")
        .update({
          refund_status: "failed",
          refund_error: message,
        })
        .eq("id", booking.id);

      return NextResponse.json(
        {
          ok: false,
          error:
            "The booking could not be refunded automatically. Please contact us.",
        },
        { status: 500 }
      );
    }

    const refundOrderId =
      refundData?.id ||
      refundData?.order_id ||
      refundData?.refund_id ||
      null;

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason || "Customer cancelled online",
        refund_status: "succeeded",
        refund_amount: amount,
        revolut_refund_order_id: refundOrderId,
        refunded_at: new Date().toISOString(),
        refund_error: null,
      })
      .eq("id", booking.id);

    if (updateError) {
      console.error("Booking refunded but update failed:", updateError);

      return NextResponse.json(
        {
          ok: false,
          error:
            "Refund was processed, but booking update failed. Please check admin.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Booking cancelled and refunded successfully.",
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected cancellation error.",
      },
      { status: 500 }
    );
  }
}