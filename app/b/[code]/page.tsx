


import BookingPass from "@/components/booking-pass";
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";

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
    case "checked_in":
      return "Checked-in";
    case "finished":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status || "-";
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
      <div className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Alicantíssima Booking</h1>
          <p className="text-sm text-gray-600">
            Please show this page at reception if needed.
          </p>
        </div>

        <div className="rounded-xl border p-4 text-center">
  <div className="mb-3 text-sm text-gray-500">QR Code</div>

  <div className="flex justify-center">
    <BookingPass code={booking.booking_code} />
  </div>

  <p className="mt-2 text-xs text-gray-500">
    Payment is made on site, by card or cash.
  </p>
</div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-sm">
          <div className="rounded-xl border p-3">
            <div className="text-gray-500">Booking code</div>
            <div className="font-semibold">{booking.booking_code}</div>
          </div>

          <div className="rounded-xl border p-3">
            <div className="text-gray-500">Status</div>
            <div className="font-semibold">{getPublicStatus(booking.status)}</div>
          </div>

          <div className="rounded-xl border p-3 sm:col-span-2">
            <div className="text-gray-500">Customer</div>
            <div className="font-semibold">{booking.customer_name}</div>
          </div>

          <div className="rounded-xl border p-3 sm:col-span-2">
            <div className="text-gray-500">Email</div>
            <div className="font-semibold break-all">{booking.customer_email}</div>
          </div>

          <div className="rounded-xl border p-3 sm:col-span-2">
            <div className="text-gray-500">Phone</div>
            <div className="font-semibold break-all">
              {booking.customer_phone || "-"}
            </div>
          </div>

          {booking.service_date && (
            <div className="rounded-xl border p-3">
              <div className="text-gray-500">Service date</div>
              <div className="font-semibold">{formatDate(booking.service_date)}</div>
            </div>
          )}

          {booking.total_amount !== null && booking.total_amount !== undefined && (
            <div className="rounded-xl border p-3">
              <div className="text-gray-500">Total</div>
              <div className="font-semibold">
                {formatCurrency(booking.total_amount)}
              </div>
            </div>
          )}

          {booking.check_in_time && (
            <div className="rounded-xl border p-3">
              <div className="text-gray-500">Check-in</div>
              <div className="font-semibold">
                {formatDateTime(booking.check_in_time)}
              </div>
            </div>
          )}

          {booking.check_out_time && (
            <div className="rounded-xl border p-3">
              <div className="text-gray-500">Check-out</div>
              <div className="font-semibold">
                {formatDateTime(booking.check_out_time)}
              </div>
            </div>
          )}

          {booking.booking_items && booking.booking_items.length > 0 && (
            <div className="rounded-xl border p-3 sm:col-span-2">
              <div className="mb-2 text-gray-500">Products</div>
              <ul className="space-y-1">
                {booking.booking_items.map((item, index) => (
                  <li key={index} className="flex justify-between gap-4">
                    <span>
                      {item.quantity} × {item.title}
                    </span>
                    <span className="whitespace-nowrap">
                      {formatCurrency(item.line_total)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {booking.notes && (
            <div className="rounded-xl border p-3 sm:col-span-2">
              <div className="text-gray-500">Notes</div>
              <div className="font-semibold whitespace-pre-wrap">
                {booking.notes}
              </div>
            </div>
          )}

          <div className="rounded-xl border p-3 sm:col-span-2">
            <div className="text-gray-500">Reservation created</div>
            <div className="font-semibold">{formatDateTime(booking.created_at)}</div>
          </div>
        </div>
      </div>
    </main>
  );
}