


import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMessages, normalizeLanguage } from "@/lib/i18n";

type SuccessSearchParams = Promise<{ code?: string }>;

type BookingItem = {
  id: string;
  title: string | null;
  quantity: number;
  line_total: number;
  product_type: string | null;
  meta: {
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

function getBaseUrl() {
  return (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SuccessSearchParams;
}) {
  const params = await searchParams;
  const code = params.code?.trim();

  if (!code) {
    const t = getMessages("en");

    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="mb-4 text-3xl font-semibold">{t.bookingConfirmedTitle}</h1>
        <p className="text-gray-600">{t.bookingCodeNotFound}</p>

        <div className="mt-8">
          <Link
            href="/book-luggage?lang=en"
            className="inline-block rounded-xl border border-black px-6 py-3 font-semibold transition hover:bg-black hover:text-white"
          >
            {t.backToBooking}
          </Link>
        </div>
      </main>
    );
  }

  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, booking_code, customer_name, total_amount, currency, language")
    .eq("booking_code", code)
    .single();

  const language = normalizeLanguage(booking?.language);
  const t = getMessages(language);

  const { data: items } = booking
    ? await supabase
        .from("booking_items")
        .select("id, title, quantity, line_total, product_type, meta")
        .eq("booking_id", booking.id)
    : { data: [] };

  const bookingItems = (items ?? []) as BookingItem[];

  const firstMeta = bookingItems.find((item) => item.meta)?.meta ?? null;
  const bookingDate = firstMeta?.date ?? null;
  const dropOffTime = firstMeta?.dropOffTime ?? null;
  const pickUpTime = firstMeta?.pickUpTime ?? null;
  const showerTime = firstMeta?.showerTime ?? null;

  const customerBookingUrl = `${getBaseUrl()}/b/${encodeURIComponent(code)}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    customerBookingUrl
  )}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center">
      <h1 className="mb-4 text-3xl font-semibold">{t.bookingConfirmedTitle}</h1>

      <p className="text-gray-600">
        {t.thankYouBookingCodePrefix} <strong>{code}</strong>.
      </p>

      <p className="mt-2 text-sm text-gray-500">{t.keepCodeForCheckIn}</p>

      <p className="mt-2 text-sm text-gray-500">{t.confirmationEmailSent}</p>

      {booking && (
        <section className="mx-auto mt-8 max-w-xl rounded-2xl border p-6 text-left">
          <h2 className="mb-4 text-center text-xl font-bold">{t.bookingSummary}</h2>

          <div className="space-y-2 text-sm">
            <p>
              <strong>{t.nameLabel}</strong> {booking.customer_name}
            </p>

            {bookingDate && (
              <p>
                <strong>{t.dateLabel}</strong> {bookingDate}
              </p>
            )}

            {dropOffTime && (
              <p>
                <strong>{t.dropOffLabel}</strong> {dropOffTime}
              </p>
            )}

            {pickUpTime && (
              <p>
                <strong>{t.estimatedPickUpLabel}</strong> {pickUpTime}
              </p>
            )}

            {showerTime && (
              <p>
                <strong>{t.showerTimeLabel}</strong> {showerTime}
              </p>
            )}
          </div>

          <div className="mt-5 border-t pt-4">
            <div className="space-y-3">
              {bookingItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="font-semibold">
                      {t.bookLuggageProductName}
                    </p>
                    <p className="text-gray-500">
                      {t.qtyLabel} {item.quantity}
                    </p>
                  </div>
                  <div className="font-semibold">€ {Number(item.line_total).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t pt-4 text-sm">
            <p>
              <strong>{t.totalLabel}</strong> € {Number(booking.total_amount).toFixed(2)}
            </p>
          </div>

          <p className="mt-5 text-sm font-medium text-amber-700">{t.paymentOnSite}</p>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">{t.checkInQr}</h2>
        <p className="mb-4 text-sm text-gray-500">{t.showQrAtReception}</p>

        <div className="flex justify-center">
          <img
            src={qrSrc}
            alt={`${t.qrAltPrefix} ${code}`}
            className="rounded-2xl border p-3"
            width={220}
            height={220}
          />
        </div>
      </section>

      <div className="mt-8">
        <Link
          href={`/book-luggage?lang=${language}`}
          className="inline-block rounded-xl border border-black px-6 py-3 font-semibold transition hover:bg-black hover:text-white"
        >
          {t.backToBooking}
        </Link>
      </div>
    </main>
  );
}