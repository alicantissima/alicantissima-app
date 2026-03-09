


import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import QuickFinishButton from "./QuickFinishButton";
import AdminQrScanner from "@/components/admin-qr-scanner";
import AdminFinishQrScanner from "@/components/admin-finish-qr-scanner";
import LogoutButton from "@/components/logout-button";

type BookingRow = {
  id: string;
  created_at: string;
  booking_code: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  status: string;
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
  } | null;
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(amount);
}

function normalizeStatus(status: string) {
  if (status === "received") return "booked";
  if (status === "inside") return "inside";
  if (status === "completed") return "completed";
  if (status === "finished") return "completed";
  return status;
}

function getStatusLabel(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "booked") return "BOOKED";
  if (normalized === "inside") return "INSIDE";
  if (normalized === "completed") return "FINISHED";

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

  return "bg-gray-100 text-gray-700 border-gray-200";
}

function getStatusOrder(status: string) {
  const normalized = normalizeStatus(status);

  if (normalized === "booked") return 1;
  if (normalized === "inside") return 2;
  if (normalized === "completed") return 3;

  return 99;
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

function isPastScheduledTime(
  checkoutTime: string | null,
  status: string,
  timeOut: string | null
) {
  if (timeOut) return false;
  if (!checkoutTime) return false;
  if (normalizeStatus(status) !== "inside") return false;

  const match = checkoutTime.match(/^(\d{1,2})[:.](\d{2})$/);
  if (!match) return false;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const targetMinutes = hours * 60 + minutes;

  return currentMinutes > targetMinutes;
}

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="p-6">Sem sessão.</div>;
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

  let bagsToday = 0;
  let showersToday = 0;
  let combosToday = 0;
  let revenueToday = 0;

  let bagsInside = 0;
  let showersInside = 0;

  for (const booking of ((bookings as BookingRow[]) ?? [])) {
    const itemsForBooking =
      (items as BookingItemRow[])?.filter((i) => i.booking_id === booking.id) ?? [];

    const computedRevenue = itemsForBooking.reduce(
      (sum, item) => sum + Number(item.line_total ?? 0),
      0
    );

    revenueToday +=
      computedRevenue > 0 ? computedRevenue : Number(booking.total_amount);

    for (const item of itemsForBooking) {
      const code = getItemCode(item);

      if (code === "luggage") bagsToday += item.quantity;
      if (code === "shower") showersToday += item.quantity;
      if (code === "combo") combosToday += item.quantity;
    }

    const normalizedStatus = normalizeStatus(booking.status);

    if (normalizedStatus === "inside") {
      for (const item of itemsForBooking) {
        const code = getItemCode(item);

        if (code === "luggage") bagsInside += item.quantity;
        if (code === "shower") showersInside += item.quantity;
      }
    }
  }

  const bookingMetaMap = new Map<
    string,
    {
      bags: number;
      showers: number;
      combo: number;
      time_in: string | null;
      time_out: string | null;
      city: string | null;
      checkout_time: string | null;
    }
  >();

  for (const item of ((items as BookingItemRow[]) ?? [])) {
    const current = bookingMetaMap.get(item.booking_id) ?? {
      bags: 0,
      showers: 0,
      combo: 0,
      time_in: null,
      time_out: null,
      city: null,
      checkout_time: null,
    };

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
      typeof item.meta?.time_out === "string" && item.meta.time_out.trim() !== ""
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

    bookingMetaMap.set(item.booking_id, {
      bags,
      showers,
      combo,
      time_in: timeIn,
      time_out: timeOut,
      city,
      checkout_time: checkoutTime,
    });
  }

  const sortedBookings = [...((bookings as BookingRow[]) ?? [])].sort((a, b) => {
    const statusDiff = getStatusOrder(a.status) - getStatusOrder(b.status);

    if (statusDiff !== 0) return statusDiff;

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Reservas</h1>
          <p className="text-sm text-gray-500">Sessão: {profile.email}</p>
        </div>

        <div className="mt-1">
          <LogoutButton />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <AdminQrScanner />
        <AdminFinishQrScanner />

        <Link
          href="/admin/new"
          className="rounded-xl bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          + Nova reserva
        </Link>

        <div className="rounded-xl border px-4 py-2 text-sm">
          Total reservas: <strong>{sortedBookings.length}</strong>
        </div>
      </div>

      <section className="grid grid-cols-6 gap-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Bags today</div>
          <div className="text-2xl font-bold">{bagsToday}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Showers today</div>
          <div className="text-2xl font-bold">{showersToday}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Combos today</div>
          <div className="text-2xl font-bold">{combosToday}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Bags inside</div>
          <div className="text-2xl font-bold">{bagsInside}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Showers inside</div>
          <div className="text-2xl font-bold">{showersInside}</div>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-500">Revenue today</div>
          <div className="text-2xl font-bold">
            {formatCurrency(revenueToday, "EUR")}
          </div>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b text-left">
              <th className="p-3">Código</th>
              <th className="p-3">Cliente</th>
              <th className="p-3">City</th>
              <th className="p-3">Bags</th>
              <th className="p-3">Showers</th>
              <th className="p-3">Luggage + Shower</th>
              <th className="p-3">In</th>
              <th className="p-3">Out</th>
              <th className="p-3">Total</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Ação</th>
            </tr>
          </thead>

          <tbody>
            {sortedBookings.map((booking) => {
              const meta = bookingMetaMap.get(booking.id) ?? {
                bags: 0,
                showers: 0,
                combo: 0,
                time_in: null,
                time_out: null,
                city: null,
                checkout_time: null,
              };

              const normalizedStatus = normalizeStatus(booking.status);
              const isLate = isPastScheduledTime(
                meta.checkout_time,
                booking.status,
                meta.time_out
              );

              const rowClass =
  normalizedStatus === "inside"
    ? isLate
      ? "bg-orange-50 border-l-4 border-orange-400"
      : "bg-green-50 border-l-4 border-green-400"
    : "";

              return (
                <tr key={booking.id} className={`border-b ${rowClass}`}>
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

                  <td className="p-3">{meta.city ?? "-"}</td>
                  <td className="p-3">{meta.bags || "-"}</td>
                  <td className="p-3">{meta.showers || "-"}</td>
                  <td className="p-3">{meta.combo || "-"}</td>
                  <td className="p-3">{meta.time_in ?? "-"}</td>
                  <td className={`p-3 ${isLate ? "text-orange-600 font-semibold" : ""}`}>
  {meta.time_out ?? meta.checkout_time ?? "-"}
  {isLate && " ⚠"}
</td>

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

                  <td className="p-3">
                    {normalizeStatus(booking.status) === "inside" ? (
                      <QuickFinishButton bookingId={booking.id} />
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </main>
  );
}