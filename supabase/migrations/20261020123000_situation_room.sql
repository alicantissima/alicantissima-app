-- Situation Room: emergency checkout mode with operator audit.
-- Keep the existing Revolut incident in SOS while the migration is applied.
-- Run this migration in Supabase SQL Editor before using the Admin toggle.

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  constraint app_settings_payment_mode_valid
    check (key <> 'booking_payment_mode' or value in ('online', 'on_arrival'))
);

alter table public.app_settings enable row level security;
-- No public policies: read/write only via the server's service-role key.

insert into public.app_settings (key, value)
values ('booking_payment_mode', 'on_arrival')
on conflict (key) do nothing;

create table if not exists public.operating_mode_events (
  id bigint generated always as identity primary key,
  mode text not null check (mode in ('online', 'on_arrival')),
  actor_id uuid references auth.users(id),
  changed_at timestamptz not null default now()
);

alter table public.operating_mode_events enable row level security;

create or replace function public.set_booking_payment_mode(
  p_mode text,
  p_actor uuid
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_mode not in ('online', 'on_arrival') or p_mode is null then
    raise exception 'Invalid payment mode';
  end if;

  update public.app_settings
     set value = p_mode,
         updated_at = now(),
         updated_by = p_actor
   where key = 'booking_payment_mode'
     and value is distinct from p_mode;

  if found then
    insert into public.operating_mode_events (mode, actor_id)
    values (p_mode, p_actor);
  elsif not exists (
    select 1 from public.app_settings where key = 'booking_payment_mode'
  ) then
    raise exception 'Booking payment mode setting is missing';
  end if;
end;
$$;

revoke all on function public.set_booking_payment_mode(text, uuid)
  from public, anon, authenticated;
grant execute on function public.set_booking_payment_mode(text, uuid)
  to service_role;
