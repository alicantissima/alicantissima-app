


import { NextRequest, NextResponse } from "next/server";
import { parseBokunEmail } from "@/lib/parseBokunEmail";
import { createAdminClient } from "@/lib/supabase/admin";

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

    await supabase.from("bookings").insert({
  booking_code: data.bookingCode,
  customer_name: data.customerName,
  customer_email: data.email,
  total_amount: data.viatorAmount,
  currency: "EUR",
  status: "booked",
  source: "viator",
  payment_method: "viator",
  service_date: data.serviceDate,
});

    return NextResponse.json({ success: true, data });

  } catch (err) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}