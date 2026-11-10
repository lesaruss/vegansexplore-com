-- ve-holiday-guide: the Gift Guide (Sean, 2026-11-10: "I want to start populating some of these gift ideas into here"): gifts our team picks,
-- each with its brand's Directory listing, where to buy it (the brand's page, and Amazon when it is sold there), our own short note (never
-- the source's words) and the source credited (VegNews's gift guides, and others). Registered accounts plus a gift (Sean: "not rate it,
-- but like save it or plus it... they gotta be registered"); the pluses live only in the Holiday Guide. RLS on, no policies: through
-- ve-holiday only.
create table if not exists ve_holiday_gifts (
  id uuid primary key default gen_random_uuid(),
  holiday_slug text not null default 'christmas' references ve_holidays(slug),
  section text not null,
  title text not null,
  brand text,
  listing_id uuid references listings(id),
  link text check (link is null or link ~* '^https?://'),
  amazon_link text check (amazon_link is null or amazon_link ~* '^https?://'),
  price text,
  image_url text,
  note text,
  source_name text,
  source_url text,
  sort int not null default 100,
  status text not null default 'live' check (status in ('live', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_holiday_gifts_live on ve_holiday_gifts (holiday_slug, status, sort);
alter table ve_holiday_gifts enable row level security;

create table if not exists ve_holiday_gift_plus (
  gift_id uuid not null references ve_holiday_gifts(id) on delete cascade,
  member_id uuid not null references members(id),
  created_at timestamptz not null default now(),
  primary key (gift_id, member_id)
);
alter table ve_holiday_gift_plus enable row level security;
