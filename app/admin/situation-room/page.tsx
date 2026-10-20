import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBookingPaymentModeState, getEnvironmentPaymentMode } from "@/lib/booking-payment-mode";
import PaymentModeControls from "./PaymentModeControls";

export const dynamic = "force-dynamic";

export default async function SituationRoomPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await client.from("profiles")
    .select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/desk");

  const state = await getBookingPaymentModeState();

  const { data: auditRows } = state.databaseReady
    ? await createAdminClient().from("operating_mode_events")
        .select("id, mode, changed_at")
        .order("changed_at", { ascending: false }).limit(8)
    : { data: null };

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <Link href="/admin" className="text-sm underline">← Back to Admin</Link>
      <div>
        <h1 className="text-3xl font-bold">Situation Room</h1>
        <p className="mt-1 text-sm text-gray-600">Emergency controls · Online bookings</p>
      </div>

      <section className="space-y-4 rounded-2xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Current payment mode</p>
            <p className={`mt-1 text-2xl font-bold ${state.mode === "on_arrival" ? "text-amber-700" : "text-emerald-700"}`}>
              {state.mode === "on_arrival" ? "SOS · PAY ON ARRIVAL" : "NORMAL · REVOLUT"}
            </p>
          </div>
          <span className="rounded-full border px-3 py-1 text-xs font-medium">
            {state.source === "database" ? "Live control" : "Vercel fallback"}
          </span>
        </div>
        {state.databaseReady ? (
          <PaymentModeControls mode={state.mode} databaseReady={state.databaseReady} />
        ) : (
          <div className="space-y-2 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">Controls are not enabled yet.</p>
            <p>Run the Supabase migration <code>20261020123000_situation_room.sql</code> in the SQL Editor. Until then, the system keeps using the Vercel setting <code>BOOKING_PAYMENT_MODE</code> ({getEnvironmentPaymentMode()}). No production mode change has been made.</p>
          </div>
        )}
      </section>

      <section className="space-y-3 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Safe preview · No changes</h2>
        <p className="text-sm text-gray-600">The two modes behave as follows. This preview does not switch production payments.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border p-3 text-sm">
            <p className="font-semibold">NORMAL</p>
            <p className="mt-1">New site reservation → Revolut checkout → booked after payment.</p>
          </div>
          <div className="rounded-xl border p-3 text-sm">
            <p className="font-semibold">SOS</p>
            <p className="mt-1">New site reservation → booked immediately → pay at reception.</p>
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded-2xl border p-5">
        <h2 className="text-lg font-semibold">Recent switches</h2>
        {auditRows?.length ? (
          <ul className="space-y-2 text-sm">
            {auditRows.map(row => (
              <li className="flex justify-between gap-4 border-b pb-2" key={row.id}>
                <span className="font-medium">{row.mode === "online" ? "NORMAL" : "SOS"}</span>
                <time>{new Date(row.changed_at).toLocaleString("en-GB", { timeZone: "Europe/Madrid" })}</time>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-gray-500">No mode switches logged yet.</p>}
      </section>
    </main>
  );
}
