


import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeskQrScanner from "@/components/desk-qr-scanner";
import LogoutButton from "@/components/logout-button";
import EnablePushButton from "@/components/enable-push-button";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type BookingItemRow = {
  id: string;
  quantity: number;
  shower_room?: number | null;
  product_type?: string | null;
  title?: string | null;
  meta?: {
  showerTime?: string | null;
  shower_time?: string | null;
  showerStartTime?: string | null;
  shower_start_time?: string | null;
  showerEndTime?: string | null;
  shower_room?: string | number | null;
  showerDone?: boolean | null;
  shower_done?: boolean | null;
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

  return value
    .trim()
    .replace("H", "h")
    .replace("h", ":");
}

function getDeskSortableTime(value?: string | null) {
  if (!value) return "99:99";

  return value
    .trim()
    .split("-")[0]
    ?.trim()
    .replace("H", "h")
    .replace("h", ":") || "99:99";
}

function getDeskShowerRoom(booking: BookingRow) {
  const items = booking.booking_items ?? [];

  for (const item of items) {
    const meta = item.meta ?? {};

    const roomFromMeta = meta.shower_room;
    const roomFromItem = item.shower_room;

    if (roomFromMeta) {
      const cleanRoom = String(roomFromMeta).toUpperCase().trim();
      return cleanRoom.startsWith("S") ? cleanRoom : `S${cleanRoom}`;
    }

    if (roomFromItem) {
      const cleanRoom = String(roomFromItem).toUpperCase().trim();
      return cleanRoom.startsWith("S") ? cleanRoom : `S${cleanRoom}`;
    }
  }

  return "";
}

function getDeskShowerRoomRank(booking: BookingRow) {
  const showerTime = getDeskShowerSortTime(booking);
  const room = getDeskShowerRoom(booking);

  if (!showerTime) return 99;

  if (room === "S1") return 1;
  if (room === "S2") return 2;

  return 3;
}

function getDeskShowerSortTime(booking: BookingRow) {
  const items = booking.booking_items ?? [];

  for (const item of items) {
    const meta = item.meta ?? {};
    const title = item.title?.toLowerCase() ?? "";
    const productType = item.product_type?.toLowerCase() ?? "";

    const showerTime =
      meta.showerTime ||
      meta.shower_time ||
      meta.showerStartTime ||
      meta.shower_start_time ||
      null;

    const isShowerBooking =
      Boolean(showerTime) ||
      productType === "shower" ||
      productType === "combo" ||
      title.includes("shower") ||
      title.includes("combo");

    if (isShowerBooking && showerTime) {
      return showerTime;
    }
  }

  return null;
}

function getDeskShowerDoneItem(booking: BookingRow) {
  const items = booking.booking_items ?? [];

  for (const item of items) {
    const meta = item.meta ?? {};
    const title = item.title?.toLowerCase() ?? "";
    const productType = item.product_type?.toLowerCase() ?? "";

    const hasShower =
      Boolean(
        meta.showerTime ||
          meta.shower_time ||
          meta.showerStartTime ||
          meta.shower_start_time
      ) ||
      productType === "shower" ||
      productType === "combo" ||
      title.includes("shower") ||
      title.includes("combo");

    if (hasShower) {
      return item;
    }
  }

  return null;
}

function isDeskShowerDone(booking: BookingRow) {
  const item = getDeskShowerDoneItem(booking);
  const meta = item?.meta ?? {};

  return Boolean(meta.showerDone || meta.shower_done);
}

function sortDeskByShowerTimeThenLuggage(bookings: BookingRow[]) {
  return bookings.sort((a, b) => {
    const aRoomRank = getDeskShowerRoomRank(a);
    const bRoomRank = getDeskShowerRoomRank(b);

    if (aRoomRank !== bRoomRank) {
      return aRoomRank - bRoomRank;
    }

    const aShowerTime = getDeskShowerSortTime(a);
    const bShowerTime = getDeskShowerSortTime(b);

    if (aShowerTime && bShowerTime) {
      return getDeskSortableTime(aShowerTime).localeCompare(
        getDeskSortableTime(bShowerTime)
      );
    }

    if (aShowerTime && !bShowerTime) return -1;
    if (!aShowerTime && bShowerTime) return 1;

    return 0;
  });
}

function getDeskShowerSummary(booking: BookingRow) {
  const items = booking.booking_items ?? [];

  let totalShowers = 0;
  let showerStart = "";
  let showerEnd = "";
  let showerRoom = "";

  items.forEach((item) => {
    const quantity = Number(item.quantity || 0);
    const meta = item.meta ?? {};
    const title = item.title?.toLowerCase() ?? "";
    const productType = item.product_type?.toLowerCase() ?? "";

    const rawStart =
      meta.showerTime ||
      meta.shower_time ||
      meta.showerStartTime ||
      meta.shower_start_time ||
      "";

    const rawEnd = meta.showerEndTime || "";

    const hasShower =
      Boolean(rawStart) ||
      productType === "shower" ||
      productType === "combo" ||
      title.includes("shower") ||
      title.includes("ducha") ||
      title.includes("duche") ||
      title.includes("douche") ||
      title.includes("doccia") ||
      title.includes("dusche") ||
      title.includes("prysznic");

    if (!hasShower) return;

    if (Array.isArray(meta.breakdown) && meta.breakdown.length > 0) {
      meta.breakdown.forEach((part) => {
        const label = String(part.label || "").toLowerCase();

        if (
          label.includes("shower") ||
          label.includes("ducha") ||
          label.includes("duche") ||
          label.includes("douche") ||
          label.includes("doccia") ||
          label.includes("dusche") ||
          label.includes("prysznic")
        ) {
          totalShowers += Number(part.quantity || 0);
        }
      });
    } else {
      totalShowers += quantity;
    }

    if (!showerStart && rawStart) {
      const cleanStart = formatDeskTime(rawStart);

      if (cleanStart.includes("-")) {
        const [start, end] = cleanStart.split("-");
        showerStart = start?.trim() || "";
        showerEnd = end?.trim() || "";
      } else {
        showerStart = cleanStart;
      }
    }

    if (!showerEnd && rawEnd) {
      showerEnd = formatDeskTime(rawEnd);
    }

    const roomFromMeta = meta.shower_room;
    const roomFromItem = item.shower_room;

    if (!showerRoom && roomFromMeta) {
      const cleanRoom = String(roomFromMeta).toUpperCase().trim();
      showerRoom = cleanRoom.startsWith("S") ? cleanRoom : `S${cleanRoom}`;
    }

    if (!showerRoom && roomFromItem) {
      const cleanRoom = String(roomFromItem).toUpperCase().trim();
      showerRoom = cleanRoom.startsWith("S") ? cleanRoom : `S${cleanRoom}`;
    }
  });

  if (!totalShowers) return "";

  const timeLabel =
    showerStart && showerEnd
      ? `${showerStart}–${showerEnd}`
      : showerStart || "";

  return `${showerRoom ? `${showerRoom} · ` : ""}${
  timeLabel ? `${timeLabel} · ` : ""
}${totalShowers} shw`;
}

function getDeskBagSummary(booking: BookingRow) {
  const items = booking.booking_items ?? [];

  let totalBags = 0;
  let totalCombos = 0;

  items.forEach((item) => {
    const quantity = Number(item.quantity || 0);
    const meta = item.meta ?? {};
    const title = item.title?.toLowerCase() ?? "";
    const productType = item.product_type?.toLowerCase() ?? "";

    const isCombo =
      productType === "combo" ||
      title.includes("combo") ||
      title.includes("luggage + shower") ||
      title.includes("luggage and shower") ||
      title.includes("bag + shower") ||
      title.includes("bag and shower");

    if (isCombo) {
      if (Array.isArray(meta.breakdown) && meta.breakdown.length > 0) {
        const comboPart = meta.breakdown.find((part) => {
          const label = String(part.label || "").toLowerCase();

          return (
            label.includes("luggage + shower") ||
            label.includes("luggage and shower") ||
            label.includes("bag + shower") ||
            label.includes("bag and shower") ||
            label.includes("combo")
          );
        });

        totalCombos += Number(comboPart?.quantity || quantity);
      } else {
        totalCombos += quantity;
      }

      return;
    }

    if (Array.isArray(meta.breakdown) && meta.breakdown.length > 0) {
      meta.breakdown.forEach((part) => {
        const label = String(part.label || "").toLowerCase();

        const isBag =
          label.includes("luggage") ||
          label.includes("bag") ||
          label.includes("malas") ||
          label.includes("mala") ||
          label.includes("equipaje") ||
          label.includes("maleta");

        const isShower =
          label.includes("shower") ||
          label.includes("ducha") ||
          label.includes("duche") ||
          label.includes("douche") ||
          label.includes("doccia") ||
          label.includes("dusche") ||
          label.includes("prysznic");

        if (isBag && !isShower) {
          totalBags += Number(part.quantity || 0);
        }
      });

      return;
    }

    if (
      productType === "luggage" ||
      productType === "booking" ||
      title.includes("luggage") ||
      title.includes("bag")
    ) {
      totalBags += quantity;
    }
  });

  const parts: string[] = [];

  if (totalCombos) {
    parts.push(`${totalCombos} lug+shw`);
  }

  if (totalBags) {
    parts.push(`${totalBags} bag`);
  }

  return parts.join(" · ");
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
    <th className="px-2 py-2 font-medium">Customer</th>
    <th className="w-1/3 px-2 py-2 font-medium">City</th>
  </tr>
</thead>

            <tbody>
              {rows.map((booking) => {
                const bagSummary = getDeskBagSummary(booking);
const showerSummary = getDeskShowerSummary(booking);
const showerDone = isDeskShowerDone(booking);

                return (
                  <tr
  key={booking.id}
  className="border-b last:border-b-0 hover:bg-gray-50"
>
  <td className="p-0 align-top" colSpan={2}>
                      <Link
                        href={`/desk/booking/${booking.id}`}
                        className="block h-full min-h-[58px] w-full px-2 py-2 hover:opacity-80"
                        title={booking.customer_name}
                      >
                        <div className="grid grid-cols-[2fr_1fr] gap-3">
                          <div className="truncate text-sm font-semibold leading-snug text-gray-950">
                            {booking.customer_name}
                          </div>

                          <div
                            className="truncate text-sm font-medium leading-snug text-gray-600"
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
  <span
    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
      showerDone
        ? "bg-green-100 text-green-800"
        : "bg-blue-50 text-blue-700"
    }`}
  >
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
  id,
  quantity,
  shower_room,
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

  const inside = sortDeskByShowerTimeThenLuggage(
  (insideQuery.data ?? []) as BookingRow[]
);

const today = sortDeskByShowerTimeThenLuggage(
  (todayQuery.data ?? []) as BookingRow[]
);

const finished = ((finishedQuery.data ?? []) as BookingRow[]).sort((a, b) => {
  const aTime = a.check_out_time ? new Date(a.check_out_time).getTime() : 0;
  const bTime = b.check_out_time ? new Date(b.check_out_time).getTime() : 0;

  return bTime - aTime;
});
const tomorrow = sortDeskByShowerTimeThenLuggage(
  (tomorrowQuery.data ?? []) as BookingRow[]
);

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
      className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
    >
      Open Admin
    </Link>
  )}

  <div className="[&_button]:h-11 [&_button]:rounded-xl [&_button]:border [&_button]:border-gray-300 [&_button]:bg-white [&_button]:px-5 [&_button]:text-sm [&_button]:font-semibold [&_button]:text-gray-900 [&_button]:shadow-sm [&_button:hover]:bg-gray-50">
    <DeskQrScanner />
  </div>

  <div className="[&_button]:h-11 [&_button]:rounded-xl [&_button]:border [&_button]:border-gray-300 [&_button]:bg-white [&_button]:px-5 [&_button]:text-sm [&_button]:font-semibold [&_button]:text-gray-900 [&_button]:shadow-sm [&_button:hover]:bg-gray-50">
    <LogoutButton />
  </div>
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