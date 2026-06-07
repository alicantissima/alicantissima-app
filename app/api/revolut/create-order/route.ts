


import { NextRequest, NextResponse } from "next/server";

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
        { ok: false, error: "REVOLUT_SECRET_KEY is missing." },
        { status: 500 }
      );
    }

const body = await request.json().catch(() => ({}));
    console.log("REVOLUT BODY:", body);

    const amountInCents = toCents(body.amount);
    const currency = String(body.currency || "EUR").toUpperCase();
    const bookingCode = String(body.bookingCode || "").trim();
    const customerEmail = String(body.customerEmail || "").trim();
    const customerName = String(body.customerName || "").trim();

    if (!amountInCents) {
      return NextResponse.json(
        { ok: false, error: "Invalid amount." },
        { status: 400 }
      );
    }

    const appBaseUrl = getAppBaseUrl();

    const description = bookingCode
      ? `Alicantissima booking ${bookingCode}`
      : "Alicantissima booking";

    const response = await fetch("https://merchant.revolut.com/api/orders", {
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
        redirect_url: `${appBaseUrl}/checkout/success${
          bookingCode ? `?code=${encodeURIComponent(bookingCode)}` : ""
        }`,
        merchant_order_data: {
          reference: bookingCode || `ALI-${Date.now()}`,
        },
        metadata: {
          bookingCode,
          customerEmail,
          customerName,
        },
      }),
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          error: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      ok: true,
      order: data,
      order_id: data?.id,
      checkout_url: data?.checkout_url,
    });
  } catch (error) {
    console.error("Revolut create order error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unexpected Revolut error.",
      },
      { status: 500 }
    );
  }
}