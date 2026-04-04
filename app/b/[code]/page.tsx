


import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getMessages, normalizeLanguage } from "@/lib/i18n";

type PageProps = {
  params: Promise<{ code: string }>;
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
    month: "short",
  }).format(date);
}

function formatTimeRange(value?: string | null) {
  if (!value) return "";
  return value
    .replace(/h/g, ":")
    .replace(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/, "$1:$2 – $3:$4");
}

function getQrCodeUrl(text: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    text
  )}`;
}

function getLocalizedProductTitle({
  productType,
  fallbackTitle,
  language,
}: {
  productType?: string | null;
  fallbackTitle?: string | null;
  language?: string | null;
}) {
  const t = getMessages(language);

  if (productType === "booking") return t.bookLuggageProductName;
  if (productType === "shower") return t.bookShowerProductName;
  if (productType === "combo") return t.bookComboProductName;

  return fallbackTitle || t.itemFallback;
}

export default async function BookingPage({ params }: PageProps) {
  const { code } = await params;
  const bookingCode = code?.trim().toUpperCase();

  if (!bookingCode) notFound();

  const supabase = createAdminClient();
  const authSupabase = await createClient();

  const {
    data: { user },
  } = await authSupabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    const { data: profile } = await authSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    isAdmin = profile?.role === "admin";
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("booking_code", bookingCode)
    .maybeSingle<BookingRow>();

  if (!booking) notFound();

  const { data: items } = await supabase
    .from("booking_items")
    .select("*")
    .eq("booking_id", booking.id)
    .returns<BookingItemRow[]>();

  const language = normalizeLanguage(booking.language);
  const t = getMessages(language);

  const appBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://app.alicantissima.es";

  const bookingUrl = `${appBaseUrl}/b/${booking.booking_code}`;
  const qrCodeUrl = getQrCodeUrl(bookingUrl);

  const item = items?.[0];

  const date = formatHumanDate(item?.meta?.date || booking.service_date);
  const dropOff = formatTimeRange(item?.meta?.dropOffTime);
  const pickUp = formatTimeRange(item?.meta?.pickUpTime);

  const productTitle = getLocalizedProductTitle({
    productType: item?.product_type,
    fallbackTitle: item?.title,
    language,
  });

  const backHref = isAdmin ? "/admin" : "/";
  const backLabel = isAdmin ? "Back to admin" : "Back to home";

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-md space-y-6">
        {/* HEADER */}
        <div className="text-center">
          <p className="text-sm text-white/50">Booking code</p>
          <h1 className="mt-1 text-2xl font-bold tracking-widest">
            {booking.booking_code}
          </h1>
        </div>

        {/* WALLET CARD */}
        <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-neutral-900 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.6)]">
          {/* top */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-white/50">{t.nameLabel}</p>
              <p className="text-base font-semibold">
                {booking.customer_name}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-white/50">{t.totalLabel}</p>
              <p className="text-lg font-semibold">
                € {formatPrice(booking.total_amount)}
              </p>
            </div>
          </div>

          {/* divider */}
          <div className="my-5 border-t border-dashed border-white/10" />

          {/* product */}
          <div>
            <p className="text-sm text-white/50">Service</p>
            <p className="font-semibold">{productTitle}</p>
          </div>

          {/* grid */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {date && (
              <div>
                <p className="text-white/50">{t.dateLabel}</p>
                <p className="font-medium">{date}</p>
              </div>
            )}

            {dropOff && (
              <div>
                <p className="text-white/50">{t.dropOffLabel}</p>
                <p className="font-medium">{dropOff}</p>
              </div>
            )}

            {pickUp && (
              <div>
                <p className="text-white/50">{t.estimatedPickUpLabel}</p>
                <p className="font-medium">{pickUp}</p>
              </div>
            )}
          </div>

          {/* payment note */}
          <p className="mt-5 text-sm text-amber-400">
            {t.paymentOnSite}
          </p>
        </div>

        {/* QR HERO */}
        <div className="text-center">
          <p className="mb-3 text-sm text-white/50">
            {t.showQrAtReception}
          </p>

          <div className="inline-block rounded-[24px] bg-white p-4">
            <img src={qrCodeUrl} width={220} height={220} />
          </div>
        </div>

        {/* ACTION */}
        <Link
          href={backHref}
          className="block w-full rounded-full bg-white py-4 text-center font-semibold text-black"
        >
          {backLabel}
        </Link>

        {/* FOOTER */}
        <p className="text-center text-xs text-white/30">
          Alicantissima · Luggage & Shower Lounge
        </p>
      </div>
    </main>
  );
}