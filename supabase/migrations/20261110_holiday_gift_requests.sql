-- ve-holiday-guide: a featured brand's own intake for its Gift Guide card (Sean, 2026-11-10: "If they decide to switch it up, could we give
-- them that page that they land on? Can we create a intake for that so that way it just goes automatically to you?"). From /hello/gifts
-- (the brand landing page, copied from /hello?b=business) a registered account can ask to keep the card, feature a different item, or use
-- a different photo, and answer the giveaway soft ask. Each request waits for the team (the Gift Guide's team queue); approving applies it
-- to the card. RLS on, no policies: through ve-holiday only.
create table if not exists ve_holiday_gift_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id),
  gift_id uuid references ve_holiday_gifts(id) on delete set null,
  member_id uuid not null references members(id),
  change text not null check (change in ('keep', 'item', 'photo')),
  title text,
  link text check (link is null or link ~* '^https?://'),
  note text,
  image_url text,
  giveaway text check (giveaway is null or giveaway in ('yes', 'no')),
  giveaway_note text,
  team_note text,
  status text not null default 'pending' check (status in ('pending', 'applied', 'declined')),
  reviewed_by uuid references members(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ve_holiday_gift_requests_status on ve_holiday_gift_requests (status, created_at);
alter table ve_holiday_gift_requests enable row level security;
