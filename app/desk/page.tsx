


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
  service_date: string | null;
  check_in_time: string | null;
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

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Madrid",
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  }).format(new Date(`${value}T00:00:00`));
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
}: {
  title: string;
  rows: BookingRow[];
  emptyText: string;
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
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-3 font-medium">Code</th>
                <th className="py-2 pr-3 font-medium">Cliente</th>
                <th className="py-2 pr-3 font-medium">Data</th>
                <th className="py-2 pr-3 font-medium">Hora</th>
                <th className="py-2 pr-0 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((booking) => (
                <tr key={booking.id} className="border-b last:border-b-0">
                  <td className="py-2 pr-3">
                    <Link
                      href={`/admin/booking/${booking.id}`}
                      className="font-semibold hover:underline"
                    >
                      {booking.booking_code}
                    </Link>
                  </td>
                  <td className="py-2 pr-3">{booking.customer_name}</td>
                  <td className="py-2 pr-3">{formatDate(booking.service_date)}</td>
                  <td className="py-2 pr-3">
                    {booking.status === "inside"
                      ? formatTime(booking.check_in_time)
                      : "-"}
                  </td>
                  <td className="py-2 pr-0 uppercase">{booking.status}</td>
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

  if (!profile || profile.role !== "admin") {
    return <div className="p-6">Acesso negado.</div>;
  }

  const todayMadrid = getTodayMadridDate();

  const [{ data: inside = [] }, { data: today = [] }, { data: upcoming = [] }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, booking_code, customer_name, status, service_date, check_in_time, created_at"
        )
        .eq("status", "inside")
        .order("check_in_time", { ascending: true }),

      supabase
        .from("bookings")
        .select(
          "id, booking_code, customer_name, status, service_date, check_in_time, created_at"
        )
        .eq("service_date", todayMadrid)
        .in("status", ["pending", "inside"])
        .order("created_at", { ascending: false }),

      supabase
        .from("bookings")
        .select(
          "id, booking_code, customer_name, status, service_date, check_in_time, created_at"
        )
        .gt("service_date", todayMadrid)
        .in("status", ["pending", "inside"])
        .order("service_date", { ascending: true })
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
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
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
        />

        <DeskTable
          title="Today"
          rows={today as BookingRow[]}
          emptyText="Nenhuma reserva para hoje."
        />

        <DeskTable
          title="Upcoming"
          rows={upcoming as BookingRow[]}
          emptyText="Sem reservas futuras."
        />
      </section>
    </main>
  );
}