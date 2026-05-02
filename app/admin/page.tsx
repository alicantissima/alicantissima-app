

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminQrScanner from "@/components/admin-qr-scanner";
import LogoutButton from "@/components/logout-button";
import AdminAutoRefresh from "./AdminAutoRefresh";
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
  total_amount: number;
  currency: string;
  status: string;
  source?: string | null;
  payment_method?: string | null;
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

function getFirstTimeSlot(value?: string | null) {
  if (!value) return "-";
  return value.split("-")[0]?.trim() || "-";
}

function getSortableTime(value?: string | null) {
  if (!value) return "99:99";
  return getFirstTimeSlot(value).replace("h", ":");
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

function normalizeStatus(status: string) {
  if (status === "received") return "booked";
  if (status === "pending") return "booked";
  if (status === "inside") return "inside";
  if (status === "completed") return "completed";
  if (status === "finished") return "completed";
  if (status === "cancelled") return "cancelled";
  if (status === "no_show") return "no_show";
  return "booked";
}

function getSourceRowClass(source?: string | null) {
  return "";
}

function getItemCode(item: BookingItemRow) {
  const productCode = item.meta?.product_code?.toLowerCase().trim() ?? "";
  const productType = item.product_type?.toLowerCase().trim() ?? "";
  const title = item.title?.toLowerCase().trim() ?? "";

  const dropOffTime =
    typeof item.meta?.dropOffTime === "string" ? item.meta.dropOffTime.trim() : "";
  const pickUpTime =
    typeof item.meta?.pickUpTime === "string" ? item.meta.pickUpTime.trim() : "";
  const showerTime =
    typeof item.meta?.showerTime === "string" ? item.meta.showerTime.trim() : "";

  const hasBagSignal = !!dropOffTime || !!pickUpTime;
  const hasShowerSignal = !!showerTime;

  const text = [productCode, productType, title].filter(Boolean).join(" ");

  const hasBagWord =
    text.includes("luggage") ||
    text.includes("bag") ||
    text.includes("bags") ||
    text.includes("bagagem") ||
    text.includes("mala") ||
    text.includes("malas") ||
    text.includes("maleta") ||
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
  const breakdown = Array.isArray(item.meta?.breakdown) ? item.meta.breakdown : [];

  return breakdown.reduce(
    (acc, part) => {
      const label = part.label?.toLowerCase().trim() ?? "";
      const qty = Number(part.quantity || 0);

      if (!qty) return acc;

      const hasBagWord =
        label.includes("luggage") ||
        label.includes("bag") ||
        label.includes("bags") ||
        label.includes("bagagem") ||
        label.includes("mala") ||
        label.includes("malas") ||
        label.includes("maleta") ||
        label.includes("bagagli") ||
        label.includes("bagaglio") ||
        label.includes("bagaż") ||
        label.includes("bagaz") ||
        label.includes("walizk");

      const hasShowerWord =
        label.includes("shower") ||
        label.includes("showers") ||
        label.includes("ducha") ||
        label.includes("duche") ||
        label.includes("doccia") ||
        label.includes("prysznic") ||
        label.includes("douche") ||
        label.includes("dusche");

      const isCombo =
        label.includes("combo") ||
        label.includes("lug+shw") ||
        (hasBagWord && hasShowerWord);

      if (isCombo) {
        return acc;
      }

      if (hasShowerWord) {
        acc.showers += qty;
      } else if (hasBagWord) {
        acc.bags += qty;
      }

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
    <section className="space-y-2">
      <div className="flex items-center gap-3">
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
        <table className="w-full min-w-[1220px] text-sm">
          <thead className={cancelled ? "bg-red-50" : "bg-gray-50"}>
            <tr className="border-b text-left text-[13px]">
              <th className="px-2 py-2">Date</th>
              <th className="px-2 py-2">Client</th>
              <th className="px-2 py-2">City</th>
              <th className="w-[108px] px-2 py-2">Source</th>
              <th className="w-[116px] px-2 py-2">Payment</th>
              <th className="w-[118px] px-2 py-2">Status</th>
<th className="px-2 py-2 text-center">Bags</th>
<th className="px-2 py-2 text-center">Shws</th>
<th className="px-2 py-2 text-center">Lug + Shw</th>              <th className="px-2 py-2">In</th>
              <th className="px-2 py-2">Out</th>
              <th className="px-2 py-2">Total</th>
            </tr>
          </thead>

          <tbody>
            {bookings.map((booking) => {
              const meta = bookingMetaMap.get(booking.id) ?? emptyMeta();

              const normalizedStatus = normalizeStatus(booking.status);
              const isFilteredMatch = codeFilter === booking.booking_code;
              const sourceRowClass = getSourceRowClass(booking.source ?? null);
              const isFinished = normalizedStatus === "completed";
              const bookingHref = `/admin/booking/${booking.id}`;

              const rowClass = cancelled
                ? "bg-red-50/40"
                : isFilteredMatch
                ? "bg-blue-50 border-l-4 border-blue-400"
                : normalizedStatus === "inside"
                ? "bg-green-50 border-l-4 border-green-400"
                : sourceRowClass;

              const cellLinkClass =
                "block h-full w-full px-2 py-2 hover:bg-black/[0.03]";

              return (
                <tr
                  key={booking.id}
                  className={`border-b transition ${rowClass}`}
                  title={`Open booking ${booking.booking_code}`}
                >
                  <td className="whitespace-nowrap text-[12px] align-top">
                    <Link href={bookingHref} className={cellLinkClass}>
                      {formatServiceDate(meta.date)}
                    </Link>
                  </td>

                  <td className="align-top">
                    <Link href={bookingHref} className={cellLinkClass}>
                      <div className="max-w-[190px] text-[13px] leading-tight font-medium">
                        {booking.customer_name}
                      </div>
                      <div className="text-[11px] leading-tight text-gray-500">
                        {booking.source === "viator"
                          ? "-"
                          : booking.customer_email || "-"}
                      </div>
                    </Link>
                  </td>

                  <td className="align-top text-[12px] leading-tight max-w-[90px]">
                    <Link href={bookingHref} className={cellLinkClass}>
                      {booking.city ?? meta.city ?? "-"}
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

                  <td className="align-top text-center text-[12px]">
                    <Link href={bookingHref} className={cellLinkClass}>
                      {meta.bags || "-"}
                    </Link>
                  </td>

<td className="align-top text-center text-[12px]">                    <Link href={bookingHref} className={cellLinkClass}>
                      {meta.showers || "-"}
                    </Link>
                  </td>

<td className="align-top text-center text-[12px]">                    <Link href={bookingHref} className={cellLinkClass}>
                      {meta.combo || "-"}
                    </Link>
                  </td>

                  <td className="align-top text-[12px] leading-tight whitespace-nowrap">
                    <Link href={bookingHref} className={cellLinkClass}>
                      {isFinished
                        ? formatRealTime(booking.check_in_time)
                        : getFirstTimeSlot(meta.time_in || meta.drop_off)}
                    </Link>
                  </td>

                  <td className="align-top text-[12px] leading-tight whitespace-nowrap">
                    <Link href={bookingHref} className={cellLinkClass}>
                      {isFinished
                        ? formatRealTime(booking.check_out_time)
                        : getFirstTimeSlot(
                            meta.time_out || meta.pick_up || meta.shower_time
                          )}
                    </Link>
                  </td>

                  <td className="align-top text-[12px] font-medium whitespace-nowrap">
                    <Link href={bookingHref} className={cellLinkClass}>
                      {formatCurrency(Number(booking.total_amount), booking.currency)}
                    </Link>
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/desk");
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

  const sourceKeys = [
    "choose",
    "site",
    "viator",
    "walkin",
    "turismo",
    "hector",
    "pilar",
    "melia",
    "other_host",
    "other",
  ] as const;

  type SourceKey = (typeof sourceKeys)[number];

  const paymentKeys = ["card", "cash", "viator"] as const;
  type PaymentKey = (typeof paymentKeys)[number];

  const sourceTodayCounts: Record<SourceKey, number> = {
    choose: 0,
    site: 0,
    viator: 0,
    walkin: 0,
    turismo: 0,
    hector: 0,
    pilar: 0,
    melia: 0,
    other_host: 0,
    other: 0,
  };

  const sourceTodayRevenue: Record<SourceKey, number> = {
    choose: 0,
    site: 0,
    viator: 0,
    walkin: 0,
    turismo: 0,
    hector: 0,
    pilar: 0,
    melia: 0,
    other_host: 0,
    other: 0,
  };

  const paymentTodayCounts: Record<PaymentKey, number> = {
    card: 0,
    cash: 0,
    viator: 0,
  };

  const paymentTodayRevenue: Record<PaymentKey, number> = {
    card: 0,
    cash: 0,
    viator: 0,
  };

  const citiesTodayCounts: Record<string, number> = {};

  for (const booking of ((bookings as BookingRow[]) ?? [])) {
    const normalizedStatus = normalizeStatus(booking.status);
    const meta = bookingMetaMap.get(booking.id) ?? emptyMeta();
    const bookingDate = meta.date;

    const itemsForBooking =
      (items as BookingItemRow[])?.filter((i) => i.booking_id === booking.id) ?? [];

    if (
      isToday(bookingDate) &&
      normalizedStatus !== "cancelled" &&
      normalizedStatus !== "no_show"
    ) {
      const currentSource = (booking.source ?? "choose") as SourceKey;
      const bookingRevenue = Number(booking.total_amount || 0);
      const currentPayment = (booking.payment_method ?? "").toLowerCase() as PaymentKey;

      revenueToday += bookingRevenue;

      if (currentSource in sourceTodayCounts) {
        sourceTodayCounts[currentSource]++;
        sourceTodayRevenue[currentSource] += bookingRevenue;
      }

      if (currentPayment in paymentTodayCounts) {
        paymentTodayCounts[currentPayment]++;
        paymentTodayRevenue[currentPayment] += bookingRevenue;
      }

      for (const item of itemsForBooking) {
        const code = getItemCode(item);
        const extraCounts = getExtraCounts(item);

        if (code === "luggage") bagsToday += item.quantity;
        if (code === "shower") showersToday += item.quantity;
        if (code === "combo") combosToday += item.quantity;

        bagsToday += extraCounts.bags;
        showersToday += extraCounts.showers;
      }

      const cityName = (booking.city ?? meta.city ?? "").trim();

      if (cityName) {
        citiesTodayCounts[cityName] = (citiesTodayCounts[cityName] ?? 0) + 1;
      }
    }

    if (normalizedStatus === "inside") {
      for (const item of itemsForBooking) {
        const code = getItemCode(item);
        const extraCounts = getExtraCounts(item);

        if (code === "luggage") bagsInside += item.quantity;
        if (code === "shower") showersInside += item.quantity;

        bagsInside += extraCounts.bags;
        showersInside += extraCounts.showers;
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
  const cancelledBookings: BookingRow[] = [];
  const tomorrowBookings: BookingRow[] = [];
  const upcomingBookings: BookingRow[] = [];

function getTomorrowString() {
  const now = new Date();
  const madridNow = new Date(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now)
  );

  madridNow.setDate(madridNow.getDate() + 1);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(madridNow);
}

function isTomorrow(date: string | null) {
  if (!date) return false;
  return date === getTomorrowString();
}

function isUpcoming(date: string | null) {
  if (!date) return false;
  return date > getTomorrowString();
}

  for (const booking of sortedBookings) {
    const meta = bookingMetaMap.get(booking.id) ?? emptyMeta();
    const date = meta.date;
    const status = normalizeStatus(booking.status);

    if (status === "inside") {
      insideBookings.push(booking);
      continue;
    }

    if (status === "cancelled" || status === "no_show") {
      if (isToday(date)) {
        cancelledBookings.push(booking);
      }
      continue;
    }

    if (status === "completed") {
      if (isToday(date)) {
        finishedBookings.push(booking);
      }
      continue;
    }

    if (isToday(date)) {
      todayBookings.push(booking);
      continue;
    }

    if (isTomorrow(date)) {
  tomorrowBookings.push(booking);
  continue;
}

if (isUpcoming(date)) {
  upcomingBookings.push(booking);
  continue;
}
  }

  insideBookings.sort((a, b) => {
    const aMeta = bookingMetaMap.get(a.id) ?? emptyMeta();
    const bMeta = bookingMetaMap.get(b.id) ?? emptyMeta();

    const aOut = getSortableTime(
      aMeta.time_out || aMeta.pick_up || aMeta.shower_time || aMeta.checkout_time
    );
    const bOut = getSortableTime(
      bMeta.time_out || bMeta.pick_up || bMeta.shower_time || bMeta.checkout_time
    );

    return aOut.localeCompare(bOut);
  });

  finishedBookings.sort((a, b) => {
    const aTime = a.check_out_time ? new Date(a.check_out_time).getTime() : 0;
    const bTime = b.check_out_time ? new Date(b.check_out_time).getTime() : 0;

    return bTime - aTime;
  });

  const upcomingTotal = upcomingBookings.reduce(
    (sum, booking) => sum + Number(booking.total_amount || 0),
    0
  );

    const visibleBookingsCount =
  todayBookings.length +
  insideBookings.length +
  finishedBookings.length +
  cancelledBookings.length +
  tomorrowBookings.length +
  upcomingBookings.length;

function renderRevenueBar(bookingsList: BookingRow[], label: string) {
  if (!bookingsList.length) return null;

const total = bookingsList.reduce(
  (sum, booking) => sum + Number(booking.total_amount || 0),
  0
);

  const counts: Record<SourceKey, number> = {
    choose: 0,
    site: 0,
    viator: 0,
    walkin: 0,
    turismo: 0,
    hector: 0,
    pilar: 0,
    melia: 0,
    other_host: 0,
    other: 0,
  };

  const revenue: Record<SourceKey, number> = {
    choose: 0,
    site: 0,
    viator: 0,
    walkin: 0,
    turismo: 0,
    hector: 0,
    pilar: 0,
    melia: 0,
    other_host: 0,
    other: 0,
  };

  for (const booking of bookingsList) {
    const source = (booking.source ?? "choose") as SourceKey;
    const amount = Number(booking.total_amount || 0);

    if (source in counts) {
      counts[source]++;
      revenue[source] += amount;
    }
  }

  return (
  <section className="rounded-xl border px-4 py-3">
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
        <span className="mr-2 font-semibold text-gray-800">{label}</span>

        {sourceKeys
          .filter((key) => counts[key] > 0 || revenue[key] > 0)
          .map((key) => {
            const colorClass =
              key === "choose"
                ? "bg-zinc-100 text-zinc-800"
                : key === "site"
                ? "bg-pink-100 text-pink-800"
                : key === "viator"
                ? "bg-green-100 text-green-800"
                : key === "walkin"
                ? "bg-orange-100 text-orange-800"
                : key === "turismo"
                ? "bg-sky-100 text-sky-800"
                : key === "hector" ||
                  key === "pilar" ||
                  key === "melia" ||
                  key === "other_host"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-purple-100 text-purple-800";

            return (
              <span key={key} className={`rounded-full px-3 py-1 ${colorClass}`}>
                {key}: {counts[key]} · {formatCurrency(revenue[key], "EUR")}
              </span>
            );
          })}
      </div>

      <div className="shrink-0 text-sm font-semibold text-gray-900">
        {bookingsList.length} · {formatCurrency(total, "EUR")}
      </div>
    </div>
  </section>
);
}

  return (
 <main className="mx-auto max-w-7xl space-y-6 p-6">
          <AdminAutoRefresh intervalMs={60000} />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin · Reservas</h1>
          <p className="text-sm text-gray-500">Sessão: {profile.email}</p>
        </div>

        <div className="flex flex-col items-start gap-2 lg:items-end">
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Link
              href="/desk"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Abrir Desk
            </Link>

            <LogoutButton className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <AdminQrScanner className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50" />

            <Link
              href="/admin/history"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Histórico
            </Link>

            <div className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-700">
              Total visíveis:
              <strong className="ml-1 font-semibold">{visibleBookingsCount}</strong>
            </div>
          </div>
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

      <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-xl border px-4 py-3">
          <div className="text-xs text-gray-500">Bags</div>
          <div className="text-xl font-bold">{bagsToday}</div>
        </div>

        <div className="rounded-xl border px-4 py-3">
          <div className="text-xs text-gray-500">Showers</div>
          <div className="text-xl font-bold">{showersToday}</div>
        </div>

        <div className="rounded-xl border px-4 py-3">
          <div className="text-xs text-gray-500">Combos</div>
          <div className="text-xl font-bold">{combosToday}</div>
        </div>

        <div className="rounded-xl border px-4 py-3">
          <div className="text-xs text-gray-500">Bags in</div>
          <div className="text-xl font-bold">{bagsInside}</div>
        </div>

        <div className="rounded-xl border px-4 py-3">
          <div className="text-xs text-gray-500">Showers in</div>
          <div className="text-xl font-bold">{showersInside}</div>
        </div>

        <div className="rounded-xl border px-4 py-3 bg-green-50">
          <div className="text-xs text-gray-500">Revenue today</div>
          <div className="text-xl font-bold">
            {formatCurrency(revenueToday, "EUR")}
          </div>
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

<section className="rounded-xl border p-4">
  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
    <div className="min-w-0">
      <div className="mb-3 text-sm font-semibold text-gray-700">
        Results by source today
      </div>

      <div className="flex flex-wrap gap-2 text-sm">
        {sourceKeys
          .filter(
            (key) => sourceTodayCounts[key] > 0 || sourceTodayRevenue[key] > 0
          )
          .map((key) => {
            const colorClass =
              key === "choose"
                ? "bg-zinc-100 text-zinc-800"
                : key === "site"
                ? "bg-pink-100 text-pink-800"
                : key === "viator"
                ? "bg-green-100 text-green-800"
                : key === "walkin"
                ? "bg-orange-100 text-orange-800"
                : key === "turismo"
                ? "bg-sky-100 text-sky-800"
                : key === "hector" ||
                  key === "pilar" ||
                  key === "melia" ||
                  key === "other_host"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-purple-100 text-purple-800";

            return (
              <span key={key} className={`rounded-full px-3 py-1 ${colorClass}`}>
                {key}: {sourceTodayCounts[key]} ·{" "}
                {formatCurrency(sourceTodayRevenue[key], "EUR")}
              </span>
            );
          })}
      </div>
    </div>

    <div className="min-w-0 lg:text-right">
      <div className="mb-3 text-sm font-semibold text-gray-700">
        Payments today
      </div>

      <div className="flex flex-wrap gap-2 text-sm lg:justify-end">
        {paymentKeys
          .filter(
            (key) => paymentTodayCounts[key] > 0 || paymentTodayRevenue[key] > 0
          )
          .map((key) => {
            const colorClass =
              key === "card"
                ? "bg-blue-100 text-blue-800"
                : key === "cash"
                ? "bg-amber-100 text-amber-800"
                : "bg-green-100 text-green-800";

            return (
              <span key={key} className={`rounded-full px-3 py-1 ${colorClass}`}>
                {key}: {paymentTodayCounts[key]} ·{" "}
                {formatCurrency(paymentTodayRevenue[key], "EUR")}
              </span>
            );
          })}
      </div>
    </div>
  </div>
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

      {renderSectionTable({
        title: "Cancelled / No show",
        bookings: cancelledBookings,
        bookingMetaMap,
        codeFilter,
        cancelled: true,
      })}

      {renderRevenueBar(tomorrowBookings, "Results by source tomorrow")}

      {renderSectionTable({
        title: "Tomorrow",
        bookings: tomorrowBookings,
        bookingMetaMap,
        codeFilter,
      })}

      {upcomingBookings.length > 0 && <div className="border-t pt-6" />}

      {renderRevenueBar(upcomingBookings, "Results by source upcoming")}

      {renderSectionTable({
        title: "Upcoming",
        bookings: upcomingBookings,
        bookingMetaMap,
        codeFilter,
      })}
    </main>
  );
}