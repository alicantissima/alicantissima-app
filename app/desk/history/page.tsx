


import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type HistoryBooking = {
  id: string;
  service_date: string | null;
  customer_name: string | null;
  city: string | null;
  customer_email: string | null;
  source: string | null;
};

type PageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

function getTodayMadridDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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

function getDisplayEmail(booking: HistoryBooking) {
  const email = booking.customer_email?.trim() ?? "";

  if (!email) return "-";

  if (
    booking.source?.toLowerCase().trim() === "viator" &&
    email.toLowerCase().includes("ask customer")
  ) {
    return "-";
  }

  return email;
}

export default async function DeskHistoryPage({
  searchParams,
}: PageProps) {
  const supabase = await createClient();
  const params = await searchParams;
  const search = params.q?.trim() ?? "";

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

  const todayMadrid = getTodayMadridDate();

  let query = supabase
    .from("bookings")
    .select(
      "id, service_date, customer_name, city, customer_email, source"
    )
    .lt("service_date", todayMadrid)
    .in("status", ["completed", "no_show"])
    .order("service_date", { ascending: false })
    .order("customer_name", { ascending: true })
    .limit(500);

  if (search) {
    const safeSearch = search.replaceAll(",", " ");

    query = query.or(
      `customer_name.ilike.%${safeSearch}%,city.ilike.%${safeSearch}%,customer_email.ilike.%${safeSearch}%`
    );
  }

  const { data, error } = await query;

  const bookings = (data ?? []) as HistoryBooking[];

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

            <h1 className="mt-4 text-3xl font-bold">Customer history</h1>

            <p className="mt-1 text-sm text-gray-500">
              Search past customers by name, city or email.
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {bookings.length} results
          </div>
        </div>

        <form className="mt-6 flex flex-col gap-2 sm:flex-row">
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="Search name, city or email"
            className="h-11 flex-1 rounded-xl border px-4 text-sm outline-none focus:border-blue-400"
          />

          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Search
          </button>

          {search ? (
            <Link
              href="/desk/history"
              className="inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium hover:bg-gray-50"
            >
              Clear
            </Link>
          ) : null}
        </form>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.message}
          </div>
        ) : null}
      </section>

      <section className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        {bookings.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No past customers found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b text-left text-gray-500">
                  <th className="px-4 py-3 font-medium">Service date</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                      {formatDate(booking.service_date)}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        href={`/desk/booking/${booking.id}`}
                        className="font-semibold text-blue-700 hover:underline"
                      >
                        {booking.customer_name || "-"}
                      </Link>
                    </td>

                    <td className="px-4 py-3">
                      {booking.city || "-"}
                    </td>

                    <td className="px-4 py-3">
                      {getDisplayEmail(booking)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}