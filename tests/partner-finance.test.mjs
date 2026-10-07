import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { canReferGuests } from "../lib/partner-types.ts";
import { getItemDiscount, normalizePromoCode } from "../lib/promotions.ts";

// Exercise the actual invoice/refund functions without contacting financial APIs.
function loadFunctions(path, names, extras = {}) {
  const source = ts.createSourceFile(path, readFileSync(new URL(path, import.meta.url), "utf8"), ts.ScriptTarget.Latest, true);
  const code = source.statements.filter(node => ts.isFunctionDeclaration(node) && names.includes(node.name?.text)).map(node => node.getText(source).replace(/^export\s+/, "")).join("\n");
  const context = vm.createContext({ IVA_RATE: 21, getItemDiscount, ...extras });
  vm.runInContext(ts.transpileModule(code, { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText, context);
  return context;
}

const invoice = loadFunctions("../lib/alegra/issueInvoice.ts", ["buildInvoiceItem", "getProductConfig", "priceWithoutTax", "roundToSixDecimals", "cleanText", "toPositiveNumber"], { requiredEnv: name => name });
const refund = loadFunctions("../lib/alegra/creditNotes.ts", ["buildCreditNoteItems", "getProductConfig", "priceWithoutTax", "roundToSixDecimals", "roundMoney", "cleanText"], { requiredEnv: name => name });
const item = (type, price, quantity = 1) => ({ id: type, product_type: type, title: type, quantity, unit_price: price, line_total: price * quantity, meta: { partnerDiscountPercent: 15 } });

test("server accepts only active stored partner codes and fails closed on database errors", async () => {
  let result = { data: { id: "partner-1", name: "Partner", promo_code: "MARINA15", discount_percent: 15, promo_active: true, status: "active", partner_type: "referral" }, error: null };
  let requestedCode;
  const query = { select() { return this; }, eq(_column, value) { requestedCode = value; return this; }, async maybeSingle() { return result; } };
  const partner = loadFunctions("../lib/partner-promo.ts", ["resolvePartnerPromo"], { normalizePromoCode, canReferGuests, createAdminClient: () => ({ from: () => query }) });
  assert.equal((await partner.resolvePartnerPromo(" marina15 ")).percent, 15);
  assert.equal(requestedCode, "MARINA15");
  result = { ...result, data: { ...result.data, partner_type: "both" } };
  assert.equal((await partner.resolvePartnerPromo("MARINA15")).percent, 15);
  for (const partner_type of ["travissima", null, "unknown"]) {
    result = { ...result, data: { ...result.data, partner_type } };
    await assert.rejects(partner.resolvePartnerPromo("MARINA15"));
  }
  result = { ...result, data: { ...result.data, partner_type: "referral", promo_active: false } };
  await assert.rejects(partner.resolvePartnerPromo("MARINA15"));
  result = { ...result, data: { ...result.data, promo_active: true, status: "suspended" } };
  await assert.rejects(partner.resolvePartnerPromo("MARINA15"));
  result = { ...result, data: { ...result.data, status: "pending" } };
  await assert.rejects(partner.resolvePartnerPromo("MARINA15"));
  result = { data: null, error: null };
  await assert.rejects(partner.resolvePartnerPromo("UNKNOWN"));
  result = { data: null, error: { message: "unavailable" } };
  await assert.rejects(partner.resolvePartnerPromo("MARINA15"));
  await assert.rejects(partner.resolvePartnerPromo("<script>"));
});

test("invoice keeps full tariff before tax and sends explicit 15% discount", () => {
  for (const [type, price] of [["luggage", 8], ["shower", 12], ["combo", 18]]) {
    const line = invoice.buildInvoiceItem(item(type, price));
    assert.equal(line.discount, 15);
    assert.equal(Math.round(line.price * 1.21 * (1 - line.discount / 100) * 100), Math.round(price * .85 * 100));
  }
  assert.equal(invoice.buildInvoiceItem({ ...item("shower", 12), meta: {} }).discount, undefined);
  assert.equal(invoice.buildInvoiceItem({ ...item("shower", 12), meta: {} }, 15).discount, 15);
  assert.equal(invoice.buildInvoiceItem(item("shower", 12), 0).discount, undefined);
});

test("full and partial refunds across discounted items equal the refund amount", () => {
  const bookingItems = [item("luggage", 8, 2), item("shower", 12, 2), item("combo", 18)];
  const bookingTotal = 58 * .85;
  for (const refundAmount of [bookingTotal, 10, 25]) {
    const lines = refund.buildCreditNoteItems({ bookingItems, bookingTotal, refundAmount });
    assert.equal(Math.round(lines.reduce((sum, line) => sum + line.price * line.quantity * 1.21, 0) * 100), Math.round(refundAmount * 100));
    assert.ok(lines.every(line => line.price > 0));
  }
});
