"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePromoCode } from "@/lib/promotions";

export async function savePartner(formData: FormData) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Authentication required.");
  const { data: profile } = await client.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") throw new Error("Admin access required.");
  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  if (id) {
    const code = normalizePromoCode(formData.get("code"));
    if (code && !/^[A-Z0-9_-]{2,40}$/.test(code)) throw new Error("Enter a valid promo code.");
    const update = code
      ? { promo_code: code, discount_percent: 15 }
      : { promo_active: formData.get("active") === "true" };
    const { error } = await admin.from("partners").update(update).eq("id", id);
    if (error) throw new Error("Could not update partner.");
  } else {
    const name = String(formData.get("name") ?? "").trim();
    const code = normalizePromoCode(formData.get("code"));
    if (!name || name.length > 200 || !/^[A-Z0-9_-]{2,40}$/.test(code)) throw new Error("Enter a partner name and a valid code (2–40 letters, numbers, - or _).");
    const { error } = await admin.from("partners").insert({
      name,
      slug: `${code.toLowerCase()}-${randomUUID().slice(0, 8)}`,
      status: "active",
      commission_type: "percent",
      commission_value: 0,
      promo_code: code,
      discount_percent: 15,
      promo_active: true,
    });
    if (error) throw new Error("Could not create partner. Check whether the code already exists.");
  }
  revalidatePath("/admin/partners");
}
