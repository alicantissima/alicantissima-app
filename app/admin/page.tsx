


import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import QuickFinishButton from "./QuickFinishButton";
import AdminQrScanner from "@/components/admin-qr-scanner";
import AdminFinishQrScanner from "@/components/admin-finish-qr-scanner";
import LogoutButton from "@/components/logout-button";
import FinishAllInsideButton from "@/components/finish-all-inside-button";
import AdminAutoRefresh from "./AdminAutoRefresh";
import AdminSourceSelect from "@/components/admin-source-select";

export const revalidate = 0;

type BookingRow = {
  id: string;
  created_at: string;
  booking_code: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  currency: string;
  status: string;
  source?: string | null;
  city?: string | null;
  service_date?: string | null;
  booking_date?: string | null;
  check_in_at?: string | null;
  check_out_at?: string | null;
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
    comments?: string | null;
    breakdown?: Array<{
      label: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  } | null;
};

type BookingMetaSummary = {
  bags: number;
  showers: number;
  combo: number;
  date: string | null;
  drop_off: string | null;
  pick_up: string | null;
  shower_time: string | null;
  time_in: string | null;
  time_out: string | null;
  city: string | null;
  checkout_time: string | null;
};

function formatServiceDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Madrid",
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "2-digit",
  })
    .format(date)
    .replace(",", "")
    .replace(/\s+/g, ".");
}

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

function getSourceRowClass(source: string | null) {
  const current = source ?? "na";

  if (current === "site") return "bg-pink-50";
  if (current === "viator") return "bg-green-50";
  if (current === "booking") return "bg-blue-50";
  if (current === "hector") return "bg-yellow-50";
  if (current === "porta") return "bg-gray-50";
  return "";
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

function isToday(date: string | null) {
  if (!date) return false;
  return date === getTodayString();
}

function isFuture(date: string | null) {
  if (!date) return false;
  return date > getTodayString();
}

function emptyMeta(): BookingMetaSummary {
  return {
    bags: 0,
    showers: 0,
    combo: 0,
    date: null,
    drop_off: null,
    pick_up: null,
    shower_time: null,
    time_in: null,
    time_out: null,
    city: null,
    checkout_time: null,
  };
}

function renderSectionTable({
  title,
  bookings,
  bookingMetaMap,
  codeFilter,
  cancelled = false,
}: {
  title: string;
  bookings: BookingRow[];
  bookingMetaMap: Map<string, BookingMetaSummary>;
  codeFilter: string | null;
  cancelled?: boolean;
}) {
  if (!bookings.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <div
          className={`rounded-xl border px-3 py-1 text-sm ${
            cancelled
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-gray-200 bg-gray-50 text-gray-700"
          }`}
        >
          {bookings.length}
        </div>
      </div>

      <section
        className={`overflow-x-auto rounded-2xl border ${
          cancelled ? "border-red-200" : ""
        }`}
      >
        <table className="w-full text-sm">
          <thead className={cancelled ? "bg-red-50" : "bg-gray-50"}>
            <tr className="border-b text-left text-[13px]">
              <th className="px-3 py-2">Código</th>
              <th className="px-2 py-2">Source</th>
              <th className="px-2 py-2">Date</th>
              <th className="px-2 py-2">Cliente</th>
              <th className="px-2 py-2">City</th>
              <th className="px-2 py-2">Bags</th>
              <th className="px-2 py-2">Shws</th>
              <th className="px-2 py-2">Lug+Shw</th>
              <th className="px-2 py-2">In</th>
              <th className="px-2 py-2">Out</th>
              <th className="px-2 py-2">Total</th>
              <th className="px-2 py-2">Estado</th>
              <th className="px-2 py-2">Ação</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map((booking) => {
              const meta = bookingMetaMap.get(booking.id) ?? emptyMeta();

              const normalizedStatus = normalizeStatus(booking.status);
              const isFilteredMatch = codeFilter === booking.booking_code;
              const sourceRowClass = getSourceRowClass(booking.source ?? null);

              const rowClass = cancelled
                ? "bg-red-50/40"
                : isFilteredMatch
                ? "bg-blue-50 border-l-4 border-blue-400"
                : normalizedStatus === "inside"
                ? "bg-green-50 border-l-4 border-green-400"
                : sourceRowClass;

              return (
                <tr key={booking.id} className={`border-b ${rowClass}`}>
                  <td className="px-3 py-2 font-semibold text-[13px] leading-tight">
                    <Link
                      href={`/admin/booking/${booking.id}`}
                      className="underline hover:text-blue-600"
                    >
                      {booking.booking_code}
                    </Link>
                  </td>

                  <td className="px-2 py-2 align-top">
                    <div className="w-[92px]">
                      <AdminSourceSelect
                        bookingId={booking.id}
                        value={booking.source ?? "na"}
                      />
                    </div>
                  </td>

                  <td className="px-2 py-2 whitespace-nowrap text-[12px] align-top">
                    {formatServiceDate(meta.date)}
                  </td>

                  <td className="px-2 py-2 align-top">
                    <div className="max-w-[170px] text-[13px] leading-tight font-medium">
                      {booking.customer_name}
                    </div>
                    <div className="text-[11px] leading-tight text-gray-500">
                      {booking.customer_email}
                    </div>
                  </td>

                  <td className="px-2 py-2 align-top text-[12px] leading-tight max-w-[90px]">
                    {booking.city ?? meta.city ?? "-"}
                  </td>

                  <td className="px-2 py-2 align-top text-[12px]">
                    {meta.bags || "-"}
                  </td>
                  <td className="px-2 py-2 align-top text-[12px]">
                    {meta.showers || "-"}
                  </td>
                  <td className="px-2 py-2 align-top text-[12px]">
                    {meta.combo || "-"}
                  </td>

                  <td className="px-2 py-2 align-top text-[12px] leading-tight whitespace-nowrap">
                    {meta.time_in ?? "-"}
                  </td>

                  <td className="px-2 py-2 align-top text-[12px] leading-tight whitespace-nowrap">
                    {meta.time_out ?? meta.checkout_time ?? "-"}
                  </td>

                  <td className="px-2 py-2 align-top text-[12px] font-medium whitespace-nowrap">
                    {formatCurrency(Number(booking.total_amount), booking.currency)}
                  </td>

                  <td className="px-2 py-2 align-top">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] ${getStatusClass(
                        booking.status
                      )}`}
                    >
                      {getStatusLabel(booking.status)}
                    </span>
                  </td>

                  <td className="px-2 py-2 align-top">
                    {!cancelled && normalizeStatus(booking.status) === "inside" ? (
                      <QuickFinishButton bookingId={booking.id} />
                    ) : (
                      <span className="text-[12px]">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </section>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const codeFilter = params.code?.trim() || null;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return (
      <div className="p-6 space-y-2">
        <div className="font-bold">Acesso negado.</div>
        <div className="text-sm">User id: {user.id}</div>
        <div className="text-sm">User email: {user.email}</div>
        <div className="text-sm">Profile exists: {profile ? "yes" : "no"}</div>
        <div className="text-sm">Profile role: {profile?.role ?? "null"}</div>
        <div className="text-sm">
          Profile error: {profileError?.message ?? "none"}
        </div>
      </div>
    );
  }

  let bookingsQuery = supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (codeFilter) {
    bookingsQuery = bookingsQuery.eq("booking_code", codeFilter);
  }

  const { data: bookings } = await bookingsQuery;

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
        : typeof item.meta?.dropOffTime === "string" &&
          item.meta.dropOffTime.trim() !== ""
        ? item.meta.dropOffTime
        : current.time_in;

    const timeOut =
      typeof item.meta?.time_out === "string" && item.meta.time_out.trim() !== ""
        ? item.meta.time_out
        : typeof item.meta?.pickUpTime === "string" &&
          item.meta.pickUpTime.trim() !== ""
        ? item.meta.pickUpTime
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

    const dropOff =
      typeof item.meta?.dropOffTime === "string"
        ? item.meta.dropOffTime
        : current.drop_off;

    const pickUp =
      typeof item.meta?.pickUpTime === "string"
        ? item.meta.pickUpTime
        : current.pick_up;

    const showerTime =
      typeof item.meta?.showerTime === "string"
        ? item.meta.showerTime
        : current.shower_time;

    bookingMetaMap.set(item.booking_id, {
      bags,
      showers,
      combo,
      date,
      drop_off: dropOff,
      pick_up: pickUp,
      shower_time: showerTime,
      time_in: timeIn,
      time_out: timeOut,
      city,
      checkout_time: checkoutTime,
    });
  }

  let bagsToday = 0;
  let showersToday = 0;
  let combosToday = 0;
  let revenueToday = 0;

  let bagsInside = 0;
  let showersInside = 0;

  const sourceTodayCounts = {
    site: 0,
    viator: 0,
    booking: 0,
    hector: 0,
    porta: 0,
    turismo: 0,
  };

  const sourceTodayRevenue = {
    site: 0,
    viator: 0,
    booking: 0,
    hector: 0,
    porta: 0,
    turismo: 0,
  };

  const citiesTodayCounts: Record<string, number> = {};

  for (const booking of ((bookings as BookingRow[]) ?? [])) {
    const normalizedStatus = normalizeStatus(booking.status);
    const meta = bookingMetaMap.get(booking.id) ?? emptyMeta();
    const bookingDate = meta.date;

    const itemsForBooking =
      (items as BookingItemRow[])?.filter((i) => i.booking_id === booking.id) ?? [];

    if (isToday(bookingDate) && normalizedStatus !== "cancelled") {
      const currentSource = (booking.source ?? "na") as keyof typeof sourceTodayCounts;

      const computedRevenue = itemsForBooking.reduce(
        (sum, item) => sum + Number(item.line_total ?? 0),
        0
      );

      const bookingRevenue =
        computedRevenue > 0 ? computedRevenue : Number(booking.total_amount);

      revenueToday += bookingRevenue;

      if (currentSource in sourceTodayCounts) {
        sourceTodayCounts[currentSource]++;
        sourceTodayRevenue[currentSource] += bookingRevenue;
      } else {
        sourceTodayRevenue.turismo += bookingRevenue;
      }

      for (const item of itemsForBooking) {
        const code = getItemCode(item);

        if (code === "luggage") bagsToday += item.quantity;
        if (code === "shower") showersToday += item.quantity;
        if (code === "combo") combosToday += item.quantity;
      }

      const cityName = (booking.city ?? meta.city ?? "").trim();

      if (cityName) {
        citiesTodayCounts[cityName] = (citiesTodayCounts[cityName] ?? 0) + 1;
      }
    }

    if (normalizedStatus === "inside") {
      for (const item of itemsForBooking) {
        const code = getItemCode(item);

        if (code === "luggage") bagsInside += item.quantity;
        if (code === "shower") showersInside += item.quantity;
      }
    }
  }

  const sortedBookings = [...((bookings as BookingRow[]) ?? [])].sort((a, b) => {
    const aMeta = bookingMetaMap.get(a.id) ?? emptyMeta();
    const bMeta = bookingMetaMap.get(b.id) ?? emptyMeta();

    const aDate = aMeta.date || a.created_at;
    const bDate = bMeta.date || b.created_at;

    return new Date(aDate).getTime() - new Date(bDate).getTime();
  });

  const citiesTodayList = Object.entries(citiesTodayCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12);

  const todayBookings: BookingRow[] = [];
  const insideBookings: BookingRow[] = [];
  const finishedBookings: BookingRow[] = [];
  const upcomingBookings: BookingRow[] = [];
  const cancelledBookings: BookingRow[] = [];

  for (const booking of sortedBookings) {
    const meta = bookingMetaMap.get(booking.id) ?? emptyMeta();
    const date = meta.date;
    const status = normalizeStatus(booking.status);

    if (status === "inside") {
      insideBookings.push(booking);
      continue;
    }

    if (status === "cancelled") {
      if (isToday(date)) {
        cancelledBookings.push(booking);
      }
      continue;
    }

    if (status === "finished" || status === "completed") {
      if (isToday(date)) {
        finishedBookings.push(booking);
      }
      continue;
    }

    if (isToday(date)) {
      todayBookings.push(booking);
      continue;
    }

    if (isFuture(date)) {
      upcomingBookings.push(booking);
    }
  }

  const upcomingTotal = upcomingBookings.reduce(
    (sum, booking) => sum + Number(booking.total_amount || 0),
    0
  );

  const visibleBookingsCount =
    todayBookings.length +
    insideBookings.length +
    finishedBookings.length +
    upcomingBookings.length +
    cancelledBookings.length;

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <AdminAutoRefresh intervalMs={60000} />

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Reservas</h1>
          <p className="text-sm text-gray-500">Sessão: {profile.email}</p>
        </div>

        <div className="mt-1 flex items-center gap-3">
          <Link
            href="/desk"
            className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-gray-50"
          >
            Abrir Desk
          </Link>
          <LogoutButton className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-gray-50" />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <AdminQrScanner />
        <AdminFinishQrScanner />
        <FinishAllInsideButton count={bagsInside + showersInside} />

        <Link
          href="/admin/history"
          className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-gray-50"
        >
          Histórico
        </Link>

        <div className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm">
          Total visíveis: <strong className="ml-1">{visibleBookingsCount}</strong>
        </div>
      </div>

      {codeFilter && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Showing booking: <strong>{codeFilter}</strong>
          <Link href="/admin" className="ml-3 underline">
            Clear filter
          </Link>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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

      <section className="rounded-xl border p-4">
        <div className="mb-3 text-sm font-semibold text-gray-700">
          Sources today
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-pink-100 px-3 py-1 text-pink-800">
            site: {sourceTodayCounts.site}
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
            viator: {sourceTodayCounts.viator}
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
            booking: {sourceTodayCounts.booking}
          </span>
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-800">
            hector: {sourceTodayCounts.hector}
          </span>
          <span className="rounded-full bg-gray-200 px-3 py-1 text-gray-800">
            porta: {sourceTodayCounts.porta}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-500">
            turismo: {sourceTodayCounts.turismo}
          </span>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <div className="mb-3 text-sm font-semibold text-gray-700">
          Revenue by source today
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-pink-100 px-3 py-1 text-pink-800">
            site: {formatCurrency(sourceTodayRevenue.site, "EUR")}
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-green-800">
            viator: {formatCurrency(sourceTodayRevenue.viator, "EUR")}
          </span>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-800">
            booking: {formatCurrency(sourceTodayRevenue.booking, "EUR")}
          </span>
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-yellow-800">
            hector: {formatCurrency(sourceTodayRevenue.hector, "EUR")}
          </span>
          <span className="rounded-full bg-gray-200 px-3 py-1 text-gray-800">
            porta: {formatCurrency(sourceTodayRevenue.porta, "EUR")}
          </span>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-500">
            turismo: {formatCurrency(sourceTodayRevenue.turismo, "EUR")}
          </span>
        </div>
      </section>

      <section className="rounded-xl border p-4">
        <div className="mb-3 text-sm font-semibold text-gray-700">
          Cities today
        </div>

        {citiesTodayList.length ? (
          <div className="flex flex-wrap gap-2 text-sm">
            {citiesTodayList.map(([city, count]) => (
              <span
                key={city}
                className="rounded-full bg-gray-100 px-3 py-1 text-gray-700"
              >
                {city}: {count}
              </span>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">No cities yet today.</div>
        )}
      </section>

      {renderSectionTable({
        title: "Today",
        bookings: todayBookings,
        bookingMetaMap,
        codeFilter,
      })}

      {renderSectionTable({
        title: "Inside",
        bookings: insideBookings,
        bookingMetaMap,
        codeFilter,
      })}

      {renderSectionTable({
        title: "Finished",
        bookings: finishedBookings,
        bookingMetaMap,
        codeFilter,
      })}

      {upcomingBookings.length > 0 && <div className="border-t pt-6" />}

      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="rounded-xl border px-3 py-2 text-sm">
            <span className="font-medium">Upcoming total:</span>{" "}
            <span className="font-bold">€ {upcomingTotal.toFixed(2)}</span>
          </div>
        </div>

        {renderSectionTable({
          title: "Upcoming",
          bookings: upcomingBookings,
          bookingMetaMap,
          codeFilter,
        })}
      </div>

      {renderSectionTable({
        title: "Cancelled",
        bookings: cancelledBookings,
        bookingMetaMap,
        codeFilter,
        cancelled: true,
      })}
    </main>
  );
}