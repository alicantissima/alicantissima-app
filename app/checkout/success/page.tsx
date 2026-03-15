


import { createAdminClient } from "@/lib/supabase/admin";
import { getMessages, normalizeLanguage } from "@/lib/i18n";
import InstallAppButton from "@/components/install-app-button";

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
        <h1 className="mb-4 text-2xl font-semibold text-gray-900">
          {t.bookingConfirmedTitle}
        </h1>
        <p className="text-gray-600">{t.bookingCodeNotFound}</p>

        <section className="mx-auto mt-8 max-w-xl rounded-3xl border bg-white p-5 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {t.installAppTitle}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{t.installAppText}</p>
          <div className="mt-4 flex justify-center">
            <InstallAppButton />
          </div>
        </section>
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
  const bookingDate = formatHumanDate(firstMeta?.date ?? null);
  const dropOffTime = formatTimeRange(firstMeta?.dropOffTime ?? null);
  const pickUpTime = formatTimeRange(firstMeta?.pickUpTime ?? null);
  const showerTime = formatTimeRange(firstMeta?.showerTime ?? null);

  const customerBookingUrl = `${getBaseUrl()}/b/${encodeURIComponent(code)}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    customerBookingUrl
  )}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center">
      <section>
        <h1 className="mb-3 text-2xl font-semibold text-gray-900">
          {t.bookingConfirmedTitle}
        </h1>

        <p className="text-base text-gray-700">
          {t.thankYouBookingCodePrefix} <strong>{code}</strong>.
        </p>
      </section>

      {booking && (
        <section className="mx-auto mt-8 max-w-2xl rounded-[22px] border border-neutral-900 bg-white p-6 text-left">
          <h2 className="mb-5 text-center text-xl font-semibold text-gray-900">
            {t.bookingSummary}
          </h2>

          <p className="mb-4 text-[15px] leading-6 text-gray-900">
            <strong>{t.nameLabel}</strong> {booking.customer_name}
          </p>

          <div className="space-y-5">
            {bookingItems.map((item) => {
              const comments = item.meta?.comments?.trim();

              return (
                <div
                  key={item.id}
                  className="border-b border-gray-300 pb-5 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-base font-semibold text-gray-900">
                      {getLocalizedProductTitle(item, language)}
                    </p>
                    <p className="whitespace-nowrap text-base font-semibold text-gray-900">
                      € {Number(item.line_total).toFixed(2)}
                    </p>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {t.qtyLabel}: {item.quantity}
                  </p>

                  <div className="mt-3 space-y-1 text-[15px] leading-6 text-gray-900">
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

                    {comments && (
                      <p>
                        <strong>{t.commentsLabel}:</strong> {comments}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 border-t border-gray-300 pt-5">
            <div className="flex items-center justify-between gap-4">
              <p className="text-lg font-semibold text-gray-900">
                {t.totalLabel}
              </p>
              <p className="whitespace-nowrap text-lg font-semibold text-gray-900">
                € {Number(booking.total_amount).toFixed(2)}
              </p>
            </div>

            <p className="mt-3 text-[15px] leading-6 text-amber-700">
              {t.paymentOnSite}
            </p>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          {t.checkInQrTitle}
        </h2>
        <p className="mb-4 text-sm text-gray-500">{t.showQrAtReception}</p>

        <div className="flex justify-center">
          <img
            src={qrSrc}
            alt={`${t.qrAltPrefix} ${code}`}
            className="rounded-[18px] border border-neutral-900 bg-white p-3"
            width={240}
            height={240}
          />
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-xl rounded-[22px] border bg-white p-5 text-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {t.installAppTitle}
        </h2>
        <p className="mt-2 text-sm text-gray-600">{t.installAppText}</p>
        <div className="mt-4 flex justify-center">
          <InstallAppButton />
        </div>
      </section>

      <p className="mt-8 text-sm text-gray-600">
        Alicantissima | Luggage Storage & Shower Lounge
      </p>
    </main>
  );
}