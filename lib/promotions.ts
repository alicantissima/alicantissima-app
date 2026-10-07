export function normalizePromoCode(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

export function calculateDiscount(subtotal: number, percent: number) {
  const cents = Math.round(subtotal * 100);
  if (!Number.isSafeInteger(cents) || cents < 0 || !Number.isFinite(percent) || percent < 0 || percent >= 100) {
    throw new Error("Invalid promotion amount.");
  }
  const discountCents = Math.round(cents * percent / 100);
  return { subtotal: cents / 100, discountAmount: discountCents / 100, total: (cents - discountCents) / 100 };
}

export function getItemDiscount(meta: Record<string, unknown> | null | undefined) {
  const percent = Number(meta?.partnerDiscountPercent ?? 0);
  if (!Number.isFinite(percent) || percent < 0 || percent >= 100) throw new Error("Invalid saved discount.");
  return percent;
}
