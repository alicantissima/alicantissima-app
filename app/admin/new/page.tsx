


import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewBookingForm from "./NewBookingForm";

function generateBookingCode() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `WALK-${num}`;
}

export default async function NewBookingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6">Sem sessão.</div>;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return <div className="p-6">Acesso negado.</div>;
  }

  async function createBooking(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const city = String(formData.get("city") ?? "").trim();
    const checkoutTime = String(formData.get("checkout_time") ?? "").trim();

    const bags = Number(formData.get("bags") ?? 0);
    const showers = Number(formData.get("showers") ?? 0);
    const combos = Number(formData.get("combos") ?? 0);

    const BAG_PRICE = 8;
    const SHOWER_PRICE = 12;
    const COMBO_PRICE = 18;

    const bookingCode = generateBookingCode();

    const totalAmount =
      bags * BAG_PRICE + showers * SHOWER_PRICE + combos * COMBO_PRICE;

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        booking_code: bookingCode,
        customer_name: name || "Walk-in",
        customer_email: email || "walkin@alicantissima.es",
        total_amount: totalAmount,
        currency: "EUR",
        status: "inside",
      })
      .select()
      .single();

    if (bookingError) {
      throw new Error(`Erro ao criar booking: ${bookingError.message}`);
    }

    const now = new Intl.DateTimeFormat("pt-PT", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());

    const baseMeta = {
      ...(city ? { city } : {}),
      ...(checkoutTime ? { checkout_time: checkoutTime } : {}),
      time_in: now,
    };

    const items = [];

    if (bags > 0) {
      items.push({
        booking_id: booking.id,
        title: "Luggage",
        quantity: bags,
        unit_price: BAG_PRICE,
        line_total: bags * BAG_PRICE,
        product_type: "luggage",
        meta: { ...baseMeta, product_code: "luggage" },
      });
    }

    if (showers > 0) {
      items.push({
        booking_id: booking.id,
        title: "Shower",
        quantity: showers,
        unit_price: SHOWER_PRICE,
        line_total: showers * SHOWER_PRICE,
        product_type: "shower",
        meta: { ...baseMeta, product_code: "shower" },
      });
    }

    if (combos > 0) {
      items.push({
        booking_id: booking.id,
        title: "Luggage + Shower",
        quantity: combos,
        unit_price: COMBO_PRICE,
        line_total: combos * COMBO_PRICE,
        product_type: "combo",
        meta: { ...baseMeta, product_code: "combo" },
      });
    }

    if (items.length > 0) {
      const { error: itemsError } = await supabase
        .from("booking_items")
        .insert(items);

      if (itemsError) {
        throw new Error(`Erro ao criar items: ${itemsError.message}`);
      }
    }

    redirect("/admin");
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Nova reserva</h1>

        <Link href="/admin" className="text-sm underline">
          ← Voltar
        </Link>
      </div>

      <NewBookingForm action={createBooking} />
    </main>
  );
}