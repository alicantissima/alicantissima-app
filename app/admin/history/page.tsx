


import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";

type BookingRow = {
  id: string;
  created_at: string;
  booking_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  total_amount: number;
  currency: string;
  status: string;
  source?: string | null;
  city?: string | null;
  service_date?: string | null;
};

type BookingItemRow = {
  booking_id: string;
  quantity: number;
  line_total: number;
  title?: string | null;
  product_type?: string | null;
  meta: {
    product_code?: string;
    time_in?: string;
    time_out?: string;
    city?: string;
    checkout_time?: string;
    date?: string;
    dropOffTime?: string | null;
    pickUpTime?: string | null;
    showerTime?: string | null;
  } | null;
};

type BookingMetaSummary = {
  bags: number;
  showers: number;
  combo: number;
  date: string | null;
  time_in: string | null;
  time_out: string | null;
  city: string | null;
  checkout_time: string | null;
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(amount);
}

function normalizeStatus(status: string) {
  if (status === "received") return "booked";
  if (status === "pending") return "booked";
  if (status === "inside") return "inside";
  if (status === "completed") return "completed";
  if (status === "finished") return "completed";
  if (status === "cancelled") return "cancelled";
  return status;
}

function getSourceRowClass(source: string | null) {
  const current = source ?? "na";

  if (current === "site") return "bg-pink-50";
  if (current === "viator") return "bg-green-50";
  if (current === "booking") return "bg-blue-50";
  if (current === "bokun") return "bg-yellow-50";
  if (current === "porta") return "bg-gray-50";
  return "";
}

function getStatusLabel(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "booked") return "BOOKED";
  if (normalized === "inside") return "INSIDE";
  if (normalized === "completed") return "FINISHED";
  if (normalized === "cancelled") return "CANCELLED";

  return status.toUpperCase();
}

function getStatusClass(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "booked") {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  if (normalized === "inside") {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (normalized === "completed") {
    return "bg-gray-200 text-gray-800 border-gray-300";
  }

  if (normalized === "cancelled") {
    return "bg-red-100 text-red-700 border-red-200";
  }

  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getItemCode(item: BookingItemRow) {
  const productCode = item.meta?.product_code?.toLowerCase();

  if (
    productCode === "luggage" ||
    productCode === "shower" ||
    productCode === "combo"
  ) {
    return productCode;
  }

  const title = item.title?.toLowerCase() ?? "";
  const productType = item.product_type?.toLowerCase() ?? "";

  if (
    title.includes("combo") ||
    (title.includes("luggage") && title.includes("shower")) ||
    productType.includes("combo")
  ) {
    return "combo";
  }

  if (
    title.includes("luggage") ||
    title.includes("bag") ||
    productType.includes("luggage")
  ) {
    return "luggage";
  }

  if (title.includes("shower") || productType.includes("shower")) {
    return "shower";
  }

  return null;
}

function getTodayString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function isPast(date: string | null) {
  if (!date) return false;
  return date < getTodayString();
}

function getLocalDateFromCreatedAt(createdAt: string) {
  const date = new Date(createdAt);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function getBookingDate(booking: BookingRow, meta: BookingMetaSummary) {
  if (meta.date) return meta.date;
  return getLocalDateFromCreatedAt(booking.created_at);
}
function emptyMeta(): BookingMetaSummary {
  return {
    bags: 0,
    showers: 0,
    combo: 0,
    date: null,
    time_in: null,
    time_out: null,
    city: null,
    checkout_time: null,
  };
}

export default async function AdminHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return <div className="p-6">Acesso negado.</div>;
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  const bookingIds = (bookings ?? []).map((b) => b.id);

  const { data: items } = bookingIds.length
    ? await supabase
        .from("booking_items")
        .select("booking_id, quantity, line_total, title, product_type, meta")
        .in("booking_id", bookingIds)
    : { data: [] };

  const bookingMetaMap = new Map<string, BookingMetaSummary>();

  for (const item of ((items as BookingItemRow[]) ?? [])) {
    const current = bookingMetaMap.get(item.booking_id) ?? emptyMeta();

    const code = getItemCode(item);

    let bags = current.bags;
    let showers = current.showers;
    let combo = current.combo;

    if (code === "luggage") bags += item.quantity;
    if (code === "shower") showers += item.quantity;
    if (code === "combo") combo += item.quantity;

    const timeIn =
      typeof item.meta?.time_in === "string" && item.meta.time_in.trim() !== ""
        ? item.meta.time_in
        : current.time_in;

    const timeOut =
      typeof item.meta?.time_out === "string" &&
      item.meta.time_out.trim() !== ""
        ? item.meta.time_out
        : current.time_out;

    const city =
      typeof item.meta?.city === "string" && item.meta.city.trim() !== ""
        ? item.meta.city
        : current.city;

    const checkoutTime =
      typeof item.meta?.checkout_time === "string" &&
      item.meta.checkout_time.trim() !== ""
        ? item.meta.checkout_time
        : current.checkout_time;

    const date =
      typeof item.meta?.date === "string" && item.meta.date.trim() !== ""
        ? item.meta.date
        : current.date;

    bookingMetaMap.set(item.booking_id, {
      bags,
      showers,
      combo,
      date,
      time_in: timeIn,
      time_out: timeOut,
      city,
      checkout_time: checkoutTime,
    });
  }

  const historyBookings = [...((bookings as BookingRow[]) ?? [])].filter(
  (booking) => {
    const meta = bookingMetaMap.get(booking.id) ?? emptyMeta();
    const bookingDate = getBookingDate(booking, meta);
    return isPast(bookingDate);
  }
);

const sourceHistoryCounts = {
  site: 0,
  viator: 0,
  booking: 0,
  bokun: 0,
  porta: 0,
  na: 0,
};

for (const booking of historyBookings) {
  const currentSource = (booking.source ?? "na") as keyof typeof sourceHistoryCounts;

  if (currentSource in sourceHistoryCounts) {
    sourceHistoryCounts[currentSource]++;
  } else {
    sourceHistoryCounts.na++;
  }
}

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Histórico · Reservas</h1>
          <p className="text-sm text-gray-500">Sessão: {profile.email}</p>
        </div>

        <div className="mt-1">
          <LogoutButton />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
        >
          ← Voltar ao desk
        </Link>

        <div className="rounded-xl border px-4 py-2 text-sm">
          Total histórico: <strong>{historyBookings.length}</strong>
        </div>
      </div>

<section className="rounded-xl border p-4">
  <div className="mb-3 text-sm font-semibold text-gray-700">
    Sources in history
  </div>

  <div className="flex flex-wrap gap-2 text-sm">
    <span className="rounded-full bg-pink-100 px-3 py-1 text-pink-800">
      site: {sourceHistoryCounts.site}
    </span>
    <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
      viator: {sourceHistoryCounts.viator}
    </span>
    <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
      booking: {sourceHistoryCounts.booking}
    </span>
    <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-800">
      bokun: {sourceHistoryCounts.bokun}
    </span>
    <span className="rounded-full bg-gray-200 px-3 py-1 text-gray-800">
      porta: {sourceHistoryCounts.porta}
    </span>
    <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-500">
      na: {sourceHistoryCounts.na}
    </span>
  </div>
</section>

      {!historyBookings.length ? (
        <div className="rounded-2xl border p-6 text-sm text-gray-600">
          Não existem reservas antigas no histórico.
        </div>
      ) : (
        <section className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b text-left">
                <th className="p-3">Código</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Data</th>
                <th className="p-3">City</th>
                <th className="p-3">Bags</th>
                <th className="p-3">Showers</th>
                <th className="p-3">Lugg + Shw</th>
                <th className="p-3">In</th>
                <th className="p-3">Out</th>
                <th className="p-3">Total</th>
                <th className="p-3">Estado</th>
              </tr>
            </thead>

            <tbody>
              {historyBookings.map((booking) => {
                const meta = bookingMetaMap.get(booking.id) ?? emptyMeta();

                return (
                  <tr key={booking.id} className={`border-b ${getSourceRowClass(booking.source)}`}>
                    <td className="p-3 font-semibold">
                      <Link
                        href={`/admin/booking/${booking.id}`}
                        className="underline hover:text-blue-600"
                      >
                        {booking.booking_code}
                      </Link>
                    </td>

                    <td className="p-3">
                      <div className="font-medium">{booking.customer_name}</div>
                      <div className="text-xs text-gray-500">
                        {booking.customer_email}
                      </div>
                    </td>

                    <td className="p-3">{getBookingDate(booking, meta)}</td>
                    <td className="p-3">{booking.city ?? "-"}</td>
                    <td className="p-3">{meta.bags || "-"}</td>
                    <td className="p-3">{meta.showers || "-"}</td>
                    <td className="p-3">{meta.combo || "-"}</td>
                    <td className="p-3">{meta.time_in ?? "-"}</td>
                    <td className="p-3">{meta.time_out ?? meta.checkout_time ?? "-"}</td>
                    <td className="p-3 font-medium">
                      {formatCurrency(Number(booking.total_amount), booking.currency)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex rounded-full border px-2 py-1 text-xs ${getStatusClass(
                          booking.status
                        )}`}
                      >
                        {getStatusLabel(booking.status)}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}