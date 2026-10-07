export const PARTNER_TYPES = ["referral", "travissima", "both"] as const;
export type PartnerType = (typeof PARTNER_TYPES)[number];

export function isPartnerType(value: unknown): value is PartnerType {
  return PARTNER_TYPES.some(type => type === value);
}

export function canReferGuests(value: unknown) {
  return value === "referral" || value === "both";
}

export function partnerTypeLabel(value: unknown) {
  if (value === "referral") return "Referral";
  if (value === "travissima") return "Travissima";
  if (value === "both") return "Referral + Travissima";
  return "Unclassified";
}
