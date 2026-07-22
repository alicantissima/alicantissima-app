


import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeskCustomerSearch from "@/components/desk-customer-search";
import CopyEmailButton from "@/components/copy-email-button";
import ReviewReplyStatus from "@/components/review-reply-status";

type ReviewReply = {
  replied_at: string | null;
  replied_by: string | null;
};

type HistoryBooking = {
  id: string;
  service_date: string | null;
  customer_name: string | null;
  city: string | null;
  customer_email: string | null;
  source: string | null;
  review_email_sent_at: string | null;
  review_replies: ReviewReply[] | null;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
    filter?: string;
  }>;
};

function getMadridDatePlusDays(days = 0) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);

  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function normaliseSearchDate(value: string) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const portugueseDate = trimmed.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/
  );

  if (!portugueseDate) return null;

  const [, day, month, year] = portugueseDate;

  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function getDisplayEmail(booking: HistoryBooking) {
  const email = booking.customer_email?.trim() ?? "";

  if (!email) return null;

  const normalisedEmail = email.toLowerCase();

  if (
    normalisedEmail === "ask customer" ||
    normalisedEmail.includes("ask customer")
  ) {
    return null;
  }

  return email;
}

function getSourceClasses(source?: string | null) {
  switch (source?.toLowerCase().trim()) {
    case "viator":
      return "border-green-200 bg-green-50 text-green-800";
    case "walkin":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "site":
      return "border-blue-200 bg-blue-50 text-blue-800";
    default:
      return "border-gray-200 bg-gray-50 text-gray-600";
  }
}

function getSourceLabel(source?: string | null) {
  const value = source?.trim();

  if (!value) return "-";

  if (value.toLowerCase() === "walkin") return "Walk-in";

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex h-9 items-center justify-center rounded-xl border px-4 text-sm font-medium ${
        active
          ? "border-blue-600 bg-blue-600 text-white"
          : "bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {children}
    </Link>
  );
}

export default async function DeskHistoryPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const search = params.q?.trim() ?? "";
  const filter = params.filter?.trim().toLowerCase() ?? "all";

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

  if (!profile || !["admin", "desk"].includes(profile.role)) {
    redirect("/login");
  }

  const todayMadrid = getMadridDatePlusDays(0);
  const sevenDaysAgo = getMadridDatePlusDays(-7);
  const twoDaysAgoIso = new Date(
    Date.now() - 48 * 60 * 60 * 1000
  ).toISOString();

  let query = supabase
    .from("bookings")
    .select(
  `
    id,
    service_date,
    customer_name,
    city,
    customer_email,
    source,
    review_email_sent_at,
    review_replies (
      replied_at,
      replied_by
    )
  `
)
    .lt("service_date", todayMadrid)
    .in("status", ["completed", "no_show"])
    .order("service_date", { ascending: false })
    .order("customer_name", { ascending: true })
    .limit(500);

  if (filter === "recent") {
    query = query.gte("service_date", sevenDaysAgo);
  }

  if (filter === "queue") {
    query = query
      .not("review_email_sent_at", "is", null)
      .gte("review_email_sent_at", twoDaysAgoIso);
  }

  if (["site", "viator", "walkin"].includes(filter)) {
    query = query.eq("source", filter);
  }

  if (search) {
    const searchDate = normaliseSearchDate(search);

    if (searchDate) {
      query = query.eq("service_date", searchDate);
    } else {
      const safeSearch = search
        .replaceAll(",", " ")
        .replaceAll("%", "")
        .trim();

      query = query.or(
        [
          `customer_name.ilike.%${safeSearch}%`,
          `city.ilike.%${safeSearch}%`,
          `customer_email.ilike.%${safeSearch}%`,
          `source.ilike.%${safeSearch}%`,
        ].join(",")
      );
    }
  }

  const { data, error } = await query;

  const rawBookings = (data ?? []) as HistoryBooking[];

const repliedUserIds = Array.from(
  new Set(
    rawBookings
      .flatMap((booking) => booking.review_replies ?? [])
      .map((reply) => reply.replied_by)
      .filter((id): id is string => Boolean(id))
  )
);

const { data: replyProfiles } =
  repliedUserIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, email")
        .in("id", repliedUserIds)
    : { data: [] };

const replyUserEmailById = new Map(
  (replyProfiles ?? []).map((replyProfile) => [
    replyProfile.id,
    replyProfile.email,
  ])
);

const bookings =
  filter === "pending"
    ? rawBookings.filter(
        (booking) => !booking.review_replies?.length
      )
    : filter === "replied"
      ? rawBookings.filter(
          (booking) => Boolean(booking.review_replies?.length)
        )
      : rawBookings;

  function filterHref(nextFilter: string) {
    const urlParams = new URLSearchParams();

    if (search) {
      urlParams.set("q", search);
    }

    if (nextFilter !== "all") {
      urlParams.set("filter", nextFilter);
    }

    const queryString = urlParams.toString();

    return queryString
      ? `/desk/history?${queryString}`
      : "/desk/history";
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-7xl space-y-6 p-4 md:p-6">
      <section className="rounded-3xl border bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              href="/desk"
              className="inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium hover:bg-gray-50"
            >
              ← Back to Desk
            </Link>

            <h1 className="mt-4 text-3xl font-bold">Customers</h1>

            <p className="mt-1 text-sm text-gray-500">
              Identify past customers and manage Google Maps review replies.
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-600">
            <span className="font-bold text-gray-900">{bookings.length}</span>{" "}
            customers
          </div>
        </div>

        <div className="mt-6">
          <DeskCustomerSearch initialValue={search} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <FilterLink href={filterHref("all")} active={filter === "all"}>
            All
          </FilterLink>

          <FilterLink
            href={filterHref("recent")}
            active={filter === "recent"}
          >
            Last 7 days
          </FilterLink>

          <FilterLink
            href={filterHref("queue")}
            active={filter === "queue"}
          >
            Review queue · 48h
          </FilterLink>

<FilterLink
  href={filterHref("pending")}
  active={filter === "pending"}
>
  Pending replies
</FilterLink>

<FilterLink
  href={filterHref("replied")}
  active={filter === "replied"}
>
  Replied
</FilterLink>

          <FilterLink
            href={filterHref("site")}
            active={filter === "site"}
          >
            Website
          </FilterLink>

          <FilterLink
            href={filterHref("viator")}
            active={filter === "viator"}
          >
            Viator
          </FilterLink>

          <FilterLink
            href={filterHref("walkin")}
            active={filter === "walkin"}
          >
            Walk-in
          </FilterLink>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.message}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        {bookings.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No customers found.
          </div>
        ) : (
          <div className="max-h-[70dvh] overflow-auto">
            <table className="w-full min-w-[1140px] text-sm">
              <thead className="sticky top-0 z-10 bg-gray-50 shadow-sm">
                <tr className="border-b text-left text-gray-500">
  <th className="px-4 py-3 font-medium">Service date</th>
  <th className="px-4 py-3 font-medium">Name</th>
  <th className="px-4 py-3 font-medium">City</th>
  <th className="px-4 py-3 font-medium">Email</th>
  <th className="px-4 py-3 font-medium">Source</th>
  <th className="px-4 py-3 font-medium">Review</th>
  <th className="px-4 py-3 text-center font-medium">
    Search
  </th>
</tr>
              </thead>

              <tbody>
                {bookings.map((booking, index) => {
                  const email = getDisplayEmail(booking);
                  const customerName =
                    booking.customer_name?.trim() || "Customer";

                  const googleSearchUrl =
  "https://www.google.com/search?q=" +
  encodeURIComponent(
    `"${customerName}" Alicante Google Maps review`
  );

const reply = booking.review_replies?.[0] ?? null;

const repliedByEmail = reply?.replied_by
  ? replyUserEmailById.get(reply.replied_by) ?? null
  : null;

return (
                    <tr
                      key={booking.id}
                      className={`border-b last:border-b-0 hover:bg-blue-50 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                      }`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {formatDate(booking.service_date)}
                      </td>

                      <td className="px-4 py-3">
                        <Link
                          href={`/desk/booking/${booking.id}`}
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          {customerName}
                        </Link>
                      </td>

                      <td className="px-4 py-3">
                        {booking.city?.trim() || "-"}
                      </td>

                      <td className="px-4 py-3">
                        {email ? (
                          <CopyEmailButton email={email} />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
  <span
    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getSourceClasses(
      booking.source
    )}`}
  >
    {getSourceLabel(booking.source)}
  </span>
</td>

<td className="px-4 py-3 align-top">
  <ReviewReplyStatus
    bookingId={booking.id}
    replied={Boolean(reply)}
    repliedAt={reply?.replied_at}
    repliedBy={repliedByEmail}
  />
</td>

<td className="px-4 py-3 text-center">
  <a
    href={googleSearchUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-9 items-center justify-center rounded-xl border px-3 text-sm font-medium hover:bg-white"
                          title={`Search ${customerName} on Google`}
                        >
                          🔍
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}