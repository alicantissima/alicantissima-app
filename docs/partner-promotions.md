# Partner promo codes

Online checkout supports one active partner code per booking. The discount is 15% on luggage, showers, combos and combo extras. Codes are case-insensitive when entered and stored uppercase. Admins can create and activate/deactivate codes at `/admin/partners`.

## Release order

1. Run `supabase/migrations/20261007120000_partner_promotions.sql` in the existing Supabase project before deploying this branch. This adds a private partners table and nullable booking columns; existing bookings remain unchanged.
2. Deploy the branch to a preview and create a partner code through Admin → Partners.
3. Check valid/invalid/inactive codes, changing or clearing a code, and bookings without a code. Verify all products and a combo with extras.
4. Validate an online test booking through the configured Revolut environment and inspect the resulting Alegra invoice/PDF. Confirm original prices, explicit 15% discount, IVA 21%, and identical paid/invoiced totals. Example: combo + one luggage extra + one shower extra = €38 gross, €5.70 discount, €32.30 payable. Live financial APIs were not called during local verification.
5. Validate a cancellation/refund and its credit note. Then merge/release.

## Accounting

`bookings.total_amount` is the discounted payment amount. `subtotal_amount`, `discount_percent`, `discount_amount`, `promo_code` and `partner_id` record attribution and the pricing snapshot. Original prices remain in `booking_items`; server-owned metadata records the applied code and percentage. A later deactivation affects new checkouts, not existing reservations or invoices.

The existing Revolut creation routes and webhook already use the persisted total; no browser-supplied discount amount is sent to Revolut. Alegra receives original tax-exclusive unit prices and `discount: 15` per invoice line. Discounted combos are split into the main combo and their extras. Visible invoice notes also identify the code and percentage. Confirmation emails and the booking pass show the discount.

Refund allocation uses the sum of original booking item amounts, ensuring a discounted booking total does not inflate multi-line refunds. Credit note line prices reflect the actual amount being returned.

References: https://developer.alegra.com/reference/post_invoices-preview and https://developer.alegra.com/reference/post_credit-notes.

## Local checks

- `npx tsc --noEmit` passed.
- `node --experimental-strip-types --test tests/*.test.mjs` (Node 22+) covers promotion totals, stored discount validation, active code lookup, invoice discount payloads and full/partial multi-line refunds.
- Next.js production compilation passed; page-data collection requires the existing VAPID/push environment configuration, which is absent locally.
- ESLint reports three existing `no-explicit-any` errors in checkout shower availability code, plus existing unused-variable warnings. New files pass ESLint.
