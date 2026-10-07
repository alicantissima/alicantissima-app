begin;

-- Extend the existing partner model; retain its data, status and permissions.
alter table public.partners
  add column if not exists promo_code text unique
    check (promo_code ~ '^[A-Z0-9_-]{2,40}$'),
  add column if not exists discount_percent numeric(5,2) not null default 15
    check (discount_percent = 15),
  add column if not exists promo_active boolean not null default true;

alter table public.bookings
  add column if not exists promo_code text,
  add column if not exists subtotal_amount numeric(12,2),
  add column if not exists discount_percent numeric(5,2),
  add column if not exists discount_amount numeric(12,2);

create index if not exists bookings_partner_id_idx
  on public.bookings(partner_id)
  where partner_id is not null;

commit;
