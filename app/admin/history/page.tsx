


import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/logout-button";
import AdminSourceSelect from "@/components/admin-source-select";
import AdminPaymentMethodSelect from "@/components/admin-payment-method-select";
import AdminStatusSelect from "@/components/admin-status-select";

export const revalidate = 0;

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
  payment_method?: string | null;
  payment_status?: string | null;
  refund_status?: string | null;
  city?: string | null;
  service_date?: string | null;
  booking_date?: string | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
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
    shower_time?: string | null;
    showerStartTime?: string | null;
    shower_start_time?: string | null;
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

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";

  const weekdayMap = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  const weekday = weekdayMap[date.getDay()];

  const dayMonth = new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
  }).format(date);

  return `${weekday}.${dayMonth}`;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatRealTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getFirstTimeSlot(value?: string | null) {
  if (!value) return "-";
  return value.split("-")[0]?.trim() || "-";
}

function normalizeStatus(status?: string | null) {
  if (status === "received") return "booked";
  if (status === "pending") return "booked";
  if (status === "pending_payment") return "pending_payment";
  if (status === "inside") return "inside";
  if (status === "completed") return "completed";
  if (status === "finished") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "no_show") return "no_show";
  if (status === "refunded") return "refunded";
  return "booked";
}

function isPendingPaymentBooking(booking: BookingRow) {
  return (
    normalizeStatus(booking.status) === "pending_payment" ||
    booking.payment_status === "pending_payment"
  );
}

function isRefundedBooking(booking: BookingRow) {
  return (
    normalizeStatus(booking.status) === "refunded" ||
    booking.payment_status === "refunded" ||
    booking.refund_status === "refunded"
  );
}

function countsForRevenue(booking: BookingRow) {
  const status = normalizeStatus(booking.status);

  if (status === "pending_payment") return false;
  if (status === "cancelled") return false;
  if (status === "refunded") return false;
  if (isRefundedBooking(booking)) return false;

  return true;
}

function getSourceRowClass(source?: string | null) {
  const current = source ?? "choose";

  if (current === "site") return "bg-pink-50";
  if (current === "viator") return "bg-green-50";
  if (current === "booking") return "bg-blue-50";
  if (current === "walkin") return "bg-orange-50";
  if (current === "turismo") return "bg-yellow-50";

  if (
    current === "hector" ||
    current === "pilar" ||
    current === "melia" ||
    current === "other_host"
  ) {
    return "bg-amber-50";
  }

  return "";
}

function getSourceColorClass(source: string) {
  if (source === "choose") return "bg-zinc-100 text-zinc-800";
  if (source === "site") return "bg-pink-100 text-pink-800";
  if (source === "viator") return "bg-green-100 text-green-800";
  if (source === "booking") return "bg-blue-100 text-blue-800";
  if (source === "walkin") return "bg-orange-100 text-orange-800";
  if (source === "porta") return "bg-orange-200 text-orange-800";
  if (source === "turismo") return "bg-yellow-100 text-yellow-800";

  if (
    source === "hector" ||
    source === "pilar" ||
    source === "melia" ||
    source === "other_host"
  ) {
    return "bg-amber-100 text-amber-800";
  }

  return "bg-purple-100 text-purple-800";
}

function getPaymentColorClass(payment: string) {
  if (payment === "card") return "bg-blue-100 text-blue-800";
  if (payment === "cash") return "bg-amber-100 text-amber-800";
  if (payment === "revolut") return "bg-gray-950 text-white";
  if (payment === "viator") return "bg-green-100 text-green-800";
  if (payment === "refunded") return "bg-red-100 text-red-800";
  if (payment === "unpaid") return "bg-zinc-100 text-zinc-800";

  return "bg-zinc-100 text-zinc-800";
}

function getItemCode(item: BookingItemRow) {
  const productCode = item.meta?.product_code?.toLowerCase().trim() ?? "";
  const productType = item.product_type?.toLowerCase().trim() ?? "";
  const title = item.title?.toLowerCase().trim() ?? "";

  const dropOffTime =
    typeof item.meta?.dropOffTime === "string"
      ? item.meta.dropOffTime.trim()
      : "";

  const pickUpTime =
    typeof item.meta?.pickUpTime === "string"
      ? item.meta.pickUpTime.trim()
      : "";

  const showerTime =
    typeof item.meta?.showerTime === "string"
      ? item.meta.showerTime.trim()
      : "";

  const hasBagSignal = !!dropOffTime || !!pickUpTime;
  const hasShowerSignal = !!showerTime;

  const text = [productCode, productType, title].filter(Boolean).join(" ");

  const hasBagWord =
    text.includes("equipaje") ||
    text.includes("luggage") ||
    text.includes("bag") ||
    text.includes("bags") ||
    text.includes("bagagem") ||
    text.includes("mala") ||
    text.includes("malas") ||
    text.includes("maleta") ||
    text.includes("maletas") ||
    text.includes("valise") ||
    text.includes("valises") ||
    text.includes("bagagli") ||
    text.includes("bagaglio") ||
    text.includes("bagaż") ||
    text.includes("bagaz") ||
    text.includes("walizk");

  const hasShowerWord =
    text.includes("shower") ||
    text.includes("showers") ||
    text.includes("ducha") ||
    text.includes("duche") ||
    text.includes("doccia") ||
    text.includes("prysznic") ||
    text.includes("douche") ||
    text.includes("dusche");

  if (
    productCode === "combo" ||
    productType === "combo" ||
    text.includes("combo") ||
    (hasBagSignal && hasShowerSignal) ||
    (hasBagWord && hasShowerWord)
  ) {
    return "combo";
  }

  if (
    productCode === "shower" ||
    productType === "shower" ||
    productCode === "extra_shower" ||
    productType === "extra_shower" ||
    hasShowerSignal ||
    hasShowerWord
  ) {
    return "shower";
  }

  if (
    productCode === "luggage" ||
    productType === "luggage" ||
    productCode === "extra_luggage" ||
    productType === "extra_luggage" ||
    hasBagSignal ||
    hasBagWord
  ) {
    return "luggage";
  }

  return null;
}

function getBreakdown(item: BookingItemRow) {
  return Array.isArray(item.meta?.breakdown) ? item.meta.breakdown : [];
}

function getExtraCounts(item: BookingItemRow) {
  return getBreakdown(item).reduce(
    (acc, part) => {
      const label = (part.label ?? "")
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

      const qty = Number(part.quantity || 0);

      if (!qty) return acc;

      const isExtra =
        label.includes("additional") ||
        label.includes("extra") ||
        label.includes("adicional") ||
        label.includes("supplementaire") ||
        label.includes("suplementar") ||
        label.includes("zusatz") ||
        label.includes("dodatk") ||
        label.includes("lisas");

      const isBag =
        label.includes("luggage") ||
        label.includes("bag") ||
        label.includes("bagagem") ||
        label.includes("mala") ||
        label.includes("maleta") ||
        label.includes("equipaje") ||
        label.includes("valise") ||
        label.includes("bagag") ||
        label.includes("baga") ||
        label.includes("waliz") ||
        label.includes("gepack") ||
        label.includes("gepaeck");

      const isShower =
        label.includes("shower") ||
        label.includes("ducha") ||
        label.includes("duche") ||
        label.includes("doccia") ||
        label.includes("douche") ||
        label.includes("dusche") ||
        label.includes("prysznic") ||
        label.includes("suihku");

      if (isExtra && isBag) acc.bags += qty;
      if (isExtra && isShower) acc.showers += qty;

      return acc;
    },
    { bags: 0, showers: 0 }
  );
}

function getTodayString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getYesterdayString() {
  const now = new Date();
  now.setDate(now.getDate() - 1);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function getLocalDateFromCreatedAt(createdAt: string) {
  const date = new Date(createdAt);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getBookingDate(booking: BookingRow, meta: BookingMetaSummary) {
  if (meta.date) return meta.date;
  if (booking.service_date) return booking.service_date;
  if (booking.booking_date) return booking.booking_date;

  return getLocalDateFromCreatedAt(booking.created_at);
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

function getBookingRevenue(
  booking: BookingRow,
  bookingItems: BookingItemRow[]
) {
  const computedRevenue = bookingItems.reduce(
    (sum, item) => sum + Number(item.line_total ?? 0),
    0
  );

  if (computedRevenue > 0) return computedRevenue;

  return Number(booking.total_amount || 0);
}

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const selectedDate = params.date?.trim() || getYesterdayString();

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
    redirect("/desk");
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  const visibleBookings = ((bookings as BookingRow[]) ?? []).filter(
    (booking) => !isPendingPaymentBooking(booking)
  );

  const bookingIds = visibleBookings.map((booking) => booking.id);

  let items: BookingItemRow[] = [];

  if (bookingIds.length > 0) {
    const chunkSize = 100;

    for (let i = 0; i < bookingIds.length; i += chunkSize) {
      const chunk = bookingIds.slice(i, i + chunkSize);

      const { data, error } = await supabase
        .from("booking_items")
        .select("booking_id, quantity, line_total, title, product_type, meta")
        .in("booking_id", chunk);

      if (error) {
        console.error("history booking_items chunk error:", error);
      }

      if (data) {
        items = [...items, ...(data as BookingItemRow[])];
      }
    }
  }

  const bookingMetaMap = new Map<string, BookingMetaSummary>();

  for (const item of items) {
    const current = bookingMetaMap.get(item.booking_id) ?? emptyMeta();
    const code = getItemCode(item);

    let bags = current.bags;
    let showers = current.showers;
    let combo = current.combo;

    const extraCounts = getExtraCounts(item);

    if (code === "luggage") bags += item.quantity;
    if (code === "shower") showers += item.quantity;
    if (code === "combo") combo += item.quantity;

    bags += extraCounts.bags;
    showers += extraCounts.showers;

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
        : typeof item.meta?.showerTime === "string" &&
          item.meta.showerTime.trim() !== ""
        ? item.meta.showerTime
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
      typeof item.meta?.showerTime === "string" &&
      item.meta.showerTime.trim() !== ""
        ? item.meta.showerTime
        : typeof item.meta?.shower_time === "string" &&
          item.meta.shower_time.trim() !== ""
        ? item.meta.shower_time
        : typeof item.meta?.showerStartTime === "string" &&
          item.meta.showerStartTime.trim() !== ""
        ? item.meta.showerStartTime
        : typeof item.meta?.shower_start_time === "string" &&
          item.meta.shower_start_time.trim() !== ""
        ? item.meta.shower_start_time
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

  const historyBookings = [...visibleBookings]
    .filter((booking) => {
      const meta = bookingMetaMap.get(booking.id) ?? emptyMeta();
      const bookingDate = getBookingDate(booking, meta);

      return bookingDate === selectedDate;
    })
    .sort((a, b) => {
      const aTime = a.check_out_time ? new Date(a.check_out_time).getTime() : 0;
      const bTime = b.check_out_time ? new Date(b.check_out_time).getTime() : 0;

      if (aTime !== bTime) return bTime - aTime;

      return b.created_at.localeCompare(a.created_at);
    });

  let bagsSelected = 0;
  let showersSelected = 0;
  let combosSelected = 0;
  let revenueSelected = 0;

  const citiesSelectedCounts: Record<string, number> = {};
  const sourceSelectedCounts: Record<string, number> = {};
  const sourceSelectedRevenue: Record<string, number> = {};
  const paymentSelectedCounts: Record<string, number> = {};
  const paymentSelectedRevenue: Record<string, number> = {};

  for (const booking of historyBookings) {
    const meta = bookingMetaMap.get(booking.id) ?? emptyMeta();
    const bookingItems = items.filter((item) => item.booking_id === booking.id);

    const currentSource = booking.source ?? "choose";
    const currentPayment = booking.payment_method ?? "unpaid";

    sourceSelectedCounts[currentSource] =
      (sourceSelectedCounts[currentSource] ?? 0) + 1;

    paymentSelectedCounts[currentPayment] =
      (paymentSelectedCounts[currentPayment] ?? 0) + 1;

    if (countsForRevenue(booking)) {
      const bookingRevenue = getBookingRevenue(booking, bookingItems);

      revenueSelected += bookingRevenue;

      sourceSelectedRevenue[currentSource] =
        (sourceSelectedRevenue[currentSource] ?? 0) + bookingRevenue;

      paymentSelectedRevenue[currentPayment] =
        (paymentSelectedRevenue[currentPayment] ?? 0) + bookingRevenue;

      for (const item of bookingItems) {
        const code = getItemCode(item);
        const extraCounts = getExtraCounts(item);

        if (code === "luggage") bagsSelected += item.quantity;
        if (code === "shower") showersSelected += item.quantity;
        if (code === "combo") combosSelected += item.quantity;

        bagsSelected += extraCounts.bags;
        showersSelected += extraCounts.showers;
      }
    }

    const cityName = (booking.city ?? meta.city ?? "").trim();

    if (cityName) {
      citiesSelectedCounts[cityName] =
        (citiesSelectedCounts[cityName] ?? 0) + 1;
    }
  }

  const citiesSelectedList = Object.entries(citiesSelectedCounts)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12);

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Histórico</h1>
          <p className="text-sm text-gray-500">Sessão: {profile.email}</p>
        </div>

        <div className="w-full lg:w-auto">
          <div className="flex w-full gap-2 lg:w-auto">
            <Link
              href="/admin"
              className="inline-flex h-12 flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 lg:w-40 lg:flex-none"
            >
              Admin
            </Link>

            <form
              action="/admin/history"
              method="get"
              className="flex flex-[2] gap-2 lg:flex-none"
            >
              <input
                type="date"
                name="date"
                defaultValue={selectedDate}
                max={getTodayString()}
                className="h-12 min-w-0 flex-1 rounded-2xl border border-gray-200 bg-white px-3 text-sm font-bold text-gray-800 shadow-sm lg:w-40"
              />

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50"
              >
                Ver
              </button>
            </form>
          </div>
        </div>
      </div>

      <section className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border px-4 py-3">
          <div className="text-xs text-gray-500">Bags</div>
          <div className="text-xl font-bold">{bagsSelected}</div>
        </div>

        <div className="rounded-xl border px-4 py-3">
          <div className="text-xs text-gray-500">Showers</div>
          <div className="text-xl font-bold">{showersSelected}</div>
        </div>

        <div className="rounded-xl border px-4 py-3">
          <div className="text-xs text-gray-500">Combos</div>
          <div className="text-xl font-bold">{combosSelected}</div>
        </div>

        <div className="rounded-xl border px-4 py-3 bg-green-50">
          <div className="text-xs text-gray-500">Revenue</div>
          <div className="text-xl font-bold">
            {formatCurrency(revenueSelected, "EUR")}
          </div>
        </div>
      </section>

      <section className="rounded-xl border px-3 py-2">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="mr-1 font-semibold text-gray-700">Cities</span>

          {citiesSelectedList.length ? (
            citiesSelectedList.map(([city, count]) => (
              <span
                key={city}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-700"
              >
                {city}: {count}
              </span>
            ))
          ) : (
            <span className="text-gray-500">No cities for this day.</span>
          )}
        </div>
      </section>

      <section className="rounded-xl border px-3 py-2">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="mr-1 font-semibold text-gray-700">
                Day by source
              </span>

              {Object.entries(sourceSelectedCounts).length ? (
                Object.entries(sourceSelectedCounts)
                  .filter(
                    ([key, count]) =>
                      count > 0 || (sourceSelectedRevenue[key] ?? 0) > 0
                  )
                  .map(([key, count]) => (
                    <span
                      key={key}
                      className={`rounded-full px-2 py-0.5 ${getSourceColorClass(
                        key
                      )}`}
                    >
                      {key}: {count} ·{" "}
                      {formatCurrency(sourceSelectedRevenue[key] ?? 0, "EUR")}
                    </span>
                  ))
              ) : (
                <span className="text-gray-500">No sources.</span>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 text-xs lg:justify-end">
              <span className="mr-1 font-semibold text-gray-700">
                Payments
              </span>

              {Object.entries(paymentSelectedCounts).length ? (
                Object.entries(paymentSelectedCounts)
                  .filter(
                    ([payment, count]) =>
                      count > 0 ||
                      (paymentSelectedRevenue[payment] ?? 0) > 0
                  )
                  .map(([payment, count]) => (
                    <span
                      key={payment}
                      className={`rounded-full px-2 py-0.5 ${getPaymentColorClass(
                        payment
                      )}`}
                    >
                      {payment}: {count} ·{" "}
                      {formatCurrency(
                        paymentSelectedRevenue[payment] ?? 0,
                        "EUR"
                      )}
                    </span>
                  ))
              ) : (
                <span className="text-gray-500">No payments.</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold">
            {formatServiceDate(selectedDate)}
          </h2>

          <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
            {historyBookings.length}
          </div>
        </div>

        {!historyBookings.length ? (
          <div className="rounded-2xl border p-6 text-sm text-gray-600">
            Não existem reservas para este dia.
          </div>
        ) : (
          <section className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[1200px] text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b text-left text-[13px]">
                  <th className="px-3 py-2">Código</th>
                  <th className="w-[108px] px-2 py-2">Source</th>
                  <th className="w-[116px] px-2 py-2">Payment</th>
                  <th className="w-[118px] px-2 py-2">Status</th>
                  <th className="px-2 py-2">Date</th>
                  <th className="px-2 py-2">Cliente</th>
                  <th className="px-2 py-2">City</th>
                  <th className="px-2 py-2">Bags</th>
                  <th className="px-2 py-2">Shws</th>
                  <th className="px-2 py-2">Lug+Shw</th>
                  <th className="px-2 py-2">In</th>
                  <th className="px-2 py-2">Out</th>
                  <th className="px-2 py-2">Total</th>
                </tr>
              </thead>

              <tbody>
                {historyBookings.map((booking) => {
                  const meta = bookingMetaMap.get(booking.id) ?? emptyMeta();
                  const normalizedStatus = normalizeStatus(booking.status);
                  const isFinished = normalizedStatus === "completed";

                  return (
                    <tr
                      key={booking.id}
                      className={`border-b ${getSourceRowClass(
                        booking.source ?? null
                      )}`}
                    >
                      <td className="px-3 py-2 font-semibold text-[13px] leading-tight">
                        <Link
                          href={`/admin/booking/${booking.id}`}
                          className="underline hover:text-blue-600"
                        >
                          {booking.booking_code}
                        </Link>
                      </td>

                      <td className="w-[108px] px-2 py-2 align-top">
                        <AdminSourceSelect
                          bookingId={booking.id}
                          value={booking.source ?? "choose"}
                        />
                      </td>

                      <td className="w-[116px] px-2 py-2 align-top">
                        <AdminPaymentMethodSelect
                          bookingId={booking.id}
                          value={booking.payment_method ?? "unpaid"}
                        />
                      </td>

                      <td className="w-[118px] px-2 py-2 align-top">
                        <AdminStatusSelect
                          bookingId={booking.id}
                          value={normalizeStatus(booking.status)}
                        />
                      </td>

                      <td className="px-2 py-2 whitespace-nowrap text-[12px] align-top">
                        {formatServiceDate(getBookingDate(booking, meta))}
                      </td>

                      <td className="px-2 py-2 align-top">
                        <div className="max-w-[170px] text-[13px] leading-tight font-medium">
                          {booking.customer_name}
                        </div>
                        <div className="text-[11px] leading-tight text-gray-500">
                          {booking.source === "viator"
                            ? "-"
                            : booking.customer_email || "-"}
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
                        {isFinished
                          ? formatRealTime(booking.check_in_time)
                          : getFirstTimeSlot(meta.time_in || meta.drop_off)}
                      </td>

                      <td className="px-2 py-2 align-top text-[12px] leading-tight whitespace-nowrap">
                        {isFinished
                          ? formatRealTime(booking.check_out_time)
                          : getFirstTimeSlot(
                              meta.time_out || meta.pick_up || meta.shower_time
                            )}
                      </td>

                      <td className="px-2 py-2 align-top text-[12px] font-medium whitespace-nowrap">
                        {formatCurrency(
                          getBookingRevenue(
                            booking,
                            items.filter((item) => item.booking_id === booking.id)
                          ),
                          booking.currency
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
      </section>

      <div className="flex justify-center border-t pt-6">
        <LogoutButton className="inline-flex h-12 items-center justify-center rounded-2xl border border-gray-200 bg-white px-8 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50" />
      </div>
    </main>
  );
}