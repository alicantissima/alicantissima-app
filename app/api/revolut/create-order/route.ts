


import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getAppBaseUrl() {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://app.alicantissima.es"
  ).replace(/\/$/, "");
}

function toCents(value: unknown) {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return 0;
  }

  return Math.round(amount * 100);
}

export async function POST(request: NextRequest) {
  try {
    const secretKey = process.env.REVOLUT_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "REVOLUT_SECRET_KEY is missing.",
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const bookingCode = String(body.bookingCode || "").trim();

    if (!bookingCode) {
      return NextResponse.json(
        {
          ok: false,
          error: "Booking code is required.",
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    /*
     * The booking stored in Supabase is the source of truth.
     * We do not trust amount, currency, name or email sent by the browser.
     */
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
          id,
          booking_code,
          customer_email,
          customer_name,
          total_amount,
          currency,
          status,
          payment_status,
          revolut_order_id,
          revolut_checkout_url
        `
      )
      .eq("booking_code", bookingCode)
      .maybeSingle();

    if (bookingError) {
      console.error("Failed to load booking:", bookingError);

      return NextResponse.json(
        {
          ok: false,
          error: "Failed to load booking.",
          details: bookingError.message,
        },
        { status: 500 }
      );
    }

    if (!booking) {
      return NextResponse.json(
        {
          ok: false,
          error: "Booking not found.",
        },
        { status: 404 }
      );
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json(
        {
          ok: false,
          error: "Booking is already paid.",
        },
        { status: 409 }
      );
    }

    /*
     * Never create a second Revolut order for the same booking.
     */
    if (booking.revolut_order_id) {
      if (!booking.revolut_checkout_url) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "This booking already has a Revolut order but no checkout URL.",
            order_id: booking.revolut_order_id,
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        ok: true,
        reused: true,
        order_id: booking.revolut_order_id,
        checkout_url: booking.revolut_checkout_url,
      });
    }

    const amountInCents = toCents(booking.total_amount);
    const currency = String(booking.currency || "EUR").toUpperCase();
    const customerEmail = String(booking.customer_email || "").trim();
    const customerName = String(booking.customer_name || "").trim();

    if (!amountInCents) {
      return NextResponse.json(
        {
          ok: false,
          error: "Invalid booking amount.",
        },
        { status: 400 }
      );
    }

    const appBaseUrl = getAppBaseUrl();

    const description = `Alicantissima booking ${bookingCode}`;

    const revolutResponse = await fetch(
      "https://merchant.revolut.com/api/orders",
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
          description,

          redirect_url: `${appBaseUrl}/checkout/success?code=${encodeURIComponent(
            bookingCode
          )}`,

          merchant_order_data: {
            reference: bookingCode,
          },

          metadata: {
            bookingCode,
            bookingId: booking.id,
            expectedAmount: amountInCents,
            currency,
            customerEmail,
            customerName,
          },
        }),
        cache: "no-store",
      }
    );

    const revolutData = await revolutResponse.json().catch(() => null);

    if (!revolutResponse.ok) {
      console.error("Revolut order creation failed:", revolutData);

      return NextResponse.json(
        {
          ok: false,
          status: revolutResponse.status,
          error: revolutData,
        },
        { status: revolutResponse.status }
      );
    }

    const orderId = revolutData?.id
      ? String(revolutData.id)
      : "";

    const checkoutUrl = revolutData?.checkout_url
      ? String(revolutData.checkout_url)
      : "";

    if (!orderId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Revolut did not return an order ID.",
        },
        { status: 502 }
      );
    }

    /*
     * Save the Revolut order only if this booking still has no order.
     * This reduces the risk of two simultaneous requests overwriting
     * each other.
     */
    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        revolut_order_id: orderId,
        revolut_checkout_url: checkoutUrl || null,
        payment_status: "pending",
        payment_method: "revolut",
      })
      .eq("id", booking.id)
      .is("revolut_order_id", null)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error(
        "Failed to save Revolut order on booking:",
        updateError
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "Revolut order created, but failed to save it on booking.",
          revolut_order_id: orderId,
          checkout_url: checkoutUrl,
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    /*
     * Another request may have created an order simultaneously.
     */
    if (!updatedBooking) {
      const { data: latestBooking, error: latestBookingError } =
        await supabase
          .from("bookings")
          .select("revolut_order_id, revolut_checkout_url")
          .eq("id", booking.id)
          .maybeSingle();

      if (
        latestBookingError ||
        !latestBooking?.revolut_order_id
      ) {
        console.error(
          "Could not recover existing Revolut order:",
          latestBookingError
        );

        return NextResponse.json(
          {
            ok: false,
            error:
              "A Revolut order already exists, but it could not be recovered.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        ok: true,
        reused: true,
        order_id: latestBooking.revolut_order_id,
        checkout_url: latestBooking.revolut_checkout_url,
      });
    }

    return NextResponse.json({
      ok: true,
      reused: false,
      order: revolutData,
      order_id: orderId,
      checkout_url: checkoutUrl,
    });
  } catch (error) {
    console.error("Revolut create order error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected Revolut error.",
      },
      { status: 500 }
    );
  }
}