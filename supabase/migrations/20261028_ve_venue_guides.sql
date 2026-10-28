-- The Stadium & Arena Guide (LOCKED by Sean 2026-10-28, playbook ve-venue-guides, canon canon-ve-venue-guides; built the
-- same day on his "go"). A venue mapped to the Vegan food inside it, kept accurate by members for points:
--   ve_venues        a stadium, arena (or, later, an airport), with its teams and the circle a member must stand in
--   ve_venue_spots   a stand or vendor inside it, with where it is (sections, level, gate, terminal)
--   ve_venue_items   what it sells that is Vegan, with its sources and when a member last confirmed it
--   ve_venue_reports a member's photo report from inside the venue: Still accurate / Something is wrong / Missing / Gone
-- Points are paid only when the team accepts a report in Depot > Venues: the first accepted correction 100, a later one that
-- agrees with it 25 (they are told who was first), Still accurate 10, at most 5 paid a day. Items age out 35 days after their
-- last confirmation, and a new season (season_reset_at) puts every item back to Needs a fresh check.
-- Server only: RLS on and no policies; everything goes through the edge function ve-venues.

-- step: tables
create table if not exists public.ve_venues (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind text not null check (kind in ('stadium', 'arena', 'airport')),
  city text, state text, country text not null default 'US',
  hub text,                                   -- the chapter (VE_HUBS slug)
  teams text[] not null default '{}',
  address text, google_place_id text,
  latitude numeric, longitude numeric,
  radius_m integer not null default 400,      -- a report counts inside this circle (plus up to 100 m of the phone's own uncertainty)
  note text, note_source_url text,            -- e.g. the outside-food rule
  free_example boolean not null default false,
  season_reset_at timestamptz,
  sort_order integer not null default 0,
  status text not null default 'live' check (status in ('live', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ve_venue_spots (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.ve_venues(id) on delete cascade,
  name text not null,
  where_text text,                            -- "Sections 122A, 150A, 322A"
  zone text not null default 'concourse' check (zone in ('concourse', 'club', 'suites', 'outside')),
  listing_id uuid references public.listings(id) on delete set null,
  note text,
  sort_order integer not null default 0,
  status text not null default 'live' check (status in ('live', 'gone')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ve_venue_items (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.ve_venues(id) on delete cascade,
  spot_id uuid not null references public.ve_venue_spots(id) on delete cascade,
  name text not null,
  description text,
  vegan text not null default 'vegan' check (vegan in ('vegan', 'on_request', 'ask')),
  sources jsonb not null default '[]',        -- [{label, url, date}]
  last_confirmed_at timestamptz,
  confirmed_count integer not null default 0,
  photo_url text, photo_illustrative boolean not null default false,
  sort_order integer not null default 0,
  status text not null default 'live' check (status in ('live', 'gone')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ve_venue_reports (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  venue_id uuid not null references public.ve_venues(id) on delete cascade,
  spot_id uuid references public.ve_venue_spots(id) on delete set null,
  item_id uuid references public.ve_venue_items(id) on delete set null,
  kind text not null check (kind in ('confirm', 'wrong', 'missing', 'gone')),
  note text,
  photo_path text not null,
  lat numeric, lng numeric, accuracy_m integer, distance_m integer,
  local_day date not null default ((now() at time zone 'America/New_York')::date),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'agreed', 'declined')),
  points integer not null default 0,
  first_report_id uuid references public.ve_venue_reports(id) on delete set null,
  review_note text, reviewed_by uuid, reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists ve_venue_spots_venue on public.ve_venue_spots (venue_id, sort_order);
create index if not exists ve_venue_items_spot on public.ve_venue_items (spot_id, sort_order);
create index if not exists ve_venue_reports_status on public.ve_venue_reports (status, created_at);
create index if not exists ve_venue_reports_member on public.ve_venue_reports (member_id, created_at desc);
alter table public.ve_venues enable row level security;
alter table public.ve_venue_spots enable row level security;
alter table public.ve_venue_items enable row level security;
alter table public.ve_venue_reports enable row level security;

-- The Guide's saves (My list): a venue or one item.
alter table public.ve_guide_saves drop constraint if exists ve_guide_saves_kind_check;
alter table public.ve_guide_saves add constraint ve_guide_saves_kind_check
  check (kind in ('swap', 'recipe', 'listing', 'episode', 'fix', 'promo', 'venue', 'venue_item'));

-- Member photos: private, read only through signed links in the Depot.
insert into storage.buckets (id, name, public) values ('venue-reports', 'venue-reports', false) on conflict (id) do nothing;

-- The Guide: $11 or 1,100 points, like every Guide. Unpublished until Sean approves River's lines.
insert into public.ve_guides (title, slug, description, cost_lesars, published, access_rule, sort_order)
select 'The Stadium & Arena Guide', 'stadium-arena-guide',
  'Where the Vegan food is at the stadiums and arenas in our cities: every stand, where it is and what it sells, checked by members on game day and concert night. With River as your Guide.',
  1100, false, 'points', 3
where not exists (select 1 from public.ve_guides where slug = 'stadium-arena-guide');

-- step: functions
-- A member's report from inside the venue. The photo is already uploaded (photo_path); this checks the circle and saves it.
create or replace function public.ve_venue_report_save(p_member uuid, p_venue uuid, p_spot uuid, p_item uuid, p_kind text,
  p_note text, p_photo text, p_lat numeric, p_lng numeric, p_accuracy numeric)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v ve_venues%rowtype; d numeric; acc numeric := greatest(coalesce(p_accuracy, 0), 0);
  today date := (now() at time zone 'America/New_York')::date; n int; rid uuid;
begin
  select * into v from ve_venues where id = p_venue and status = 'live';
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_kind not in ('confirm', 'wrong', 'missing', 'gone') then return jsonb_build_object('ok', false, 'why', 'bad_kind'); end if;
  if p_kind in ('confirm', 'wrong', 'gone') and p_item is null then return jsonb_build_object('ok', false, 'why', 'item_required'); end if;
  if p_item is not null and not exists (select 1 from ve_venue_items where id = p_item and venue_id = v.id) then
    return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if p_kind = 'missing' and length(coalesce(trim(p_note), '')) < 3 then return jsonb_build_object('ok', false, 'why', 'note_required'); end if;
  if v.latitude is null or v.longitude is null then return jsonb_build_object('ok', false, 'why', 'no_location'); end if;
  if p_lat is null or p_lng is null or abs(p_lat) > 90 or abs(p_lng) > 180 then return jsonb_build_object('ok', false, 'why', 'no_position'); end if;
  if acc > 500 then return jsonb_build_object('ok', false, 'why', 'not_precise', 'accuracy_m', round(acc)); end if;
  d := 2 * 6371000 * asin(sqrt(power(sin(radians(p_lat - v.latitude) / 2), 2)
       + cos(radians(v.latitude)) * cos(radians(p_lat)) * power(sin(radians(p_lng - v.longitude) / 2), 2)));
  if d > v.radius_m + least(acc, 100) then return jsonb_build_object('ok', false, 'why', 'too_far', 'distance_m', round(d)); end if;
  select count(*) into n from ve_venue_reports where member_id = p_member and local_day = today;
  if n >= 20 then return jsonb_build_object('ok', false, 'why', 'daily_limit'); end if;
  if p_item is not null and exists (select 1 from ve_venue_reports where member_id = p_member and item_id = p_item
      and kind = p_kind and local_day = today) then
    return jsonb_build_object('ok', false, 'why', 'already_today'); end if;
  insert into ve_venue_reports (member_id, venue_id, spot_id, item_id, kind, note, photo_path, lat, lng, accuracy_m, distance_m, local_day)
  values (p_member, v.id, coalesce(p_spot, (select spot_id from ve_venue_items where id = p_item)), p_item, p_kind,
          nullif(left(trim(coalesce(p_note, '')), 600), ''), p_photo, round(p_lat, 5), round(p_lng, 5), round(acc), round(d), today)
  returning id into rid;
  return jsonb_build_object('ok', true, 'id', rid, 'distance_m', round(d));
end $$;
revoke all on function public.ve_venue_report_save(uuid, uuid, uuid, uuid, text, text, text, numeric, numeric, numeric) from public, anon, authenticated;

-- The team's decision on a report. accept: Still accurate pays 10 and confirms the item; any other kind pays 100 as the first
-- accepted. agree: a later report that says the same as an accepted one pays 25 and names it (first_report_id). decline: 0.
-- At most 5 paid reports a member a day (by the day it was sent); past that they are accepted at 0. Paid once (ve_points_grant).
create or replace function public.ve_venue_report_review(p_report uuid, p_decision text, p_reviewer uuid, p_note text, p_first uuid)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare r ve_venue_reports%rowtype; pts int := 0; paid int; g jsonb;
begin
  select * into r from ve_venue_reports where id = p_report for update;
  if not found then return jsonb_build_object('ok', false, 'why', 'not_found'); end if;
  if r.status <> 'pending' then return jsonb_build_object('ok', false, 'why', 'already_reviewed', 'status', r.status); end if;
  if p_decision not in ('accept', 'agree', 'decline') then return jsonb_build_object('ok', false, 'why', 'bad_decision'); end if;
  if p_decision = 'agree' and (p_first is null or not exists (select 1 from ve_venue_reports where id = p_first and status = 'accepted' and id <> r.id)) then
    return jsonb_build_object('ok', false, 'why', 'first_required'); end if;
  if p_decision <> 'decline' then
    select count(*) into paid from ve_venue_reports where member_id = r.member_id and local_day = r.local_day and points > 0;
    if paid < 5 then pts := case when p_decision = 'agree' then 25 when r.kind = 'confirm' then 10 else 100 end; end if;
  end if;
  update ve_venue_reports set status = case p_decision when 'accept' then 'accepted' when 'agree' then 'agreed' else 'declined' end,
    points = pts, first_report_id = case when p_decision = 'agree' then p_first end,
    review_note = nullif(left(trim(coalesce(p_note, '')), 600), ''), reviewed_by = p_reviewer, reviewed_at = now()
  where id = r.id;
  if p_decision = 'accept' and r.kind = 'confirm' and r.item_id is not null then
    update ve_venue_items set last_confirmed_at = greatest(coalesce(last_confirmed_at, r.created_at), r.created_at),
      confirmed_count = confirmed_count + 1, updated_at = now() where id = r.item_id;
  end if;
  if pts > 0 then g := ve_points_grant(r.member_id, pts, 'venue_report', 'venue_report:' || r.id); end if;
  return jsonb_build_object('ok', true, 'points', pts, 'grant', g);
end $$;
revoke all on function public.ve_venue_report_review(uuid, text, uuid, text, uuid) from public, anon, authenticated;

-- step: seed
-- South Florida first, Hard Rock Stadium the free example (the Plant-Based Showcase). Seeded only from what published sources
-- say, each item with its sources and no confirmation yet: members confirm them from inside. Coordinates come from Google
-- Places through ve-venues locate, never typed in.
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order)
values
 ('hard-rock-stadium', 'Hard Rock Stadium', 'stadium', 'Miami Gardens', 'FL', 'south-florida', array['Miami Dolphins', 'Miami Hurricanes'], 450,
  'Outside food is not allowed, except food in a clear bag for guests with medical or dietary needs.',
  'https://veggl.com/stadium-arena-cheat-sheets/vegan-at-hard-rock-stadium-miami-dolphins/', true, 1),
 ('kaseya-center', 'Kaseya Center', 'arena', 'Miami', 'FL', 'south-florida', array['Miami Heat'], 250, null, null, false, 2),
 ('loandepot-park', 'loanDepot park', 'stadium', 'Miami', 'FL', 'south-florida', array['Miami Marlins'], 350, null, null, false, 3),
 ('amerant-bank-arena', 'Amerant Bank Arena', 'arena', 'Sunrise', 'FL', 'south-florida', array['Florida Panthers'], 250,
  'Outside food and drink is not allowed.', 'https://veggl.com/stadium-arena-cheat-sheets/fla-live-arena-vegan-options-florida-panthers/', false, 4)
on conflict (slug) do nothing;

with v as (select id, slug from public.ve_venues),
s(venue, name, where_text, zone, listing_slug, sort) as (values
  ('hard-rock-stadium', 'Wynwood Walkthrough', 'Sections 122A, 150A, 322A, 327A and 347A', 'concourse', null, 1),
  ('hard-rock-stadium', 'Shawarma Shack', '200 level', 'concourse', null, 2),
  ('hard-rock-stadium', 'Phuc Yea', 'Upper deck', 'concourse', 'phuc-yea-miami', 3),
  ('hard-rock-stadium', 'Suite catering', 'Suites only', 'suites', null, 4),
  ('kaseya-center', 'Full Bloom', 'Section 105', 'concourse', null, 1),
  ('kaseya-center', 'Oakberry Acai', 'Section 105', 'concourse', null, 2),
  ('kaseya-center', 'Phuc Yea', 'Section 117', 'concourse', 'phuc-yea-miami', 3),
  ('loandepot-park', 'Taco Bowl stands', 'Sections 19 and 205', 'concourse', null, 1),
  ('loandepot-park', 'Section 40 stand', 'Section 40', 'concourse', null, 2))
insert into public.ve_venue_spots (venue_id, name, where_text, zone, listing_id, sort_order)
select v.id, s.name, s.where_text, s.zone,
  (select l.id from public.listings l where l.slug = s.listing_slug and l.status = 'approved' limit 1), s.sort
from s join v on v.slug = s.venue
where not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = s.name);

with src(k, j) as (values
  ('upfront', '{"label": "Upfront venue guide", "url": "https://upfront.tickets/venue-guides/hard-rock-stadium-tips/", "date": "2026-10"}'::jsonb),
  ('leftovers', '{"label": "The Leftovers Miami", "url": "https://theleftoversmiami.com/p/best-food-at-miami-dolphins-game-hard-rock-stadium", "date": "2026-10"}'::jsonb),
  ('suites', '{"label": "Hard Rock Stadium suite catering menu", "url": "https://www.suiteexperiencegroup.com/resources/Hard_Rock_Stadium/Hard_Rock_Stadium_Primary_catering_menu_2025-09-02.pdf", "date": "2025-09"}'::jsonb),
  ('axios', '{"label": "Axios Miami", "url": "https://www.axios.com/local/miami/2024/10/04/heat-kaseya-center-new-food-menu", "date": "2024-10"}'::jsonb),
  ('veggl-kaseya', '{"label": "Veggl", "url": "https://veggl.com/?p=11132"}'::jsonb),
  ('veggl-marlins', '{"label": "Veggl", "url": "https://veggl.com/?p=5683", "date": "2024"}'::jsonb)),
i(venue, spot, name, descr, vegan, srcs, sort) as (values
  ('hard-rock-stadium', 'Wynwood Walkthrough', 'Veggie burger', 'Served on a King''s Hawaiian bun. Ask what the patty and the bun are made with before you order.', 'ask', array['upfront', 'leftovers'], 1),
  ('hard-rock-stadium', 'Shawarma Shack', 'Items the stadium tags Vegan', 'The stadium''s own concessions page tags this stand Vegan. Ask which items when you order.', 'vegan', array['upfront'], 1),
  ('hard-rock-stadium', 'Phuc Yea', 'Vegan slaw', 'A side. The stand''s main dish is fried chicken.', 'vegan', array['leftovers'], 1),
  ('hard-rock-stadium', 'Suite catering', 'Plant-based tenders', 'With Vegan ranch and BBQ sauce. On the suite catering menu, not at the stands.', 'vegan', array['suites'], 1),
  ('hard-rock-stadium', 'Suite catering', 'Falafel platter', 'On the suite catering menu, not at the stands. Ask about the sauces.', 'ask', array['suites'], 2),
  ('kaseya-center', 'Full Bloom', 'BBQ jackfruit', null, 'vegan', array['axios', 'veggl-kaseya'], 1),
  ('kaseya-center', 'Full Bloom', 'Carrot dog', null, 'vegan', array['veggl-kaseya'], 2),
  ('kaseya-center', 'Full Bloom', 'Oyster mushrooms', null, 'vegan', array['veggl-kaseya'], 3),
  ('kaseya-center', 'Full Bloom', 'Smoked "fish" dip', null, 'vegan', array['veggl-kaseya'], 4),
  ('kaseya-center', 'Oakberry Acai', 'Acai bowls', 'Build your own. Ask about each topping.', 'ask', array['veggl-kaseya'], 1),
  ('kaseya-center', 'Phuc Yea', 'Ube latte boba tea', 'Listed as Vegan.', 'vegan', array['veggl-kaseya'], 1),
  ('loandepot-park', 'Taco Bowl stands', 'Taco bowl', 'Noted as Vegan by the ballpark in 2024. Check it is still on the menu.', 'vegan', array['veggl-marlins'], 1),
  ('loandepot-park', 'Section 40 stand', 'Impossible bulgogi bowl', 'Noted as Vegan by the ballpark in 2024. Check it is still on the menu.', 'vegan', array['veggl-marlins'], 1))
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select v.id, sp.id, i.name, i.descr, i.vegan,
  (select coalesce(jsonb_agg(src.j order by array_position(i.srcs, src.k)), '[]') from src where src.k = any(i.srcs)), i.sort
from i join public.ve_venues v on v.slug = i.venue join public.ve_venue_spots sp on sp.venue_id = v.id and sp.name = i.spot
where not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = i.name);
