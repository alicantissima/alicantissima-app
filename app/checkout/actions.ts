


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
    const serviceDate = new Date().toISOString().split("T")[0];

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