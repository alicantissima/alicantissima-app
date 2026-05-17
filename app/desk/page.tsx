


import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeskQrScanner from "@/components/desk-qr-scanner";
import LogoutButton from "@/components/logout-button";
import EnablePushButton from "@/components/enable-push-button";

type BookingItemRow = {
  quantity: number;
  product_type?: string | null;
  title?: string | null;
  meta?: {
    showerTime?: string | null;
    showerEndTime?: string | null;
    showerDurationMinutes?: number | null;
    breakdown?: Array<{
      label?: string;
      quantity?: number;
    }>;
  } | null;
};

type BookingRow = {
  id: string;
  booking_code: string;
  customer_name: string;
  city?: string | null;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  created_at: string;
  service_date?: string | null;
  source?: string | null;
  booking_items?: BookingItemRow[] | null;
};

function getMadridDatePlusDays(days = 0) {
  const now = new Date();

  const madridParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const year = Number(madridParts.find((p) => p.type === "year")?.value);
  const month = Number(madridParts.find((p) => p.type === "month")?.value);
  const day = Number(madridParts.find((p) => p.type === "day")?.value);

  const madridDate = new Date(year, month - 1, day);
  madridDate.setDate(madridDate.getDate() + days);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(madridDate);
}

function getTodayMadridDate() {
  return getMadridDatePlusDays(0);
}

function getTomorrowMadridDate() {
  return getMadridDatePlusDays(1);
}

function getMadridHour() {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      hour12: false,
    }).format(new Date())
  );
}

function getSourceBadge(source?: string | null) {
  const s = source?.toLowerCase().trim() ?? "";

  if (s === "viator") {
    return (
      <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-green-900">
        Viator
      </span>
    );
  }

  if (!s || s === "choose") {
    return (
      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
        -
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-700">
      {s}
    </span>
  );
}

function formatDeskTime(value?: string | null) {
  if (!value) return "";

  return value.replace("h", ":");
}

function getDeskShowerSummary(booking: BookingRow) {
  const items = booking.booking_items ?? [];

  const showerItems = items.filter((item) => {
    const meta = item.meta ?? {};
    const title = item.title?.toLowerCase() ?? "";
    const productType = item.product_type?.toLowerCase() ?? "";

    return (
      Boolean(meta.showerTime) ||
      productType === "shower" ||
      productType === "combo" ||
      title.includes("shower") ||
      title.includes("combo")
    );
  });

  if (!showerItems.length) return "";

  let totalShowers = 0;
  let showerStart = "";
  let showerEnd = "";

  showerItems.forEach((item) => {
    const quantity = Number(item.quantity || 0);
    const meta = item.meta ?? {};

    if (Array.isArray(meta.breakdown) && meta.breakdown.length > 0) {
      const showerBreakdown = meta.breakdown.find((part) =>
        String(part.label || "").toLowerCase().includes("shower")
      );

      if (showerBreakdown) {
        totalShowers += Number(showerBreakdown.quantity || 0);
      } else {
        totalShowers += quantity;
      }
    } else {
      totalShowers += quantity;
    }

    if (!showerStart && meta.showerTime) {
      showerStart = formatDeskTime(meta.showerTime);
    }

    if (!showerEnd && meta.showerEndTime) {
      showerEnd = formatDeskTime(meta.showerEndTime);
    }
  });

  if (!totalShowers) return "";

  const timeLabel =
    showerStart && showerEnd
      ? `${showerStart}–${showerEnd}`
      : showerStart
        ? showerStart
        : "";

  return `${timeLabel ? `${timeLabel} · ` : ""}${totalShowers} shw`;
}

function getDeskBagSummary(booking: BookingRow) {
  const items = booking.booking_items ?? [];

  let totalBags = 0;

  items.forEach((item) => {
    const quantity = Number(item.quantity || 0);
    const meta = item.meta ?? {};
    const title = item.title?.toLowerCase() ?? "";
    const productType = item.product_type?.toLowerCase() ?? "";

    if (Array.isArray(meta.breakdown) && meta.breakdown.length > 0) {
      const bagBreakdown = meta.breakdown.find((part) => {
        const label = String(part.label || "").toLowerCase();

        return (
          label.includes("luggage") ||
          label.includes("bag") ||
          label.includes("malas") ||
          label.includes("mala")
        );
      });

      if (bagBreakdown) {
        totalBags += Number(bagBreakdown.quantity || 0);
        return;
      }
    }

    if (
      productType === "luggage" ||
      productType === "combo" ||
      title.includes("luggage") ||
      title.includes("bag") ||
      title.includes("combo")
    ) {
      totalBags += quantity;
    }
  });

  if (!totalBags) return "";

  return `${totalBags} bag`;
}

function DeskTable({
  title,
  rows,
  emptyText,
  highlight = false,
}: {
  title: string;
  rows: BookingRow[];
  emptyText: string;
  highlight?: boolean;
}) {
  return (
    <section
      className={`rounded-3xl border bg-white p-4 shadow-sm ${
        highlight ? "border-blue-200 ring-1 ring-blue-100" : ""
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`text-lg font-bold ${highlight ? "text-blue-700" : ""}`}>
          {title}
        </h2>

        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
            highlight
              ? "border-blue-200 bg-blue-50 text-blue-700"
              : "text-gray-600"
          }`}
        >
          {rows.length}
        </span>
      </div>

      {highlight && rows.length > 0 && (
        <div className="mb-3 rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-800">
          Tomorrow is already in focus — a good time to plan the next day.
        </div>
      )}

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="w-[34px] px-1 py-2 text-center font-medium">
                  +
                </th>
                <th className="px-2 py-2 font-medium">Customer</th>
                <th className="w-[38%] px-2 py-2 font-medium">City</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((booking) => {
                const bagSummary = getDeskBagSummary(booking);
                const showerSummary = getDeskShowerSummary(booking);

                return (
                  <tr
                    key={booking.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="p-0 align-top">
                      <Link
                        href={`/desk/booking/${booking.id}`}
                        className="flex h-full min-h-[64px] w-full items-start justify-center px-1 py-3 text-base font-black leading-none text-gray-700 hover:opacity-80"
                        title={booking.booking_code}
                      >
                        +
                      </Link>
                    </td>

                    <td className="p-0 align-top" colSpan={2}>
                      <Link
                        href={`/desk/booking/${booking.id}`}
                        className="block h-full min-h-[64px] w-full px-2 py-2 hover:opacity-80"
                        title={booking.customer_name}
                      >
                        <div className="grid grid-cols-[1fr_38%] gap-3">
                          <div className="break-words text-sm font-semibold leading-snug text-gray-950">
                            {booking.customer_name}
                          </div>

                          <div
                            className="break-words text-sm font-medium leading-snug text-gray-600"
                            title={booking.city || ""}
                          >
                            {booking.city || "-"}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {getSourceBadge(booking.source)}

                          {bagSummary && (
                            <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                              {bagSummary}
                            </span>
                          )}

                          {showerSummary && (
                            <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                              {showerSummary}
                            </span>
                          )}
                        </div>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function DeskPage() {
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

  if (!profile || (profile.role !== "admin" && profile.role !== "desk")) {
    redirect("/login");
  }

  const todayMadrid = getTodayMadridDate();
  const tomorrowMadrid = getTomorrowMadridDate();
  const madridHour = getMadridHour();
  const highlightTomorrow = madridHour >= 18;

  const selectFields = `
    id,
    booking_code,
    customer_name,
    city,
    status,
    check_in_time,
    check_out_time,
    created_at,
    service_date,
    source,
    booking_items (
      quantity,
      product_type,
      title,
      meta
    )
  `;

  const [insideQuery, todayQuery, finishedQuery, tomorrowQuery] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(selectFields)
        .eq("service_date", todayMadrid)
        .eq("status", "inside")
        .order("check_in_time", { ascending: true }),

      supabase
        .from("bookings")
        .select(selectFields)
        .eq("service_date", todayMadrid)
        .eq("status", "booked")
        .order("created_at", { ascending: true }),

      supabase
        .from("bookings")
        .select(selectFields)
        .eq("service_date", todayMadrid)
        .eq("status", "completed")
        .order("check_out_time", { ascending: false })
        .limit(20),

      supabase
        .from("bookings")
        .select(selectFields)
        .eq("service_date", tomorrowMadrid)
        .in("status", ["booked", "inside"])
        .order("created_at", { ascending: true }),
    ]);

  const inside = (insideQuery.data ?? []) as BookingRow[];
  const today = (todayQuery.data ?? []) as BookingRow[];
  const finished = (finishedQuery.data ?? []) as BookingRow[];
  const tomorrow = (tomorrowQuery.data ?? []) as BookingRow[];

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Desk</h1>
          <p className="text-sm text-gray-500">Session: {profile.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {profile.role === "admin" && (
            <Link
              href="/admin"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-medium hover:bg-gray-50"
            >
              Open Admin
            </Link>
          )}

          <DeskQrScanner />

          <LogoutButton />
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
        <DeskTable
          title="Inside"
          rows={inside}
          emptyText="No bookings currently inside."
        />

        <DeskTable
          title="Today"
          rows={today}
          emptyText="No pending arrivals for today."
        />

        <DeskTable
          title="Finished"
          rows={finished}
          emptyText="No finished bookings today."
        />

        <DeskTable
          title="Tomorrow"
          rows={tomorrow}
          emptyText="No bookings for tomorrow."
          highlight={highlightTomorrow}
        />
      </section>

      <section className="mt-8 flex justify-center opacity-70">
        <EnablePushButton />
      </section>
    </main>
  );
}