-- ve-holiday-guide: members tell us about a holiday menu they found (Sean, 2026-11-08: "they can submit menus that they find in their
-- community, just in case we don't get to it, and we'll review it"; and the team adds menus for places we know, to engage them).
-- A tip is a place and a link to that place's own holiday menu or post. Nothing is copied: once our team checks it, the Holiday Guide
-- shows it under Spotted by members and links out. The team's own tips go live at once. RLS on, no policies: through ve-holiday only.
create table if not exists ve_holiday_menu_tips (
  id uuid primary key default gen_random_uuid(),
  holiday_slug text not null references ve_holidays(slug),
  member_id uuid not null references members(id),
  listing_id uuid references listings(id),
  place_name text not null check (length(place_name) between 2 and 120),
  city text,
  state text,
  link text not null check (link ~* '^https?://'),
  note text,
  status text not null default 'pending' check (status in ('pending', 'live', 'declined')),
  team_note text,
  by_team boolean not null default false,
  reviewed_by uuid references members(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_holiday_menu_tips_holiday on ve_holiday_menu_tips (holiday_slug, status);
create index if not exists ve_holiday_menu_tips_member on ve_holiday_menu_tips (member_id, created_at);
alter table ve_holiday_menu_tips enable row level security;
