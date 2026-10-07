import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateDiscount, normalizePromoCode, getItemDiscount } from "../lib/promotions.ts";

test("partner tariff totals and combo extras agree with payment cents", () => {
  for (const [subtotal, expected] of [[8, 6.8], [12, 10.2], [18, 15.3], [38, 32.3], [76, 64.6]]) {
    const result = calculateDiscount(subtotal, 15);
    assert.equal(result.total, expected);
    assert.equal(Math.round(result.total * 100) + Math.round(result.discountAmount * 100), Math.round(subtotal * 100));
  }
});
test("codes normalize, inactive legacy bookings have no discount, invalid saved discounts fail", () => {
  assert.equal(normalizePromoCode(" marina15 "), "MARINA15");
  assert.equal(getItemDiscount(null), 0);
  assert.equal(getItemDiscount({ partnerDiscountPercent: 15 }), 15);
  for (const percent of [-1, 100, NaN]) assert.throws(() => calculateDiscount(18, percent));
  assert.throws(() => getItemDiscount({ partnerDiscountPercent: "tampered" }));
});
