import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { canReferGuests, partnerTypeLabel } from "@/lib/partner-types";
import { savePartner } from "./actions";

export const dynamic = "force-dynamic";

export default async function PartnersPage() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/desk");
  const { data: partners, error } = await createAdminClient().from("partners")
    .select("id, name, promo_code, promo_active, status, partner_type, commission_type, commission_value").order("name");
  return <main className="mx-auto max-w-3xl space-y-6 p-6">
    <Link href="/admin">← Admin</Link>
    <h1 className="text-2xl font-bold">Partners</h1>
    <p>Referral partners send guests with a 15% guest discount. Travissima partners operate lounges through the platform. Guest discounts and platform fees are separate.</p>
    {error ? <p>Partners are unavailable. Apply both partner database migrations first.</p> : <>
      <h2 className="text-xl font-semibold">Create referral partner</h2>
      <form action={savePartner} className="flex flex-wrap gap-3 rounded-xl border p-4">
        <input aria-label="Partner name" name="name" placeholder="Partner name" maxLength={200} required className="rounded border bg-transparent p-2" />
        <input aria-label="Promo code" name="code" placeholder="Promo code" pattern="[A-Za-z0-9_-]{2,40}" maxLength={40} required className="rounded border bg-transparent p-2" />
        <button className="rounded border px-4 py-2">Create referral partner</button>
        <p className="w-full text-sm">15% guest discount · No referral commission</p>
      </form>
      <div className="space-y-3">{partners?.map(partner => <div key={partner.id} className="space-y-3 rounded-xl border p-4">
        <div><strong>{partner.name}</strong><p>{partnerTypeLabel(partner.partner_type)} · Status: {partner.status}</p></div>
        {(partner.partner_type === "travissima" || partner.partner_type === "both") &&
          <p className="text-sm">Travissima platform fee: {partner.commission_value}{partner.commission_type === "percent" ? "%" : " (fixed)"}</p>}
        {!partner.partner_type && <p className="text-sm">Choose a role to enable referral promotions. Existing commission settings are retained.</p>}
        <form action={savePartner} className="flex flex-wrap gap-2">
          <input type="hidden" name="id" value={partner.id} />
          <select aria-label={`Type for ${partner.name}`} name="partnerType" defaultValue={partner.partner_type || ""} required className="rounded border bg-transparent p-2">
            <option value="" disabled>Choose partner type</option>
            <option value="referral">Referral</option>
            <option value="travissima">Travissima</option>
            <option value="both">Referral + Travissima</option>
          </select>
          <button className="rounded border px-4 py-2">Save type</button>
        </form>
        {canReferGuests(partner.partner_type) && <>
          <p>{partner.promo_code || "No promo code"} · Guest discount: 15% · {partner.promo_active ? "Promo active" : "Promo inactive"}</p>
          <form action={savePartner} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={partner.id} />
            <input aria-label={`Promo code for ${partner.name}`} name="code" defaultValue={partner.promo_code || ""} placeholder="Promo code" pattern="[A-Za-z0-9_-]{2,40}" maxLength={40} required className="min-w-0 rounded border bg-transparent p-2" />
            <button className="rounded border px-4 py-2">Save code</button>
          </form>
          {partner.promo_code && <form action={savePartner}>
            <input type="hidden" name="id" value={partner.id} />
            <input type="hidden" name="active" value={String(!partner.promo_active)} />
            <button className="rounded border px-4 py-2">{partner.promo_active ? "Deactivate promo" : "Activate promo"}</button>
          </form>}
        </>}
      </div>)}</div>
    </>}
  </main>;
}
