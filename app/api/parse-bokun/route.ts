


import { NextRequest, NextResponse } from "next/server";
import { parseBokunEmail } from "@/lib/parseBokunEmail";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushToAll } from "@/lib/push/send-push";


export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    const data = parseBokunEmail(text);

    if (!data.bookingCode) {
      return NextResponse.json({ error: "No booking code" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // evitar duplicados
    const { data: existing } = await supabase
      .from("bookings")
      .select("id")
      .eq("booking_code", data.bookingCode)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "Already exists" });
    }

    const { data: booking, error: bookingError } = await supabase
  .from("bookings")
  .insert({
    booking_code: data.bookingCode,
    customer_name: data.customerName || "Viator Customer",
    customer_email:
      data.email ||
      `${(data.bookingCode || data.extRef || "viator-booking")
        .toString()
        .toLowerCase()}@viator.local`,
    total_amount: data.viatorAmount ?? 0,
    currency: "EUR",
    status: "booked",
    source: "viator",
    payment_method: "viator",
    service_date: data.serviceDate,
  })
  .select("id, booking_code, customer_name, service_date")
  .single();

if (bookingError || !booking) {
  return NextResponse.json(
    { error: bookingError?.message || "Could not create booking" },
    { status: 500 }
  );
}

await sendPushToAll({
  title: "Nova reserva Viator 🔔",
  body: `${booking.booking_code} · ${booking.customer_name || "Cliente Viator"} · ${
    booking.service_date || "sem data"
  }`,
  url: `/desk/booking/${booking.id}`,
});

    return NextResponse.json({ success: true, data });

  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}