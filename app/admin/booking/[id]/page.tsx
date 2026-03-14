


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

type BookingItem = {
  id: string;
  title?: string | null;
  quantity: number;
  line_total: number;
  product_type?: string | null;
  meta?: {
    date?: string;
    dropOffTime?: string | null;
    pickUpTime?: string | null;
    showerTime?: string | null;
    comments?: string | null;
    breakdown?: Array<{
      label: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  } | null;
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

function formatMoney(amount?: number | null, currency?: string | null) {
  const value = Number(amount ?? 0);
  return `${value.toFixed(2)} ${currency ?? "EUR"}`;
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

  const { data: bookingItems = [] } = await supabase
    .from("booking_items")
    .select("id, title, quantity, line_total, product_type, meta")
    .eq("booking_id", booking.id)
    .order("id", { ascending: true });

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4">
      <section className="rounded-xl border p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/desk"
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Return
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-2">
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
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold">Reserva</h1>
          <p className="text-sm text-gray-500">Gestão operacional da reserva</p>
        </div>
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Cliente</h2>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Nome</div>
            <div className="font-semibold">{booking.customer_name}</div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Telefone</div>
            <div className="font-semibold">{booking.customer_phone || "-"}</div>
          </div>

          <div className="rounded-lg border p-3 md:col-span-2">
            <div className="text-xs text-gray-500">Email</div>
            <div className="font-semibold break-all">{booking.customer_email}</div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Cidade</div>
            <div className="font-semibold">{booking.city || "-"}</div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Origem</div>
            <div className="font-semibold">{booking.source || "-"}</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Dados da reserva</h2>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Código</div>
            <div className="font-semibold">{booking.booking_code}</div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Estado</div>
            <div className="font-semibold uppercase">{booking.status}</div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Data de serviço</div>
            <div className="font-semibold">{formatDate(booking.service_date)}</div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Total</div>
            <div className="font-semibold">
              {formatMoney(booking.total_amount, booking.currency)}
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Criada em</div>
            <div className="font-semibold">{formatDateTime(booking.created_at)}</div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Check-in real</div>
            <div className="font-semibold">{formatDateTime(booking.check_in_time)}</div>
          </div>

          <div className="rounded-lg border p-3">
            <div className="text-xs text-gray-500">Check-out real</div>
            <div className="font-semibold">{formatDateTime(booking.check_out_time)}</div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Produtos comprados</h2>

        {bookingItems.length === 0 ? (
          <p className="text-sm text-gray-500">Sem items associados.</p>
        ) : (
          <div className="space-y-3">
            {(bookingItems as BookingItem[]).map((item) => (
              <div key={item.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-semibold">
                    {item.title || item.product_type || "Item"}
                  </div>
                  <div className="text-sm font-medium">
                    {Number(item.line_total ?? 0).toFixed(2)} €
                  </div>
                </div>

                <div className="grid gap-2 text-sm md:grid-cols-4">
                  <div>
                    <span className="text-gray-500">Qtd:</span> {item.quantity}
                  </div>

                  <div>
                    <span className="text-gray-500">Entrega:</span>{" "}
                    {item.meta?.dropOffTime || "-"}
                  </div>

                  <div>
                    <span className="text-gray-500">Recolha:</span>{" "}
                    {item.meta?.pickUpTime || "-"}
                  </div>

                  <div>
                    <span className="text-gray-500">Duche:</span>{" "}
                    {item.meta?.showerTime || "-"}
                  </div>
                </div>

                {item.meta?.breakdown && item.meta.breakdown.length > 0 && (
                  <div className="rounded-lg bg-gray-50 p-3">
                    <div className="mb-2 text-sm font-medium">Breakdown</div>
                    <div className="space-y-1 text-sm">
                      {item.meta.breakdown.map((b, index) => (
                        <div
                          key={index}
                          className="flex justify-between gap-3"
                        >
                          <span>
                            {b.label} × {b.quantity}
                          </span>
                          <span>{Number(b.totalPrice).toFixed(2)} €</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-[1fr_280px]">
        <section className="rounded-xl border p-4 space-y-2">
          <h2 className="text-lg font-semibold">Notas</h2>

          <p className="text-sm text-gray-700">
            {booking.notes && booking.notes.trim()
              ? booking.notes
              : "Sem notas."}
          </p>
        </section>

        <section className="rounded-xl border p-4 space-y-3 h-fit">
          <h2 className="text-lg font-semibold">QR</h2>

          <div className="max-w-[180px]">
            <BookingQr code={booking.booking_code} />
          </div>
        </section>
      </section>
    </main>
  );
}