


import BookingPass from "@/components/booking-pass";
import FullBrightnessQr from "@/components/full-brightness-qr";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMessages, normalizeLanguage } from "@/lib/i18n";
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

function getPublicStatus(status?: string | null, language?: string | null) {
  const t = getMessages(language);

  switch (status) {
    case "pending":
      return t.confirmed;
    case "inside":
      return t.checkedIn;
    case "finished":
      return t.completed;
    case "cancelled":
      return t.cancelled;
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

function getLocalizedProductTitle(
  item: { title?: string | null; product_type?: string | null },
  language?: string | null
) {
  const t = getMessages(language);
  const type = item.product_type?.toLowerCase();

  if (type === "booking") return t.bookLuggageProductName;
  if (type === "shower") return t.bookShowerProductName;
  if (type === "combo") return t.bookComboProductName;

  return item.title || t.itemFallback;
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
      language,
      service_date,
      check_in_time,
      check_out_time,
      booking_items (
  title,
  product_type,
  quantity,
  line_total
)
    `)
    .eq("booking_code", bookingCode)
    .maybeSingle();

  if (error || !booking) {
    notFound();
  }

  const language = normalizeLanguage(booking.language);
  const t = getMessages(language);

  return (
    <main className="mx-auto max-w-lg p-4 sm:p-6">
      <div className="space-y-5 rounded-3xl border bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-3 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
            {t.bookingPassTitle}
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
              {getPublicStatus(booking.status, language)}
            </span>
          </div>

          <p className="text-sm text-gray-600">{t.showAtReception}</p>
        </div>

        <div className="rounded-2xl border bg-gray-50 p-4 text-center">
          <div className="mb-3 text-sm font-medium text-gray-500">{t.checkInQr}</div>

          <div className="flex justify-center">
            <BookingPass code={booking.booking_code} />
          </div>

          <FullBrightnessQr code={booking.booking_code} label={t.fullBrightnessQr} closeLabel={t.tapAnywhereToClose} />

          <p className="mt-3 text-sm font-medium text-amber-700">{t.paymentOnSite}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl border p-3 sm:col-span-2">
            <div className="text-gray-500">{t.customer}</div>
            <div className="text-base font-semibold text-gray-900">
              {booking.customer_name}
            </div>
          </div>

          {booking.service_date && (
            <div className="rounded-2xl border p-3">
              <div className="text-gray-500">{t.serviceDate}</div>
              <div className="font-semibold text-gray-900">
                {formatDate(booking.service_date)}
              </div>
            </div>
          )}

          {booking.total_amount !== null && booking.total_amount !== undefined && (
            <div className="rounded-2xl border p-3">
              <div className="text-gray-500">{t.total}</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(booking.total_amount)}
              </div>
            </div>
          )}

          {booking.booking_items && booking.booking_items.length > 0 && (
            <div className="rounded-2xl border p-3 sm:col-span-2">
              <div className="mb-2 text-gray-500">{t.products}</div>
              <ul className="space-y-2">
                {booking.booking_items.map((item, index) => (
                  <li key={index} className="flex justify-between gap-4">
                    <span className="text-gray-900">
                      {item.quantity} × {getLocalizedProductTitle(item, language)}
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
              <div className="text-gray-500">{t.checkIn}</div>
              <div className="font-semibold text-gray-900">
                {formatDateTime(booking.check_in_time)}
              </div>
            </div>
          )}

          {booking.check_out_time && (
            <div className="rounded-2xl border p-3">
              <div className="text-gray-500">{t.checkOut}</div>
              <div className="font-semibold text-gray-900">
                {formatDateTime(booking.check_out_time)}
              </div>
            </div>
          )}

          {booking.notes && (
            <div className="rounded-2xl border p-3 sm:col-span-2">
              <div className="text-gray-500">{t.notes}</div>
              <div className="whitespace-pre-wrap font-semibold text-gray-900">
                {booking.notes}
              </div>
            </div>
          )}
        </div>

        <details className="rounded-2xl border p-4">
          <summary className="cursor-pointer text-sm font-semibold text-gray-700">
            {t.moreBookingDetails}
          </summary>

          <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-xl border p-3 sm:col-span-2">
              <div className="text-gray-500">{t.bookingCode}</div>
              <div className="font-semibold break-all text-gray-900">
                {booking.booking_code}
              </div>
            </div>

            <div className="rounded-xl border p-3 sm:col-span-2">
              <div className="text-gray-500">{t.email}</div>
              <div className="font-semibold break-all text-gray-900">
                {booking.customer_email}
              </div>
            </div>

            <div className="rounded-xl border p-3 sm:col-span-2">
              <div className="text-gray-500">{t.phone}</div>
              <div className="font-semibold break-all text-gray-900">
                {booking.customer_phone || "-"}
              </div>
            </div>

            <div className="rounded-xl border p-3 sm:col-span-2">
              <div className="text-gray-500">{t.reservationCreated}</div>
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