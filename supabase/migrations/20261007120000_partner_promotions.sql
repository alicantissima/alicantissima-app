begin;

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  promo_code text not null unique check (promo_code ~ '^[A-Z0-9_-]{2,40}$'),
  discount_percent numeric(5,2) not null default 15 check (discount_percent = 15),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.partners enable row level security;
revoke all on public.partners from anon, authenticated;
grant all on public.partners to service_role;

alter table public.bookings
  add column partner_id uuid references public.partners(id),
  add column promo_code text,
  add column subtotal_amount numeric(12,2),
  add column discount_percent numeric(5,2),
  add column discount_amount numeric(12,2);
create index bookings_partner_id_idx on public.bookings(partner_id) where partner_id is not null;

commit;
