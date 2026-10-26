-- Sean's events list (2026-10-26: "Not filtered for older events, but good to reference for their future dates"), his
-- sources for the crawl, and a way to list an event whose time is not announced yet.

-- events.description is required (not null): an event saved without one gets an empty description, which the tiles skip.
-- A US state is a code (FL); elsewhere it is a region name (England) and keeps its case.
-- 1. Time not announced: the tile shows the date only. starts_at holds noon local on that day, so the date is right in
-- every time zone; the crawl or the team sets the real time once it is published.
alter table public.events add column if not exists time_set boolean not null default true;

create or replace function public.ve_event_intake(p_event jsonb, p_source text default 'crawl', p_source_id uuid default null, p_author uuid default null, p_approve boolean default false)
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_title text := nullif(btrim(p_event->>'title'), '');
  v_link text := nullif(btrim(coalesce(p_event->>'ticket_url', p_event->>'link')), '');
  v_starts timestamptz;
  v_ends timestamptz;
  v_cat text := lower(coalesce(nullif(p_event->>'category', ''), 'other'));
  v_author uuid := p_author;
  v_dupe uuid;
  v_id uuid;
begin
  if v_title is null then return jsonb_build_object('ok', false, 'why', 'no_title'); end if;
  if v_link is null or v_link !~* '^https?://' then return jsonb_build_object('ok', false, 'why', 'no_official_link'); end if;
  begin v_starts := (p_event->>'starts_at')::timestamptz; exception when others then v_starts := null; end;
  if v_starts is null then return jsonb_build_object('ok', false, 'why', 'no_date'); end if;
  begin v_ends := nullif(p_event->>'ends_at', '')::timestamptz; exception when others then v_ends := null; end;
  if coalesce(v_ends, v_starts) < now() - interval '1 day' then return jsonb_build_object('ok', false, 'why', 'already_over'); end if;
  if v_cat not in ('general','food','activism','health','social','market','festival','workshop','meetup','fundraiser','film','other') then v_cat := 'other'; end if;
  select id into v_dupe from events where lower(title) = lower(v_title) and (starts_at at time zone 'UTC')::date = (v_starts at time zone 'UTC')::date and status <> 'rejected' limit 1;
  if v_dupe is not null then return jsonb_build_object('ok', false, 'why', 'already_listed', 'id', v_dupe); end if;
  if v_author is null then
    select (value::jsonb->>'member_id')::uuid into v_author from lesaruss_dispatch_settings where key = 'pulse_auto';
  end if;
  insert into events (tenant_id, author_id, title, description, event_type, starts_at, ends_at, timezone, location_name, address,
    city, state, country, continent, virtual_url, category, ticket_url, price_cents, status, source, source_url, source_id, flyer_path,
    reviewed_by, reviewed_at, time_set)
  values ('00000000-0000-4000-a000-000000000002', v_author, left(v_title, 200), coalesce(left(nullif(btrim(p_event->>'description'), ''), 2000), ''),
    case when p_event->>'event_type' in ('in_person','virtual','hybrid') then p_event->>'event_type' else 'in_person' end,
    v_starts, v_ends, coalesce(nullif(p_event->>'timezone', ''), 'America/New_York'),
    nullif(btrim(p_event->>'location_name'), ''), nullif(btrim(p_event->>'address'), ''),
    nullif(btrim(p_event->>'city'), ''), nullif(case when length(btrim(p_event->>'state')) <= 3 then upper(btrim(p_event->>'state')) else btrim(p_event->>'state') end, ''), nullif(upper(btrim(p_event->>'country')), ''),
    nullif(btrim(p_event->>'continent'), ''), nullif(btrim(p_event->>'virtual_url'), ''), v_cat, v_link,
    nullif(p_event->>'price_cents', '')::integer,
    case when p_approve then 'approved' else 'pending' end, p_source,
    coalesce(nullif(btrim(p_event->>'source_url'), ''), v_link), p_source_id, nullif(p_event->>'flyer_path', ''),
    case when p_approve then p_author end, case when p_approve then now() end,
    coalesce((p_event->>'time_set')::boolean, true))
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$function$;
revoke all on function public.ve_event_intake(jsonb, text, uuid, uuid, boolean) from public, anon, authenticated;

-- 2. Sean's sources.
insert into public.ve_event_sources (name, kind, url, notes, every_days)
select v.name, 'list', v.url, v.notes, v.every_days
from (values
  ('Connect For Animals events', 'https://connectforanimals.com/events', 'Animal-rights and Vegan events across the US and beyond. Open each event''s own page.', 3),
  ('VeganFests', 'https://veganfests.com/', 'A directory of Vegan festivals. Open each festival''s own site for this year''s date.', 7),
  ('Vegetarians of Central Florida (Meetup)', 'https://www.meetup.com/vegetarianscf/events/', 'VegCF''s monthly meetups, potlucks and lunches in Central Florida. The Meetup event page is the official page.', 3),
  ('VegFest Expos', 'https://vegfestexpos.com/', 'VegFest Expos runs festivals in several US cities (Syracuse and others).', 14)
) as v(name, url, notes, every_days)
where not exists (select 1 from public.ve_event_sources s where s.url = v.url);
-- Sean's Vegan Events UK pages are /cus-events/<festival>: the list source is right; tell the reader where they live.
update public.ve_event_sources set notes = 'UK Vegan festivals by city, each at /cus-events/<festival> (the festival''s own page). Times are on each page.'
where url = 'https://www.veganeventsuk.co.uk/';

-- 3. Sean's upcoming events. Live at once (Sean sent them, with their official pages), time not announced unless he gave
-- one. The two Holistic Holiday at Sea cruises wait in Depot > Events: their port is not on his list.
do $$
declare
  r record;
  v jsonb;
  sean uuid := '72712a4a-ea0e-4ef4-a29e-d382496ef8da';
begin
  for r in select * from (values
    -- title, local day, start, end, time set, city, state, country, continent, time zone, category, link, live
    ('San Francisco VegFest', '2026-11-14', '11:00', '17:00', true, 'San Francisco', 'CA', 'US', 'North America', 'America/Los_Angeles', 'festival', 'https://www.sfvs.org/festival', true),
    ('Holistic Holiday at Sea', '2027-03-07', '12:00', null, false, null, 'FL', 'US', 'North America', 'America/New_York', 'health', 'https://holisticholidayatsea.com/', false),
    ('Holistic Holiday at Sea: Alaska', '2027-08-02', '12:00', null, false, null, 'WA', 'US', 'North America', 'America/Los_Angeles', 'health', 'https://holisticholidayatsea.com/ak27/', false),
    ('Newcastle Vegan Festival', '2026-10-31', '12:00', null, false, 'Newcastle upon Tyne', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/newcastle-vegan-festival', true),
    ('Hampshire Vegan Festival (Portsmouth)', '2026-11-08', '12:00', null, false, 'Portsmouth', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/portsmouth-vegan-festival', true),
    ('Birmingham Vegan Festival', '2026-11-14', '12:00', null, false, 'Birmingham', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/birmingham-vegan-festival', true),
    ('Northern Vegan Christmas Festival (Manchester)', '2026-11-28', '12:00', null, false, 'Manchester', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/northern-vegan-christmas-festival', true),
    ('York Vegan Christmas Festival', '2026-12-13', '12:00', null, false, 'York', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/york-vegan-christmas-festival', true),
    ('Essex Vegan Festival (Colchester)', '2027-02-27', '12:00', null, false, 'Colchester', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/essex-vegan-festival-colchester', true),
    ('Dorset Vegan Festival (Bournemouth)', '2027-03-13', '12:00', null, false, 'Bournemouth', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/bournemouth-vegan-festival', true),
    ('Leicestershire Vegan Festival', '2027-03-20', '12:00', null, false, 'Leicester', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/leicester-vegan-festival', true),
    ('Northern Vegan Festival', '2027-03-27', '12:00', null, false, 'Manchester', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/northern-vegan-festival-manchester', true),
    ('London Vegan Festival (Walthamstow)', '2027-04-04', '12:00', null, false, 'London', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/london-vegan-festival-walthemstow', true),
    ('Sheffield Vegan Festival', '2027-04-10', '12:00', null, false, 'Sheffield', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/sheffield-vegan-festival', true),
    ('Scotland Vegan Festival (Paisley)', '2027-04-17', '12:00', null, false, 'Paisley', 'Scotland', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/scotland-vegan-festival', true),
    ('Maidstone Vegan Festival', '2027-04-25', '12:00', null, false, 'Maidstone', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/maidstone-vegan-festival', true),
    ('Essex Vegan Festival (Southend-on-Sea)', '2027-05-01', '12:00', null, false, 'Southend-on-Sea', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/essex-vegan-festival-southend', true),
    ('Merseyside Vegan Festival (Liverpool)', '2027-05-08', '12:00', null, false, 'Liverpool', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/merseyside-vegan-festival', true),
    ('Edinburgh Vegan Festival', '2027-05-15', '12:00', null, false, 'Edinburgh', 'Scotland', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/edinburgh-vegan-festival', true),
    ('Leeds Vegan Festival', '2027-06-05', '12:00', null, false, 'Leeds', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/leeds-vegan-festival', true),
    ('Stockport Vegan Festival', '2027-06-13', '12:00', null, false, 'Stockport', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/stockport-vegan-festival', true),
    ('Dartford Vegan Festival', '2027-06-20', '12:00', null, false, 'Dartford', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/dartford-vegan-festival', true),
    ('Nottinghamshire Vegan Festival (Nottingham)', '2027-07-04', '12:00', null, false, 'Nottingham', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/nottinghamshire-vegan-festival', true),
    ('Glasgow Vegan Summer Festival', '2027-07-10', '12:00', null, false, 'Glasgow', 'Scotland', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/glasgow-vegan-summer-festival', true),
    ('Milton Keynes Vegan Festival', '2027-08-29', '12:00', null, false, 'Milton Keynes', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/milton-keynes-vegan-festival', true),
    ('Derbyshire Vegan Festival (Derby)', '2027-09-11', '12:00', null, false, 'Derby', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/derbyshire-vegan-festival', true),
    ('London Vegan Festival (Kingston)', '2027-09-18', '12:00', null, false, 'London', 'England', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/london-vegan-festival-kingston', true),
    ('South Wales Vegan Festival (Cardiff)', '2027-10-02', '12:00', null, false, 'Cardiff', 'Wales', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/south-wales-vegan-festival', true),
    ('Dundee Vegan Festival', '2027-10-17', '12:00', null, false, 'Dundee', 'Scotland', 'GB', 'Europe', 'Europe/London', 'festival', 'https://www.veganeventsuk.co.uk/cus-events/dundee-vegan-festival', true)
  ) as t(title, d, t0, t1, tset, city, state, country, continent, tz, cat, link, live)
  loop
    v := jsonb_build_object(
      'title', r.title, 'category', r.cat, 'ticket_url', r.link, 'timezone', r.tz, 'time_set', r.tset,
      'starts_at', to_jsonb(((r.d || ' ' || r.t0)::timestamp at time zone r.tz)) #>> '{}',
      'ends_at', case when r.t1 is null then '' else to_jsonb(((r.d || ' ' || r.t1)::timestamp at time zone r.tz)) #>> '{}' end,
      'city', r.city, 'state', r.state, 'country', r.country, 'continent', r.continent, 'event_type', 'in_person');
    perform public.ve_event_intake(v, 'admin', null, sean, r.live);
  end loop;
end $$;
