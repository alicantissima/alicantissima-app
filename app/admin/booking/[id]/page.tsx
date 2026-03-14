


import BookingQr from "@/components/booking-qr";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CancelBookingButton from "@/components/cancel-booking-button";
import CheckInBookingButton from "@/components/check-in-booking-button";
import FinishBookingButton from "@/components/finish-booking-button";
import Link from "next/link";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

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
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <Link href="/admin" className="text-sm text-gray-600 hover:text-black">
        ← Voltar ao admin
      </Link>

      <section className="rounded-xl border p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Reserva</h1>
            <p className="text-sm text-gray-500">
              Gestão operacional da reserva
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {booking.status === "pending" && (
              <>
                <CheckInBookingButton
                  bookingId={booking.id}
                  currentStatus={booking.status}
                  serviceDate={booking.service_date}
                  checkInTime={booking.check_in_time}
                />
                <CancelBookingButton bookingId={booking.id} />
              </>
            )}

            {booking.status === "inside" && (
              <FinishBookingButton
                bookingId={booking.id}
                currentStatus={booking.status}
                checkOutTime={booking.check_out_time}
              />
            )}

            <Link
              href="/desk"
              className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
            >
              Return
            </Link>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border p-2">
            <div className="text-xs text-gray-500">Código</div>
            <div className="font-semibold">{booking.booking_code}</div>
          </div>

          <div className="rounded-lg border p-2">
            <div className="text-xs text-gray-500">Estado</div>
            <div className="font-semibold uppercase">{booking.status}</div>
          </div>

          <div className="rounded-lg border p-2">
            <div className="text-xs text-gray-500">Data de serviço</div>
            <div className="font-semibold">{formatDate(booking.service_date)}</div>
          </div>

          <div className="rounded-lg border p-2">
            <div className="text-xs text-gray-500">Criada em</div>
            <div className="font-semibold">{formatDateTime(booking.created_at)}</div>
          </div>

          <div className="rounded-lg border p-2">
            <div className="text-xs text-gray-500">Check-in</div>
            <div className="font-semibold">{formatDateTime(booking.check_in_time)}</div>
          </div>

          <div className="rounded-lg border p-2">
            <div className="text-xs text-gray-500">Check-out</div>
            <div className="font-semibold">{formatDateTime(booking.check_out_time)}</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="rounded-xl border p-4 space-y-2">
          <h2 className="text-lg font-semibold">Cliente</h2>

          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Nome:</span> {booking.customer_name}
            </p>

            <p className="break-all">
              <span className="font-medium">Email:</span> {booking.customer_email}
            </p>

            <p>
              <span className="font-medium">Telefone:</span>{" "}
              {booking.customer_phone || "-"}
            </p>
          </div>
        </div>

        <div className="rounded-xl border p-4 space-y-3 h-fit">
          <h2 className="text-lg font-semibold">QR</h2>

          <div className="max-w-[180px]">
            <BookingQr code={booking.booking_code} />
          </div>
        </div>
      </section>

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