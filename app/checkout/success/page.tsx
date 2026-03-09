


import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

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
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  );
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SuccessSearchParams;
}) {
  const params = await searchParams;
  const code = params.code?.trim();

  if (!code) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-center">
        <h1 className="mb-4 text-3xl font-semibold">Booking confirmed</h1>
        <p className="text-gray-600">Booking code not found.</p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-block rounded-xl border border-black px-6 py-3 font-semibold transition hover:bg-black hover:text-white"
          >
            Back to homepage
          </Link>
        </div>
      </main>
    );
  }

  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, booking_code, customer_name, total_amount, currency")
    .eq("booking_code", code)
    .single();

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

  const adminUrl = `${getBaseUrl()}/admin?code=${encodeURIComponent(code)}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    adminUrl
  )}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center">
      <h1 className="mb-4 text-3xl font-semibold">Booking confirmed</h1>

      <p className="text-gray-600">
        Thank you. Your booking code is <strong>{code}</strong>.
      </p>

      <p className="mt-2 text-sm text-gray-500">
        Please keep this code for check-in.
      </p>

      <p className="mt-2 text-sm text-gray-500">
        A confirmation email has been sent to you.
      </p>

      {booking && (
        <section className="mx-auto mt-8 max-w-xl rounded-2xl border p-6 text-left">
          <h2 className="mb-4 text-xl font-bold text-center">Booking summary</h2>

          <div className="space-y-2 text-sm">
            <p>
              <strong>Name:</strong> {booking.customer_name}
            </p>

            {bookingDate && (
              <p>
                <strong>Date:</strong> {bookingDate}
              </p>
            )}

            {dropOffTime && (
              <p>
                <strong>Drop-off:</strong> {dropOffTime}
              </p>
            )}

            {pickUpTime && (
              <p>
                <strong>Estimated pick-up:</strong> {pickUpTime}
              </p>
            )}

            {showerTime && (
              <p>
                <strong>Shower time:</strong> {showerTime}
              </p>
            )}
          </div>

          <div className="mt-5 border-t pt-4">
            <div className="space-y-3">
              {bookingItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4 text-sm">
                  <div>
                    <p className="font-semibold">
                      {item.title ?? item.product_type ?? "Item"}
                    </p>
                    <p className="text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-semibold">€ {Number(item.line_total).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 border-t pt-4 text-sm">
            <p>
              <strong>Total:</strong> € {Number(booking.total_amount).toFixed(2)}
            </p>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Check-in QR</h2>
        <p className="mb-4 text-sm text-gray-500">
          Show this QR code at reception for faster check-in.
        </p>

        <div className="flex justify-center">
          <img
            src={qrSrc}
            alt={`QR code for booking ${code}`}
            className="rounded-2xl border p-3"
            width={220}
            height={220}
          />
        </div>
      </section>

      <div className="mt-8">
        <Link
          href="/"
          className="inline-block rounded-xl border border-black px-6 py-3 font-semibold transition hover:bg-black hover:text-white"
        >
          Back to homepage
        </Link>
      </div>
    </main>
  );
}