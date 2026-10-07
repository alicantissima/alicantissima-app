import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { savePartner } from "./actions";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/desk");
  const { data: partners, error } = await createAdminClient().from("partners").select("id, name, promo_code, promo_active, status").order("name");
  return <main className="mx-auto max-w-3xl space-y-6 p-6">
    <Link href="/admin">← Admin</Link>
    <h1 className="text-2xl font-bold">Partners · 15% promo codes</h1>
    {error ? <p>Partners are unavailable. Apply the partner promotions database migration first.</p> : <>
      <form action={savePartner} className="flex flex-wrap gap-3 rounded-xl border p-4">
        <input aria-label="Partner name" name="name" placeholder="Partner name" maxLength={200} required className="rounded border bg-transparent p-2" />
        <input aria-label="Promo code" name="code" placeholder="Promo code" pattern="[A-Za-z0-9_-]{2,40}" maxLength={40} required className="rounded border bg-transparent p-2" />
        <button className="rounded border px-4 py-2">Create partner</button>
      </form>
      <div className="space-y-3">{partners?.map(partner => <div key={partner.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <div><strong>{partner.name}</strong><p>{partner.promo_code || "No promo code"} · 15% · {partner.promo_active ? "Promo active" : "Promo inactive"} · Partner: {partner.status}</p></div>
        <form action={savePartner} className="flex gap-2">
          <input type="hidden" name="id" value={partner.id} />
          <input aria-label={`Promo code for ${partner.name}`} name="code" defaultValue={partner.promo_code || ""} placeholder="Promo code" pattern="[A-Za-z0-9_-]{2,40}" maxLength={40} required className="min-w-0 rounded border bg-transparent p-2" />
          <button className="rounded border px-4 py-2">Save code</button>
        </form>
        <form action={savePartner}>
          <input type="hidden" name="id" value={partner.id} />
          <input type="hidden" name="active" value={String(!partner.promo_active)} />
          <button className="rounded border px-4 py-2">{partner.promo_active ? "Deactivate" : "Activate"}</button>
        </form>
      </div>)}</div>
    </>}
  </main>;
}
