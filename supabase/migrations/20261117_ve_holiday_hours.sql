-- Holiday hours (Sean, 2026-11-17: "that should be one of the questions that we ask for our members. If they haven't indicated holiday
-- hours, and they can just check staying the same, and then it'll close off... once they claim it, they'll get updates on things that
-- they should be doing or looking out for"). Depot > Ideas b00dc2ee.
-- One answer per listing and holiday: 'same' (regular hours) or 'special' with the hours in words. The owner answers on the business
-- dashboard (Home > Needs you, ve-holiday hours_mine / hours_save); it shows on the listing page at once. Public read: hours are public.
-- ve_holidays.asks_hours: which holidays ask (Hanukkah and Kwanzaa run for days and rarely change a business's hours). Safe to run twice.
create table if not exists ve_holiday_hours (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  holiday_slug text not null references ve_holidays(slug) on delete cascade,
  status text not null check (status in ('same', 'special')),
  hours text check (hours is null or char_length(hours) <= 300),
  set_by uuid,
  set_by_team boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, holiday_slug),
  check (status = 'same' or (hours is not null and char_length(btrim(hours)) > 0))
);
alter table ve_holiday_hours enable row level security;
drop policy if exists "Public read ve_holiday_hours" on ve_holiday_hours;
create policy "Public read ve_holiday_hours" on ve_holiday_hours for select using (true);

alter table ve_holidays add column if not exists asks_hours boolean not null default true;
update ve_holidays set asks_hours = false where slug in ('hanukkah', 'kwanzaa');

-- The first two, from their own Instagram posts (Ideas 111726), set by the team.
insert into ve_holiday_hours (listing_id, holiday_slug, status, hours, set_by, set_by_team)
select l.id, 'thanksliving', 'special', x.hours, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true
from (values
  ('sen-saigon', 'Thanksgiving Eve (Wed, Nov 25): closing early at 8:30 PM. Thanksgiving Day (Thu, Nov 26): closed. Back to regular hours Fri, Nov 27.'),
  ('vegan-international-co', 'Closed Wed, Nov 25 through Sat, Nov 28. Reopening Sun, Nov 29.')
) x(slug, hours)
join listings l on l.slug = x.slug and l.status = 'approved'
on conflict (listing_id, holiday_slug) do nothing;
