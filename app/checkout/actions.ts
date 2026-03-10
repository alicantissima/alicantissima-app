


"use server";

import { createAdminClient } from "@/lib/supabase/admin";

type CheckoutItem = {
  id: string;
  title: string;
  quantity: number | string;
  unitPrice: number | string;
  totalPrice: number | string;
  productType?: string;
  meta?: Record<string, unknown>;
};

type CheckoutPayload = {
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  notes?: string;
  items: CheckoutItem[];
};

function generateBookingCode() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ALI-${random}`;
}

function formatPrice(value: number) {
  return value.toFixed(2);
}

function getServiceDateFromItems(items: Array<{ meta?: Record<string, unknown> }>) {
  const firstDate = items.find((item) => {
    const date = item.meta?.date;
    return typeof date === "string" && date.trim();
  })?.meta?.date;

  if (typeof firstDate === "string" && firstDate.trim()) {
    return firstDate;
  }

  return new Date().toISOString().split("T")[0];
}

function buildConfirmationEmailText(params: {
  customerName: string;
  bookingCode: string;
  items: Array<{
    title: string;
    quantity: number;
    totalPrice: number;
    meta?: Record<string, unknown>;
  }>;
  totalAmount: number;
  notes?: string | null;
}) {
  const lines: string[] = [];

  lines.push(`Hello ${params.customerName},`);
  lines.push("");
  lines.push("Your booking is confirmed.");
  lines.push("");
  lines.push(`Booking code: ${params.bookingCode}`);
  lines.push("");

  lines.push("Booking details:");
  params.items.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.quantity} x ${item.title} - € ${formatPrice(item.totalPrice)}`);

    const date = item.meta?.date;
    const dropOffTime = item.meta?.dropOffTime;
    const pickUpTime = item.meta?.pickUpTime;
    const showerTime = item.meta?.showerTime;
    const comments = item.meta?.comments;

    if (typeof date === "string" && date) {
      lines.push(`   Date: ${date}`);
    }
    if (typeof dropOffTime === "string" && dropOffTime) {
      lines.push(`   Drop-off: ${dropOffTime}`);
    }
    if (typeof pickUpTime === "string" && pickUpTime) {
      lines.push(`   Estimated pick-up: ${pickUpTime}`);
    }
    if (typeof showerTime === "string" && showerTime) {
      lines.push(`   Shower time: ${showerTime}`);
    }
    if (typeof comments === "string" && comments) {
      lines.push(`   Comments: ${comments}`);
    }
  });

  lines.push("");
  lines.push(`Total: € ${formatPrice(params.totalAmount)}`);

  if (params.notes) {
    lines.push("");
    lines.push(`Notes: ${params.notes}`);
  }

  lines.push("");
  lines.push("Payment is made on site, by card or cash.");
  lines.push("");
  lines.push("Alicantissima | Luggage Storage & Shower Lounge");
  lines.push("Alicante");
  lines.push("");
  lines.push("Thank you!");

  return lines.join("\n");
}

async function sendBookingConfirmationEmail(params: {
  customerName: string;
  customerEmail: string;
  bookingCode: string;
  items: Array<{
    title: string;
    quantity: number;
    totalPrice: number;
    meta?: Record<string, unknown>;
  }>;
  totalAmount: number;
  notes?: string | null;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.BOOKING_FROM_EMAIL || "Alicantissima <onboarding@resend.dev>";

  if (!resendApiKey) {
    console.warn("RESEND_API_KEY is missing. Booking email was not sent.");
    return;
  }

  const subject = `Alicantissima booking confirmed – ${params.bookingCode}`;
  const text = buildConfirmationEmailText(params);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [params.customerEmail],
      subject,
      text,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend error: ${response.status} ${errorText}`);
  }
}

export async function submitCheckout(payload: CheckoutPayload) {
  try {
    const customerName = payload.customerName?.trim();
    const customerEmail = payload.customerEmail?.trim();
    const customerPhone = payload.customerPhone?.trim() || null;
    const notes = payload.notes?.trim() || null;

    if (!customerName) {
      return { ok: false, error: "Missing name." };
    }

    if (!customerEmail) {
      return { ok: false, error: "Missing email." };
    }

    const rawItems = payload.items ?? [];

    if (!rawItems.length) {
      return { ok: false, error: "Your booking is empty." };
    }

    const items = rawItems.map((item, index) => {
      const quantity = Number(item.quantity);
      const unitPrice = Number(item.unitPrice);
      const totalPrice = Number(item.totalPrice);

      if (!item.id) {
        throw new Error(`Item ${index + 1} is missing product id.`);
      }

      if (!item.title?.trim()) {
        throw new Error(`Item ${index + 1} is missing title.`);
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new Error(`Item ${index + 1} has invalid quantity.`);
      }

      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error(`Item ${index + 1} has invalid unit price.`);
      }

      if (!Number.isFinite(totalPrice) || totalPrice < 0) {
        throw new Error(`Item ${index + 1} has invalid total price.`);
      }

      return {
        id: item.id,
        title: item.title.trim(),
        quantity,
        unitPrice,
        totalPrice,
        productType: item.productType ?? "booking",
        meta: item.meta ?? {},
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const supabase = createAdminClient();
    const bookingCode = generateBookingCode();
    const serviceDate = getServiceDateFromItems(items);

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        booking_code: bookingCode,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        notes,
        total_amount: totalAmount,
        currency: "EUR",
        status: "pending",
        service_date: serviceDate,
      })
      .select("id, booking_code")
      .single();

    if (bookingError || !booking) {
      console.error("bookingError:", bookingError);
      return {
        ok: false,
        error: bookingError?.message || "Could not create booking.",
      };
    }

    const bookingItems = items.map((item) => ({
      booking_id: booking.id,
      product_id: item.id,
      product_type: item.productType,
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.totalPrice,
      meta: item.meta,
    }));

    const { error: itemsError } = await supabase
      .from("booking_items")
      .insert(bookingItems);

    if (itemsError) {
      console.error("itemsError:", itemsError);

      await supabase.from("bookings").delete().eq("id", booking.id);

      return {
        ok: false,
        error: itemsError.message || "Booking created, but items failed.",
      };
    }

    try {
      await sendBookingConfirmationEmail({
        customerName,
        customerEmail,
        bookingCode: booking.booking_code,
        items: items.map((item) => ({
          title: item.title,
          quantity: item.quantity,
          totalPrice: item.totalPrice,
          meta: item.meta,
        })),
        totalAmount,
        notes,
      });
    } catch (emailError) {
      console.error("booking confirmation email error:", emailError);
    }

    return {
      ok: true,
      bookingCode: booking.booking_code,
    };
  } catch (error) {
    console.error("submitCheckout error:", error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unexpected checkout error.",
    };
  }
}