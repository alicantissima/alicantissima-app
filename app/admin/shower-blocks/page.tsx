


import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const revalidate = 0;
export const dynamic = "force-dynamic";

function getTodayMadridDate() {
  const now = new Date();

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
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

function formatTime(value?: string | null) {
  if (!value) return "-";
  return value.slice(0, 5);
}

async function createShowerBlock(formData: FormData) {
  "use server";

  const serviceDate = String(formData.get("serviceDate") || "");
  const startTime = String(formData.get("startTime") || "");
  const endTime = String(formData.get("endTime") || "");
  const showerRoom = Number(formData.get("showerRoom") || "");
  const reason = String(formData.get("reason") || "").trim() || null;

  if (!serviceDate || !startTime || !endTime) return;
  if (showerRoom !== 1 && showerRoom !== 2) return;
  if (startTime >= endTime) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return;

  await supabase.from("shower_blocks").insert({
    service_date: serviceDate,
    start_time: startTime,
    end_time: endTime,
    shower_room: showerRoom,
    reason,
    created_by: user.id,
  });

  revalidatePath("/admin/shower-blocks");
  revalidatePath("/admin");
  revalidatePath("/desk");
}

async function deleteShowerBlock(formData: FormData) {
  "use server";

  const blockId = String(formData.get("blockId") || "");

  if (!blockId) return;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return;

  await supabase.from("shower_blocks").delete().eq("id", blockId);

  revalidatePath("/admin/shower-blocks");
  revalidatePath("/admin");
  revalidatePath("/desk");
}

export default async function ShowerBlocksPage({
  searchParams,
}: {
  searchParams?: Promise<{ date?: string }>;
}) {
  const supabase = await createClient();
  const query = searchParams ? await searchParams : {};
  const selectedDate = query?.date || getTodayMadridDate();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/login");
  }

  const { data: blocks } = await supabase
    .from("shower_blocks")
    .select("id, service_date, start_time, end_time, shower_room, reason, created_at")
    .eq("service_date", selectedDate)
    .order("start_time", { ascending: true })
    .order("shower_room", { ascending: true });

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-4xl flex-col gap-6 p-4 md:p-6">
      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              ← Back to Admin
            </Link>

            <h1 className="text-3xl font-bold">Shower blocks</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manual internal blocks for S1 and S2.
            </p>
          </div>

          <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase text-gray-600">
            {formatDate(selectedDate)}
          </span>
        </div>
      </section>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold">Create block</h2>

        <form action={createShowerBlock} className="mt-4 grid gap-3 md:grid-cols-5">
          <div className="md:col-span-1">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Date
            </label>
            <input
              type="date"
              name="serviceDate"
              defaultValue={selectedDate}
              required
              className="h-11 w-full rounded-xl border px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Start
            </label>
            <input
              type="time"
              name="startTime"
              defaultValue="10:00"
              required
              className="h-11 w-full rounded-xl border px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              End
            </label>
            <input
              type="time"
              name="endTime"
              defaultValue="22:00"
              required
              className="h-11 w-full rounded-xl border px-3 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Room
            </label>
            <select
              name="showerRoom"
              defaultValue="2"
              className="h-11 w-full rounded-xl border px-3 text-sm"
            >
              <option value="1">S1</option>
              <option value="2">S2</option>
            </select>
          </div>

          <div className="md:col-span-5">
            <label className="mb-1 block text-xs font-medium text-gray-500">
              Reason
            </label>
            <input
              type="text"
              name="reason"
              placeholder="Maintenance, cleaning, unavailable..."
              className="h-11 w-full rounded-xl border px-3 text-sm"
            />
          </div>

          <div className="md:col-span-5">
            <button
              type="submit"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Create block
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Blocks for this date</h2>

          <form className="flex items-center gap-2">
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="h-10 rounded-xl border px-3 text-sm"
            />
            <button
              type="submit"
              className="h-10 rounded-xl border px-4 text-sm font-semibold hover:bg-gray-50"
            >
              View
            </button>
          </form>
        </div>

        {!blocks || blocks.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">
            No shower blocks for this date.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="px-2 py-2 font-medium">Room</th>
                  <th className="px-2 py-2 font-medium">Time</th>
                  <th className="px-2 py-2 font-medium">Reason</th>
                  <th className="px-2 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>

              <tbody>
                {blocks.map((block) => (
                  <tr key={block.id} className="border-b last:border-b-0">
                    <td className="px-2 py-3">
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">
                        S{block.shower_room}
                      </span>
                    </td>

                    <td className="px-2 py-3 font-semibold">
                      {formatTime(block.start_time)}–{formatTime(block.end_time)}
                    </td>

                    <td className="px-2 py-3 text-gray-600">
                      {block.reason || "-"}
                    </td>

                    <td className="px-2 py-3 text-right">
                      <form action={deleteShowerBlock}>
                        <input type="hidden" name="blockId" value={block.id} />
                        <button
                          type="submit"
                          className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
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