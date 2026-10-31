-- BrandDesk accounts: the contract and Stripe step (canon canon-ve-front-of-house; Sean approved 2026-10-31: test mode first, the
-- agreement as a draft for the lawyer). One row per client signing up for managed marketing through /business/managed.
-- Money: $1,500 setup (at once, or 3 x $500 or 6 x $250 a month), $500 a month, social +$500 a month, pause $99 a month.
-- Stripe runs in test mode until ve_site_settings branddesk.live is true (Sean's go-live word after he reads the agreement).
create table if not exists public.ve_branddesk_accounts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id),
  member_id uuid not null references public.members(id),
  setup_plan text not null check (setup_plan in ('full', '3', '6')),
  social boolean not null default false,
  status text not null default 'checkout' check (status in ('checkout', 'active', 'paused', 'canceling', 'ended', 'abandoned')),
  test boolean not null default true,
  agreement_version text not null,
  agreed_name text not null,
  agreed_at timestamptz not null default now(),
  agreed_ip text,
  stripe_session text,
  stripe_customer text,
  stripe_subscription text,
  stripe_schedule text,
  installments_left int not null default 0,
  pause_from date,
  pause_until date,
  pauses jsonb not null default '[]'::jsonb,
  activated_at timestamptz,
  canceled_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_branddesk_accounts_listing on public.ve_branddesk_accounts(listing_id);
create index if not exists ve_branddesk_accounts_sub on public.ve_branddesk_accounts(stripe_subscription);
alter table public.ve_branddesk_accounts enable row level security;
insert into public.ve_site_settings (key, value) values ('branddesk', '{"live": false}'::jsonb)
  on conflict (key) do nothing;
