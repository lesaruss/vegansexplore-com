-- Sean, 2026-11-15: "yes, make it live and build the entry page" (11 Days of Giving, plan locked 2026-11-13 in playbook ve-holiday-guide:
-- December 1 to 11, partners give up to $100 in prizes, members enter free, winners drawn at random in the open, fulfilled within 30 days).
-- Build step 3: the member entry page (the Holiday Guide's 11 Days of Giving section) and its data. Read and written only by the ve-giving
-- function (service role); nothing here is open to the browser. Safe to run twice.
--   ve_giving_entries  one entry per member per giveaway (free; no purchase, no share, tag or follow to enter)
--   ve_giving_prizes   the Prize Vault: one row per prize a partner gives (pledged until our team confirms it, then live)
--   ve_site_settings 'giving_2026'  entries_open stays false until the official rules have had the attorney's read and Sean says open
--                                   (BOSS 2026-11-13); prize_cap_cents is the $5,000 total cap (Florida and New York register above it).
create table if not exists public.ve_giving_entries (
  id uuid primary key default gen_random_uuid(),
  campaign text not null default '11-days-of-giving-2026' check (campaign ~ '^[a-z0-9-]{3,60}$'),
  member_id uuid not null references public.members(id) on delete cascade,
  entered_at timestamptz not null default now(),
  source text,
  unique (campaign, member_id)
);
alter table public.ve_giving_entries enable row level security;
revoke all on public.ve_giving_entries from anon, authenticated;

create table if not exists public.ve_giving_prizes (
  id uuid primary key default gen_random_uuid(),
  campaign text not null default '11-days-of-giving-2026' check (campaign ~ '^[a-z0-9-]{3,60}$'),
  listing_id uuid not null references public.listings(id) on delete cascade,
  title text not null check (length(title) between 2 and 120),
  value_cents integer not null check (value_cents between 100 and 10000),
  quantity integer not null default 1 check (quantity between 1 and 10),
  image_url text,
  draw_on date check (draw_on is null or draw_on between '2026-12-01' and '2026-12-11'),
  status text not null default 'pledged' check (status in ('pledged', 'live', 'withdrawn')),
  winner_member_id uuid references public.members(id) on delete set null,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.ve_giving_prizes enable row level security;
revoke all on public.ve_giving_prizes from anon, authenticated;

insert into public.ve_site_settings (key, value, updated_at)
values ('giving_2026', jsonb_build_object('campaign', '11-days-of-giving-2026', 'entries_open', false, 'starts_on', '2026-12-01', 'ends_on', '2026-12-11',
  'fulfill_by', '2027-01-10', 'prize_cap_cents', 500000, 'rules_reviewed', false), now())
on conflict (key) do nothing;
