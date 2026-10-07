begin;

-- Existing rows require explicit classification; do not infer their role from a fee.
alter table public.partners
  add column if not exists partner_type text
    check (partner_type in ('referral', 'travissima', 'both'));

-- Referral attribution must not overwrite existing lounge/operator ownership.
alter table public.bookings
  add column if not exists referral_partner_id uuid references public.partners(id);

create index if not exists bookings_referral_partner_id_idx
  on public.bookings(referral_partner_id)
  where referral_partner_id is not null;

comment on column public.partners.partner_type is
  'referral: sends guests; travissima: lounge/platform operator; both: both roles. NULL: legacy partner awaiting classification.';
comment on column public.partners.discount_percent is
  'Guest referral promotion percentage. Independent of Travissima platform commission.';
comment on column public.bookings.referral_partner_id is
  'Partner who referred the guest; separate from the existing partner_id association.';

commit;
