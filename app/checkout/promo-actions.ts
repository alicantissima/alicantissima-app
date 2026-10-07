"use server";

import { resolvePartnerPromo } from "@/lib/partner-promo";

export async function validatePartnerPromo(code: string) {
  try {
    const promo = await resolvePartnerPromo(code);
    return { ok: true as const, code: promo.code, percent: promo.percent };
  } catch {
    return { ok: false as const };
  }
}
