


import BookingPass from "@/components/booking-pass";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import FullBrightnessQr from "@/components/full-brightness-qr";

type PageProps = {
  params: Promise<{
    code: string;
  }>;
};

function formatDateTime(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDate(value?: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrency(amount?: number | string | null) {
  if (amount === null || amount === undefined) return "";
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(amount));
}

function getPublicStatus(status?: string | null) {
  switch (status) {
    case "pending":
      return "Confirmed";
    case "inside":
      return "Checked-in";
    case "finished":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status || "-";
  }
}

function getStatusClasses(status?: string | null) {
  switch (status) {
    case "pending":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "inside":
      return "bg-sky-50 text-sky-700 border-sky-200";
    case "finished":
      return "bg-gray-100 text-gray-700 border-gray-200";
    case "cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
}

export default async function BookingByCodePage({ params }: PageProps) {
  const supabase = createAdminClient();
  const { code } = await params;
  const bookingCode = code.trim().toUpperCase();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(`
      id,
      booking_code,
      customer_name,
      customer_email,
      customer_phone,
      notes,
      status,
      created_at,
      updated_at,
      total_amount,
      currency,
      service_date,
      check_in_time,
      check_out_time,
      booking_items (
        title,
        quantity,
        line_total
      )
    `)
    .eq("booking_code", bookingCode)
    .maybeSingle();

  if (error || !booking) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-lg p-4 sm:p-6">
      <div className="space-y-5 rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
            Alicantíssima Booking Pass
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            {booking.booking_code}
          </h1>

          <div className="flex justify-center">
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClasses(
                booking.status
              )}`}
            >
              {getPublicStatus(booking.status)}
            </span>
          </div>

          <p className="text-sm text-gray-600">
            Show this screen at reception for faster check-in.
          </p>
        </div>

        <div className="rounded-2xl border bg-gray-50 p-4 text-center">
          <div className="mb-3 text-sm font-medium text-gray-500">Check-in QR</div>

          <div className="flex justify-center">
            <BookingPass code={booking.booking_code} />
          </div>

          <FullBrightnessQr code={booking.booking_code} />

          <p className="mt-3 text-sm font-medium text-amber-700">
            Payment is made on site, by card or cash.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border p-3 sm:col-span-2">
            <div className="text-gray-500">Customer</div>
            <div className="text-base font-semibold text-gray-900">
              {booking.customer_name}
            </div>
          </div>

          {booking.service_date && (
            <div className="rounded-2xl border p-3">
              <div className="text-gray-500">Service date</div>
              <div className="font-semibold text-gray-900">
                {formatDate(booking.service_date)}
              </div>
            </div>
          )}

          {booking.total_amount !== null && booking.total_amount !== undefined && (
            <div className="rounded-2xl border p-3">
              <div className="text-gray-500">Total</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(booking.total_amount)}
              </div>
            </div>
          )}

          {booking.booking_items && booking.booking_items.length > 0 && (
            <div className="rounded-2xl border p-3 sm:col-span-2">
              <div className="mb-2 text-gray-500">Products</div>
              <ul className="space-y-2">
                {booking.booking_items.map((item, index) => (
                  <li key={index} className="flex justify-between gap-4">
                    <span className="text-gray-900">
                      {item.quantity} × {item.title}
                    </span>
                    <span className="whitespace-nowrap font-medium text-gray-900">
                      {formatCurrency(item.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {booking.check_in_time && (
            <div className="rounded-2xl border p-3">
              <div className="text-gray-500">Check-in</div>
              <div className="font-semibold text-gray-900">
                {formatDateTime(booking.check_in_time)}
              </div>
            </div>
          )}

          {booking.check_out_time && (
            <div className="rounded-2xl border p-3">
              <div className="text-gray-500">Check-out</div>
              <div className="font-semibold text-gray-900">
                {formatDateTime(booking.check_out_time)}
              </div>
            </div>
          )}

          {booking.notes && (
            <div className="rounded-2xl border p-3 sm:col-span-2">
              <div className="text-gray-500">Notes</div>
              <div className="whitespace-pre-wrap font-semibold text-gray-900">
                {booking.notes}
              </div>
            </div>
          )}
        </div>

        <details className="rounded-2xl border p-4">
          <summary className="cursor-pointer text-sm font-semibold text-gray-700">
            More booking details
          </summary>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border p-3 sm:col-span-2">
              <div className="text-gray-500">Booking code</div>
              <div className="font-semibold break-all text-gray-900">
                {booking.booking_code}
              </div>
            </div>

            <div className="rounded-xl border p-3 sm:col-span-2">
              <div className="text-gray-500">Email</div>
              <div className="font-semibold break-all text-gray-900">
                {booking.customer_email}
              </div>
            </div>

            <div className="rounded-xl border p-3 sm:col-span-2">
              <div className="text-gray-500">Phone</div>
              <div className="font-semibold break-all text-gray-900">
                {booking.customer_phone || "-"}
              </div>
            </div>

            <div className="rounded-xl border p-3 sm:col-span-2">
              <div className="text-gray-500">Reservation created</div>
              <div className="font-semibold text-gray-900">
                {formatDateTime(booking.created_at)}
              </div>
            </div>
          </div>
        </details>
      </div>
    </main>
  );
}