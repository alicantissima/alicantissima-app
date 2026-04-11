


import BookingQr from "@/components/booking-qr";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import CancelBookingButton from "@/components/cancel-booking-button";
import CheckInBookingButton from "@/components/check-in-booking-button";
import FinishBookingButton from "@/components/finish-booking-button";
import Link from "next/link";
import InlineEditBookingField from "@/components/inline-edit-booking-field";

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

function getStatusClasses(status?: string | null) {
  switch (status) {
    case "booked":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "inside":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "completed":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-800";
    case "no_show":
      return "border-orange-200 bg-orange-50 text-orange-800";
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

function isPaidPartner(source?: string | null) {
  return source?.toLowerCase().trim() === "viator";
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-base font-semibold leading-tight break-words">
        {value}
      </div>
    </div>
  );
}

export default async function DeskBookingPage({ params }: PageProps) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "desk")) {
    redirect("/login");
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !booking) notFound();

  const { data: bookingItemsData } = await supabase
    .from("booking_items")
    .select("id, title, quantity, line_total, product_type, meta")
    .eq("booking_id", booking.id)
    .order("id", { ascending: true });

  const bookingItems = (bookingItemsData ?? []) as BookingItem[];

  return (
    <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-6">
      <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Link
              href="/desk"
              className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium hover:bg-gray-50"
            >
              ← Back to Desk
            </Link>

            <div className="space-y-2">
  <div className="flex flex-wrap items-center gap-3">
    <h1 className="text-2xl font-bold leading-tight md:text-3xl">
      {booking.customer_name || "Customer"}
    </h1>

    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${getStatusClasses(
        booking.status
      )}`}
    >
      {booking.status || "-"}
    </span>
  </div>

  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
    <span>Service date: {formatDate(booking.service_date)}</span>
    <span className="rounded-full border px-2 py-0.5 text-xs">
      {booking.booking_code}
    </span>
  </div>

  {isPaidPartner(booking.source) && (
    <div className="rounded-2xl border border-green-300 bg-green-100 px-4 py-3 text-sm font-bold uppercase tracking-wide text-green-900">
      Paid partner online · do not charge customer
    </div>
  )}
</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
{booking.status === "booked" && (
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
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-4">
          <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-bold">Purchased products</h2>
              <span className="rounded-full border px-3 py-1 text-xs font-medium text-gray-600">
                {bookingItems.length}
              </span>
            </div>

            {bookingItems.length === 0 ? (
              <p className="text-sm text-gray-500">No items linked to this booking.</p>
            ) : (
              <div className="space-y-3">
                {bookingItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold">
                          {item.title || item.product_type || "Item"}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Quantidade: {item.quantity}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-500">Total</div>
                        <div className="text-lg font-semibold">
                          {Number(item.line_total ?? 0).toFixed(2)} €
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <div className="rounded-xl bg-gray-50 p-3 text-sm">
                        <div className="text-xs text-gray-500">Entrega</div>
                        <div className="font-medium">
                          {item.meta?.dropOffTime || "-"}
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3 text-sm">
                        <div className="text-xs text-gray-500">Recolha</div>
                        <div className="font-medium">
                          {item.meta?.pickUpTime || "-"}
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3 text-sm">
                        <div className="text-xs text-gray-500">Duche</div>
                        <div className="font-medium">
                          {item.meta?.showerTime || "-"}
                        </div>
                      </div>
                    </div>

                    {item.meta?.breakdown && item.meta.breakdown.length > 0 && (
                      <div className="mt-4 rounded-2xl bg-gray-50 p-4">
                        <div className="mb-2 text-sm font-semibold">
                          Breakdown
                        </div>
                        <div className="space-y-2 text-sm">
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

          <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
  <h2 className="text-2xl font-bold">Customer</h2>

  <div className="mt-4 grid gap-3 md:grid-cols-2">
    <InfoCard label="Name" value={booking.customer_name || "-"} />

    <InlineEditBookingField
      bookingId={booking.id}
      label="City"
      field="city"
      value={booking.city}
      type="text"
    />

    <InlineEditBookingField
      bookingId={booking.id}
      label="Phone"
      field="customer_phone"
      value={booking.customer_phone}
      type="tel"
    />

    <InlineEditBookingField
      bookingId={booking.id}
      label="Email"
      field="customer_email"
      value={booking.customer_email}
      type="email"
    />
  </div>
</section>

          <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
            <h2 className="text-2xl font-bold">Notes</h2>

            <div
              className={`mt-4 rounded-2xl p-4 text-sm ${
                booking.notes && booking.notes.trim()
                  ? "border border-amber-200 bg-amber-50 text-amber-900"
                  : "border bg-gray-50 text-gray-500"
              }`}
            >
              {booking.notes && booking.notes.trim()
                ? booking.notes
                : "No notes."}
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
            <h2 className="text-2xl font-bold">Administrative data</h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoCard label="Created at" value={formatDateTime(booking.created_at)} />
              <InfoCard label="Check-in real" value={formatDateTime(booking.check_in_time)} />
              <InfoCard label="Check-out real" value={formatDateTime(booking.check_out_time)} />
              <InfoCard
  label="Source"
  value={isPaidPartner(booking.source) ? "viator · paid online" : booking.source || "-"}
/>
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
            <h2 className="text-2xl font-bold">QR</h2>
            <p className="mt-1 text-sm text-gray-500">
              Show to staff for quick scanning
            </p>

            <div className="mt-4 flex justify-center rounded-2xl border bg-gray-50 p-4">
              <div className="w-full max-w-[220px]">
                <BookingQr code={booking.booking_code} />
              </div>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}