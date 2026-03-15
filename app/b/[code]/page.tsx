


import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMessages, normalizeLanguage } from "@/lib/i18n";

type PageProps = {
  params: Promise<{
    code: string;
  }>;
};

type BookingRow = {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_email: string;
  notes?: string | null;
  total_amount: number;
  currency: string;
  status: string;
  service_date?: string | null;
  language?: string | null;
};

type BookingItemRow = {
  booking_id: string;
  quantity: number;
  line_total: number;
  title?: string | null;
  product_type?: string | null;
  meta: {
    date?: string;
    dropOffTime?: string | null;
    pickUpTime?: string | null;
    showerTime?: string | null;
    comments?: string | null;
  } | null;
};

function formatPrice(value?: number | null) {
  return Number(value || 0).toFixed(2);
}

function formatHumanDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTimeRange(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/h/g, ":")
    .replace(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/, "$1:$2 – $3:$4");
}

function getQrCodeUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(text)}`;
}

function getLocalizedProductTitle(params: {
  productType?: string | null;
  fallbackTitle?: string | null;
  language?: string | null;
}) {
  const t = getMessages(params.language);

  if (params.productType === "booking") return t.bookLuggageProductName;
  if (params.productType === "shower") return t.bookShowerProductName;
  if (params.productType === "combo") return t.bookComboProductName;

  return params.fallbackTitle || t.itemFallback;
}

export default async function BookingPage({ params }: PageProps) {
  const { code } = await params;
  const bookingCode = code?.trim().toUpperCase();

  if (!bookingCode) notFound();

  const supabase = createAdminClient();

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, booking_code, customer_name, customer_email, notes, total_amount, currency, status, service_date, language")
    .eq("booking_code", bookingCode)
    .maybeSingle<BookingRow>();

  if (bookingError || !booking) {
    notFound();
  }

  const { data: items, error: itemsError } = await supabase
    .from("booking_items")
    .select("booking_id, quantity, line_total, title, product_type, meta")
    .eq("booking_id", booking.id)
    .returns<BookingItemRow[]>();

  if (itemsError) {
    notFound();
  }

  const language = normalizeLanguage(booking.language);
  const t = getMessages(language);

  const appBaseUrl = (
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://app.alicantissima.es"
  ).replace(/\/$/, "");

  const bookingUrl = `${appBaseUrl}/b/${booking.booking_code}`;
  const qrCodeUrl = getQrCodeUrl(bookingUrl);

  const reviewUrl =
    process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
    process.env.GOOGLE_REVIEW_URL ||
    "";

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {t.bookingConfirmedTitle}
          </h1>
          <p className="mt-3 text-base text-neutral-700">
            {t.thankYouBookingCodePrefix}{" "}
            <strong>{booking.booking_code}</strong>.
          </p>
        </section>

        <section className="rounded-[22px] border border-neutral-900 bg-white p-6">
          <h2 className="mb-5 text-center text-xl font-semibold text-neutral-900">
            {t.bookingSummary}
          </h2>

          <p className="mb-4 text-[15px] leading-6 text-neutral-900">
            <strong>{t.nameLabel}</strong> {booking.customer_name}
          </p>

          <div className="space-y-5">
            {items?.map((item, index) => {
              const productTitle = getLocalizedProductTitle({
                productType: item.product_type,
                fallbackTitle: item.title,
                language,
              });

              const date = formatHumanDate(item.meta?.date || booking.service_date);
              const dropOffTime = formatTimeRange(item.meta?.dropOffTime);
              const pickUpTime = formatTimeRange(item.meta?.pickUpTime);
              const showerTime = formatTimeRange(item.meta?.showerTime);
              const comments = item.meta?.comments?.trim();

              return (
                <div
                  key={`${item.booking_id}-${index}`}
                  className="border-b border-neutral-300 pb-5 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-base font-semibold text-neutral-900">
                      {productTitle}
                    </p>
                    <p className="whitespace-nowrap text-base font-semibold text-neutral-900">
                      € {formatPrice(item.line_total)}
                    </p>
                  </div>

                  <p className="mt-1 text-sm text-neutral-500">
                    {t.qtyLabel}: {item.quantity}
                  </p>

                  <div className="mt-3 space-y-1 text-[15px] leading-6 text-neutral-900">
                    {date ? (
                      <p>
                        <strong>{t.dateLabel}</strong> {date}
                      </p>
                    ) : null}

                    {dropOffTime ? (
                      <p>
                        <strong>{t.dropOffLabel}</strong> {dropOffTime}
                      </p>
                    ) : null}

                    {pickUpTime ? (
                      <p>
                        <strong>{t.estimatedPickUpLabel}</strong> {pickUpTime}
                      </p>
                    ) : null}

                    {showerTime ? (
                      <p>
                        <strong>{t.showerTimeLabel}</strong> {showerTime}
                      </p>
                    ) : null}

                    {comments ? (
                      <p>
                        <strong>{t.commentsLabel}:</strong> {comments}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-neutral-300 pt-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg font-semibold text-neutral-900">
                {t.totalLabel}
              </p>
              <p className="whitespace-nowrap text-lg font-semibold text-neutral-900">
                € {formatPrice(booking.total_amount)}
              </p>
            </div>

            <p className="mt-3 text-[15px] leading-6 text-orange-600">
              {t.paymentOnSite}
            </p>

            {booking.notes ? (
              <p className="mt-3 text-[15px] leading-6 text-neutral-700">
                <strong>{t.notes}:</strong> {booking.notes}
              </p>
            ) : null}
          </div>
        </section>

        <section className="text-center">
          <h2 className="mb-2 text-lg font-semibold text-neutral-900">
            {t.checkInQrTitle}
          </h2>
          <p className="mb-4 text-sm text-neutral-500">
            {t.showQrAtReception}
          </p>

          <div className="inline-block rounded-[18px] border border-neutral-900 bg-white p-3">
            <img
              src={qrCodeUrl}
              alt={`${t.qrAltPrefix} ${booking.booking_code}`}
              width={220}
              height={220}
              className="mx-auto rounded-lg"
            />
          </div>
        </section>

        <section className="rounded-[22px] border border-neutral-300 bg-white p-6 text-center">
          <h2 className="mb-2 text-lg font-semibold text-neutral-900">
            {t.installAppTitle}
          </h2>
          <p className="mx-auto max-w-xl text-sm leading-6 text-neutral-600">
            {t.installAppText}
          </p>

          <div className="mt-4">
            <Link
              href={bookingUrl}
              className="inline-flex rounded-full bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800"
            >
              {t.openInApp}
            </Link>
          </div>
        </section>

        {reviewUrl ? (
          <section className="rounded-[22px] border border-neutral-300 bg-white p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold text-neutral-900">
              Enjoyed the service?
            </h2>
            <p className="mx-auto max-w-xl text-sm leading-6 text-neutral-600">
              If everything went well, your Google review helps us a lot.
            </p>

            <div className="mt-4">
              <a
                href={reviewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white hover:bg-neutral-800"
              >
                Leave a Google review
              </a>
            </div>
          </section>
        ) : null}

        <p className="pb-4 text-center text-sm text-neutral-600">
          Alicantissima | Luggage Storage & Shower Lounge
        </p>
      </div>
    </main>
  );
}