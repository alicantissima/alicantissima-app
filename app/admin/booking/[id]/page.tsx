


import BookingQr from "@/components/booking-qr";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CancelBookingButton from "@/components/cancel-booking-button";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BookingPage({ params }: PageProps) {
  const supabase = await createClient();
  const { id } = await params;

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !booking) {
    notFound();
  }

  return (
    <main className="space-y-4 p-4 max-w-5xl">

      {/* voltar */}
      <Link
        href="/admin"
        className="text-sm text-gray-600 hover:text-black"
      >
        ← Voltar ao admin
      </Link>

      {/* reserva */}
      <section className="rounded-xl border p-4 space-y-3">
        <h1 className="text-xl font-bold">Reserva</h1>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-2">
            <div className="text-xs text-gray-500">Código</div>
            <div className="font-semibold">{booking.booking_code}</div>
          </div>

          <div className="rounded-lg border p-2">
            <div className="text-xs text-gray-500">Estado</div>
            <div className="font-semibold uppercase">{booking.status}</div>
          </div>
        </div>

        {booking.status === "pending" && (
          <CancelBookingButton bookingId={booking.id} />
        )}
      </section>

      {/* cliente + qr */}
      <section className="grid gap-4 md:grid-cols-[1fr_280px]">

        {/* cliente */}
        <div className="rounded-xl border p-4 space-y-2">
          <h2 className="text-lg font-semibold">Cliente</h2>

          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Nome:</span>{" "}
              {booking.customer_name}
            </p>

            <p className="break-all">
              <span className="font-medium">Email:</span>{" "}
              {booking.customer_email}
            </p>

            <p>
              <span className="font-medium">Telefone:</span>{" "}
              {booking.customer_phone || "-"}
            </p>
          </div>
        </div>

        {/* qr */}
        <div className="rounded-xl border p-4 space-y-3 h-fit">
          <h2 className="text-lg font-semibold">QR</h2>

          <div className="max-w-[180px]">
            <BookingQr code={booking.booking_code} />
          </div>
        </div>

      </section>

      {/* notas */}
      <section className="rounded-xl border p-4 space-y-2">
        <h2 className="text-lg font-semibold">Notas</h2>

        <p className="text-sm text-gray-700">
          {booking.notes && booking.notes.trim()
            ? booking.notes
            : "Sem notas."}
        </p>
      </section>

    </main>
  );
}