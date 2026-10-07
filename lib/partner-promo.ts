import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizePromoCode } from "@/lib/promotions";

export async function resolvePartnerPromo(value: unknown) {
  const code = normalizePromoCode(value);
  if (!/^[A-Z0-9_-]{2,40}$/.test(code)) throw new Error("Invalid or inactive promo code.");
  const { data, error } = await createAdminClient().from("partners")
    .select("id, name, promo_code, discount_percent, promo_active, status").eq("promo_code", code).maybeSingle();
  if (error) throw new Error("Promo codes are temporarily unavailable. Please try again.");
  if (!data?.promo_active || data.status !== "active" || Number(data.discount_percent) !== 15) throw new Error("Invalid or inactive promo code.");
  return { id: String(data.id), name: String(data.name), code: String(data.promo_code), percent: Number(data.discount_percent) };
}
