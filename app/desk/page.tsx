


import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminQrScanner from "@/components/admin-qr-scanner";
import LogoutButton from "@/components/logout-button";

type BookingRow = {
  id: string;
  booking_code: string;
  customer_name: string;
  status: string;
  check_in_time: string | null;
  check_out_time: string | null;
  created_at: string;
};

function getTodayMadridDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function DeskTable({
  title,
  rows,
  emptyText,
  timeField = "check_in_time",
}: {
  title: string;
  rows: BookingRow[];
  emptyText: string;
  timeField?: "check_in_time" | "check_out_time";
}) {
  return (
    <section className="rounded-3xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <span className="rounded-full border px-2 py-0.5 text-xs font-medium text-gray-600">
          {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead>
  <tr className="border-b text-left text-gray-500">
    <th className="w-[96px] px-2 py-2 font-medium">Code</th>
    <th className="px-2 py-2 font-medium">Cliente</th>
    <th className="w-[64px] px-0 py-2 font-medium">Hora</th>
  </tr>
</thead>
<tbody>
  {rows.map((booking) => (
    <tr
      key={booking.id}
      className="border-b last:border-b-0 hover:bg-gray-50"
    >
      <td className="p-0 align-top">
        <Link
          href={`/admin/booking/${booking.id}`}
          className="block h-full w-full break-all px-2 py-2 text-xs font-semibold leading-tight underline hover:opacity-80"
          title={booking.booking_code}
        >
          {booking.booking_code}
        </Link>
      </td>

      <td className="p-0 align-top">
        <Link
          href={`/admin/booking/${booking.id}`}
          className="block h-full w-full break-words px-2 py-2 text-sm leading-tight hover:opacity-80"
          title={booking.customer_name}
        >
          {booking.customer_name}
        </Link>
      </td>

      <td className="p-0 align-top">
        <Link
          href={`/admin/booking/${booking.id}`}
          className="block h-full w-full px-0 py-2 text-sm hover:opacity-80"
        >
          {formatTime(
            timeField === "check_out_time"
              ? booking.check_out_time
              : booking.check_in_time
          )}
        </Link>
      </td>
    </tr>
  ))}
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

  if (!profile || !["admin", "desk"].includes(profile.role)) {
  return <AccessDenied />;
}

  const todayMadrid = getTodayMadridDate();

  const [{ data: inside = [] }, { data: today = [] }, { data: finished = [] }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, booking_code, customer_name, status, check_in_time, check_out_time, created_at"
        )
        .eq("service_date", todayMadrid)
        .eq("status", "inside")
        .order("check_in_time", { ascending: true }),

      supabase
        .from("bookings")
        .select(
          "id, booking_code, customer_name, status, check_in_time, check_out_time, created_at"
        )
        .eq("service_date", todayMadrid)
        .eq("status", "pending")
        .order("created_at", { ascending: true }),

      supabase
        .from("bookings")
        .select(
          "id, booking_code, customer_name, status, check_in_time, check_out_time, created_at"
        )
        .eq("service_date", todayMadrid)
        .eq("status", "finished")
        .order("check_out_time", { ascending: false })
        .limit(20),
    ]);

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-7xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Desk</h1>
          <p className="text-sm text-gray-500">Sessão: {profile.email}</p>
        </div>

        <div className="flex items-center gap-3">
  <Link
    href="/admin"
    className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-200 px-5 text-sm font-medium hover:bg-gray-50"
  >
    Abrir Admin
  </Link>

  <LogoutButton />
</div>
      </div>

      <section className="rounded-3xl border p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-2xl font-bold">Scan QR</h2>
          <p className="mt-1 text-sm text-gray-500">
            Lê o QR e abre a reserva. A ação é decidida depois dentro da ficha.
          </p>
        </div>

        <div className="flex justify-center">
          <AdminQrScanner />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <DeskTable
          title="Inside"
          rows={inside as BookingRow[]}
          emptyText="Nenhuma reserva em inside."
          timeField="check_in_time"
        />

        <DeskTable
          title="Today"
          rows={today as BookingRow[]}
          emptyText="Nenhuma chegada pendente para hoje."
          timeField="check_in_time"
        />

        <DeskTable
          title="Finished"
          rows={finished as BookingRow[]}
          emptyText="Nenhuma reserva finalizada hoje."
          timeField="check_out_time"
        />
      </section>
    </main>
  );
}