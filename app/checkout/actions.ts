

"use server";

import { createClient } from "@/lib/supabase/server";

type CheckoutItem = {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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

export async function submitCheckout(payload: CheckoutPayload) {
  try {
    const customerName = payload.customerName?.trim();
    const customerEmail = payload.customerEmail?.trim();
    const customerPhone = payload.customerPhone?.trim() || null;
    const notes = payload.notes?.trim() || null;
    const items = payload.items ?? [];

    if (!customerName) {
      return { ok: false, error: "Missing name." };
    }

    if (!customerEmail) {
      return { ok: false, error: "Missing email." };
    }

    if (!items.length) {
      return { ok: false, error: "Your booking is empty." };
    }

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.totalPrice || 0),
      0
    );

    const supabase = await createClient();
    const bookingCode = generateBookingCode();

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
      })
      .select("id, booking_code")
      .single();

    if (bookingError || !booking) {
      console.error("bookingError:", bookingError);
      return { ok: false, error: "Could not create booking." };
    }

    const bookingItems = items.map((item) => ({
      booking_id: booking.id,
      product_id: item.id,
      product_type: item.productType ?? "booking",
      title: item.title,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.totalPrice,
      meta: item.meta ?? {},
    }));

    const { error: itemsError } = await supabase
      .from("booking_items")
      .insert(bookingItems);

    if (itemsError) {
      console.error("itemsError:", itemsError);
      return { ok: false, error: "Booking created, but items failed." };
    }

    return {
      ok: true,
      bookingCode: booking.booking_code,
    };
  } catch (error) {
    console.error("submitCheckout error:", error);
    return { ok: false, error: "Unexpected checkout error." };
  }
}