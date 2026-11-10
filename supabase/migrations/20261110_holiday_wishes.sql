-- ve-holiday-guide: the Holiday Wish List (Sean, 2026-11-10: "a holiday wish list... share links to products that you wish you want people
-- to purchase for you. Or make suggestions for perfect gifts for vegans. And the whole goal of this section is to help family members get
-- ideas"; in the locked plan of 2026-11-07 as member wish lists feeding a Most Wanted shelf). Registered accounts add to it (quick
-- registration is enough). A wish shows on its owner's own list at once (shared by their referral code); it reaches the public shelves
-- (Gift Ideas from the community and Most Wanted) only after the team approves it. RLS on, no policies: through ve-holiday only.
create table if not exists ve_holiday_wishes (
  id uuid primary key default gen_random_uuid(),
  holiday_slug text not null default 'christmas' references ve_holidays(slug),
  member_id uuid not null references members(id),
  kind text not null default 'wish' check (kind in ('wish', 'gift')),
  title text not null check (length(title) between 2 and 120),
  link text check (link is null or link ~* '^https?://'),
  note text,
  status text not null default 'pending' check (status in ('pending', 'live', 'declined', 'removed')),
  team_note text,
  reviewed_by uuid references members(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_holiday_wishes_member on ve_holiday_wishes (member_id, holiday_slug, created_at);
create index if not exists ve_holiday_wishes_status on ve_holiday_wishes (holiday_slug, status);
alter table ve_holiday_wishes enable row level security;
