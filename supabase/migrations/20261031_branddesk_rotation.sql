-- The monthly rotation for BrandDesk clients (canon-ve-front-of-house: "A monthly rotation across managed businesses: influencer
-- night, DJ night, customer appreciation, giveaways, a scavenger hunt stop, a community night with a coaching sheet"; canon v6:
-- "Photo nights every two months after launch... an idea library of campaigns clients pick from, each with a blueprint the Community
-- Manager follows"). Build order after the monthly check-in (Sean's "go", 2026-10-31).
-- One row a client a month. The check-in's Next month answer makes next month's row on its own (checkin_send); the team can add one.
-- The idea library and each campaign's blueprint live in ve-branddesk (CAMPAIGNS). The Community Manager sets the date, ticks the
-- blueprint, puts it on the Vegans Explore calendar (an events row the restaurant hosts) and records how it went.
create table if not exists public.ve_branddesk_campaigns (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ve_branddesk_accounts(id) on delete cascade,
  listing_id uuid not null references public.listings(id),
  month date not null check (extract(day from month) = 1),
  kind text not null check (kind in ('influencer_night','dj_night','customer_appreciation','giveaway','scavenger_stop','community_night','photo_night')),
  status text not null default 'planned' check (status in ('planned','scheduled','done','skipped')),
  assigned_to uuid references public.members(id),
  starts_at timestamptz,
  ends_at timestamptz,
  checks jsonb not null default '{}'::jsonb,
  note text check (char_length(note) <= 2000),
  results jsonb not null default '{}'::jsonb,
  event_id uuid references public.events(id) on delete set null,
  from_checkin uuid references public.ve_branddesk_checkins(id) on delete set null,
  created_by uuid references public.members(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.members(id),
  unique (account_id, month, kind)
);
alter table public.ve_branddesk_campaigns enable row level security;
create index if not exists ve_branddesk_campaigns_month_idx on public.ve_branddesk_campaigns (month, status);
