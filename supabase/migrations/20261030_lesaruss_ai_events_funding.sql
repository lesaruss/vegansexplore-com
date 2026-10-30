-- LESARUSS.ai Events and Funding on the events engine (Sean, locked 2026-10-29, canon canon-lesaruss-ai-front-door: "Events:
-- conferences, summits, traveling tours, pitch nights, workshops, crawled and approved. Funding (new tab on the events engine):
-- grants, loans, accelerators, pitch competitions with amount, deadline, eligibility and the official Apply link, closing soon
-- first"). One engine: the same events table, ve_event_intake, the Background writer's events_crawl and Depot > Events.
--   events.tenant_id      LESARUSS (00000000-0000-4000-a000-000000000001) for LESARUSS.ai's, Vegans Explore (...0002) for ours;
--                         every Vegans Explore reader filters to its own tenant.
--   events.listing_kind   'event' or 'funding'. A funding row's starts_at is its deadline (time_set false when only a day is
--                         given), so Upcoming is still open and Soonest is closing soon; ticket_url is the official Apply page;
--                         category is its kind (grant, loan, accelerator, competition, fellowship); events.funding holds
--                         {offered_by, amount, amount_usd, eligibility, rolling}.
--   ve_event_sources.tenant_id and .listing_kind say whose calendar a source feeds and what it lists.
-- Every step is safe to run twice.

-- 1. The columns.
alter table events add column if not exists listing_kind text not null default 'event';
alter table events drop constraint if exists events_listing_kind_check;
alter table events add constraint events_listing_kind_check check (listing_kind in ('event', 'funding'));
alter table events add column if not exists funding jsonb;
alter table events drop constraint if exists events_category_check;
alter table events add constraint events_category_check check (category = any (array['general', 'food', 'activism', 'health', 'social',
  'market', 'festival', 'workshop', 'meetup', 'fundraiser', 'film', 'other', 'conference', 'summit', 'pitch', 'tour', 'networking',
  'webinar', 'grant', 'loan', 'accelerator', 'competition', 'fellowship']));
create index if not exists events_tenant_kind_starts on events (tenant_id, listing_kind, status, starts_at);

alter table ve_event_sources add column if not exists tenant_id uuid not null default '00000000-0000-4000-a000-000000000002';
alter table ve_event_sources add column if not exists listing_kind text not null default 'event';
alter table ve_event_sources drop constraint if exists ve_event_sources_listing_kind_check;
alter table ve_event_sources add constraint ve_event_sources_listing_kind_check check (listing_kind in ('event', 'funding', 'both'));

-- 2. The intake: whose it is (the event's "tenant": "lesaruss", else its source's tenant, else Vegans Explore), and funding.
create or replace function public.ve_event_intake(p_event jsonb, p_source text default 'crawl'::text, p_source_id uuid default null::uuid, p_author uuid default null::uuid, p_approve boolean default false)
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
  v_host uuid;
  v_past boolean := coalesce((p_event->>'past')::boolean, false);
  v_dupe uuid;
  v_id uuid;
  v_tenant uuid := '00000000-0000-4000-a000-000000000002';
  v_kind text := case when p_event->>'listing_kind' = 'funding' or p_event->>'kind' = 'funding' then 'funding' else 'event' end;
  v_funding jsonb := null;
begin
  if p_event->>'tenant' = 'lesaruss' then v_tenant := '00000000-0000-4000-a000-000000000001';
  elsif p_source_id is not null then select coalesce(tenant_id, v_tenant) into v_tenant from ve_event_sources where id = p_source_id;
  end if;
  v_tenant := coalesce(v_tenant, '00000000-0000-4000-a000-000000000002');
  if v_title is null then return jsonb_build_object('ok', false, 'why', 'no_title'); end if;
  if v_link is null or v_link !~* '^https?://' then return jsonb_build_object('ok', false, 'why', 'no_official_link'); end if;
  -- A funding opportunity's date is its deadline.
  begin v_starts := coalesce(nullif(p_event->>'deadline', ''), p_event->>'starts_at')::timestamptz; exception when others then v_starts := null; end;
  if v_starts is null then return jsonb_build_object('ok', false, 'why', case when v_kind = 'funding' then 'no_deadline' else 'no_date' end); end if;
  begin v_ends := nullif(p_event->>'ends_at', '')::timestamptz; exception when others then v_ends := null; end;
  if v_kind = 'funding' then
    v_ends := null;
    if v_cat not in ('grant', 'loan', 'accelerator', 'competition', 'fellowship') then v_cat := 'grant'; end if;
    v_funding := jsonb_strip_nulls(jsonb_build_object(
      'offered_by', nullif(left(btrim(coalesce(p_event->'funding'->>'offered_by', p_event->>'offered_by')), 120), ''),
      'amount', nullif(left(btrim(coalesce(p_event->'funding'->>'amount', p_event->>'amount')), 80), ''),
      'amount_usd', case when coalesce(p_event->'funding'->>'amount_usd', p_event->>'amount_usd') ~ '^[0-9]+$'
        then (coalesce(p_event->'funding'->>'amount_usd', p_event->>'amount_usd'))::bigint end,
      'eligibility', nullif(left(btrim(coalesce(p_event->'funding'->>'eligibility', p_event->>'eligibility')), 500), ''),
      'rolling', case when coalesce(p_event->'funding'->>'rolling', p_event->>'rolling') = 'true' then true end));
  elsif v_cat not in ('general','food','activism','health','social','market','festival','workshop','meetup','fundraiser','film','other',
                      'conference','summit','pitch','tour','networking','webinar') then v_cat := 'other';
  end if;
  begin v_host := nullif(p_event->>'host_listing_id', '')::uuid; exception when others then v_host := null; end;
  if v_host is not null and not exists (select 1 from listings where id = v_host) then v_host := null; end if;
  if v_host is null and p_source_id is not null then select listing_id into v_host from ve_event_sources where id = p_source_id; end if;
  if coalesce(v_ends, v_starts) < now() - interval '1 day'
     and not (v_past and v_host is not null and v_starts >= timestamptz '2020-01-01') then
    return jsonb_build_object('ok', false, 'why', case when v_kind = 'funding' then 'closed' else 'already_over' end);
  end if;
  select id into v_dupe from events where tenant_id = v_tenant and lower(title) = lower(v_title)
    and (starts_at at time zone 'UTC')::date = (v_starts at time zone 'UTC')::date and status <> 'rejected' limit 1;
  if v_dupe is null and v_kind = 'funding' then
    select id into v_dupe from events where tenant_id = v_tenant and listing_kind = 'funding' and status <> 'rejected'
      and (lower(title) = lower(v_title) or ticket_url = v_link) and starts_at >= now() - interval '1 day' limit 1;
  end if;
  if v_dupe is not null then
    if v_host is not null then update events set host_listing_id = v_host where id = v_dupe and host_listing_id is null; end if;
    return jsonb_build_object('ok', false, 'why', 'already_listed', 'id', v_dupe);
  end if;
  if v_author is null then
    select (value::jsonb->>'member_id')::uuid into v_author from lesaruss_dispatch_settings where key = 'pulse_auto';
  end if;
  insert into events (tenant_id, author_id, title, description, event_type, starts_at, ends_at, timezone, location_name, address,
    city, state, country, continent, virtual_url, category, ticket_url, price_cents, status, source, source_url, source_id, flyer_path,
    reviewed_by, reviewed_at, time_set, host_listing_id, listing_kind, funding)
  values (v_tenant, v_author, left(v_title, 200), coalesce(left(nullif(btrim(p_event->>'description'), ''), 2000), ''),
    case when v_kind = 'funding' then 'virtual' when p_event->>'event_type' in ('in_person','virtual','hybrid') then p_event->>'event_type' else 'in_person' end,
    v_starts, v_ends, coalesce(nullif(p_event->>'timezone', ''), 'America/New_York'),
    nullif(btrim(p_event->>'location_name'), ''), nullif(btrim(p_event->>'address'), ''),
    nullif(btrim(p_event->>'city'), ''), nullif(case when length(btrim(p_event->>'state')) <= 3 then upper(btrim(p_event->>'state')) else btrim(p_event->>'state') end, ''), nullif(upper(btrim(p_event->>'country')), ''),
    nullif(btrim(p_event->>'continent'), ''), nullif(btrim(p_event->>'virtual_url'), ''), v_cat, v_link,
    nullif(p_event->>'price_cents', '')::integer,
    case when p_approve then 'approved' else 'pending' end, p_source,
    coalesce(nullif(btrim(p_event->>'source_url'), ''), v_link), p_source_id, nullif(p_event->>'flyer_path', ''),
    case when p_approve then p_author end, case when p_approve then now() end,
    case when v_kind = 'funding' then coalesce((p_event->>'time_set')::boolean, false) else coalesce((p_event->>'time_set')::boolean, true) end,
    v_host, v_kind, v_funding)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$function$;

-- 3. The writer: Vegans Explore sources stay as they are; a LESARUSS.ai source is read for business events or funding.
update lesaruss_dispatch_sources
set instructions = replace(instructions,
      'select id, name, kind, url, query, city_slug, notes from ve_event_sources',
      'select id, name, kind, url, query, city_slug, notes, tenant_id, listing_kind from ve_event_sources')
    || $w$

LESARUSS.ai sources (Sean, 2026-10-29, canon canon-lesaruss-ai-front-door). A source whose tenant_id is 00000000-0000-4000-a000-000000000001 feeds lesaruss.ai/events, for business owners and creators, not Vegans Explore. For those, the Vegan rule above does not apply. Instead:
   listing_kind 'event' (or 'both'): business events: conferences, summits, pitch nights, workshops, networking, traveling tours and webinars about AI, marketing, leadership, creators, funding and running a business. Leave out sales webinars for one product, recruiting fairs and anything with no official page. category is one of conference, summit, pitch, workshop, networking, tour, webinar, meetup, other. Save with "tenant": "lesaruss" in the JSON.
   listing_kind 'funding' (or 'both'): money a small business, founder or creator can apply for: grants, loans, accelerators (with or without investment), pitch competitions with prizes, fellowships. Open its official page and take, only from there: the deadline (deadline, with its time and offset if given, else the day at 23:59 in the program's time zone and "time_set": false), what it offers (amount, as the page words it, for example "$10,000 grant" or "Up to $500,000 for 7%"; amount_usd, the top cash amount as a whole number, only when the page states one), who it is for (eligibility, one or two sentences: who can apply, where, stage), who offers it (offered_by), and the official apply page (ticket_url). A program that takes applications all year with no deadline: "rolling": true and deadline 60 days from today (it is read again before then). Leave out anything with no official apply page, anything that charges to apply, loans that are not from a government or a known lender, and anything already closed. category is grant, loan, accelerator, competition or fellowship. Save with "tenant": "lesaruss", "listing_kind": "funding" and the funding fields at the top level:
   select ve_event_intake($j${"tenant": "lesaruss", "listing_kind": "funding", "title": "...", "description": "two or three sentences in your own words", "deadline": "2026-12-01T23:59:00-05:00", "time_set": false, "timezone": "America/New_York", "category": "grant", "offered_by": "...", "amount": "$10,000 grant", "amount_usd": "10000", "eligibility": "...", "country": "US", "ticket_url": "the official apply page", "source_url": "where you found it"}$j$::jsonb, 'crawl', '<source id>');
   It answers why 'closed' for one whose deadline has passed and 'no_deadline' when there is none. Never invent an amount, a deadline or who can apply. No financial or legal advice in the description.

Vegans Explore and LESARUSS.ai never mix: save a Vegans Explore source's events without "tenant", and a LESARUSS.ai source's with "tenant": "lesaruss".$w$,
    updated_at = now()
where key = 'events_crawl' and instructions not like '%LESARUSS.ai sources (Sean, 2026-10-29%';

-- The Pulse writer's events are Vegans Explore's for a city; a LESARUSS.ai topic may use LESARUSS.ai's.
update lesaruss_dispatch_sources
set instructions = replace(instructions,
      'select title, starts_at, location_name, city, ticket_url from events where status = ''approved''',
      'select title, starts_at, location_name, city, ticket_url from events where tenant_id = ''00000000-0000-4000-a000-000000000002'' and status = ''approved''')
    || $w$
   For a LESARUSS.ai topic, approved LESARUSS.ai events and open funding may be used as events or the action: select title, listing_kind, category, starts_at, funding, ticket_url from events where tenant_id = '00000000-0000-4000-a000-000000000001' and status = 'approved' and starts_at between now() and now() + interval '30 days' order by starts_at; (a funding row's starts_at is its deadline; say "applications close <date>").$w$,
    updated_at = now()
where key = 'pulse_topic_write' and instructions not like '%approved LESARUSS.ai events and open funding%';

-- 4. The first LESARUSS.ai sources, read on the writer's next pass.
insert into ve_event_sources (name, kind, url, query, notes, active, check_status, every_days, tenant_id, listing_kind)
select n, k, u, q, nt, true, 'queued', d, '00000000-0000-4000-a000-000000000001', lk
from (values
  ('Hello Alice grants', 'list', 'https://helloalice.com/grants/', null, 'Small business grants Hello Alice lists, each with its own apply page.', 7, 'funding'),
  ('IFundWomen grants', 'list', 'https://ifundwomen.com/grants', null, 'Grants for women-owned businesses.', 7, 'funding'),
  ('Amber Grant', 'website', 'https://ambergrantsforwomen.com/', null, 'Monthly grant for women-owned businesses; take this month''s deadline.', 14, 'funding'),
  ('SBA funding programs', 'website', 'https://www.sba.gov/funding-programs', null, 'Government loans and grant programs; keep only ones with an apply page and a deadline or rolling intake.', 14, 'funding'),
  ('Y Combinator', 'website', 'https://www.ycombinator.com/apply', null, 'Accelerator: the current batch''s application deadline.', 14, 'funding'),
  ('Techstars accelerators', 'list', 'https://www.techstars.com/accelerators', null, 'Each accelerator program with open applications and its deadline.', 7, 'funding'),
  ('Google for Startups programs', 'list', 'https://startup.google.com/programs/', null, 'Accelerators and funds with open applications.', 14, 'funding'),
  ('Small business grants, open now (search)', 'search', null, 'small business grant applications open deadline 2026', 'Grants with an official apply page and a deadline.', 7, 'funding'),
  ('Pitch competitions (search)', 'search', null, 'pitch competition 2026 apply prize startups small business deadline', 'Pitch competitions with prizes and an apply page.', 7, 'funding'),
  ('Creator grants and funds (search)', 'search', null, 'creator fund grant 2026 apply content creators deadline', 'Funds and grants for creators.', 7, 'funding'),
  ('Business conferences (search)', 'search', null, 'small business conference 2026 2027 United States', 'Conferences and summits for business owners.', 7, 'event'),
  ('AI conferences (search)', 'search', null, 'AI conference for business 2026 2027', 'AI conferences and summits for business, not academic.', 7, 'event'),
  ('Marketing conferences (search)', 'search', null, 'marketing conference 2026 2027', 'Marketing and social media conferences.', 7, 'event'),
  ('Creator economy events (search)', 'search', null, 'creator economy conference 2026 2027', 'Creator conferences and summits (VidCon, Creator Economy Expo and the like).', 7, 'event'),
  ('Pitch nights and startup events (search)', 'search', null, 'startup pitch night 2026 Miami OR Atlanta OR New York OR Philadelphia OR "Los Angeles"', 'Pitch nights and founder events in our cities.', 7, 'event'),
  ('Eventbrite business events online', 'list', 'https://www.eventbrite.com/d/online/business--events/', null, 'Online business workshops and webinars; leave out single-product sales webinars.', 7, 'event')
) v(n, k, u, q, nt, d, lk)
where not exists (select 1 from ve_event_sources s where s.name = v.n and s.tenant_id = '00000000-0000-4000-a000-000000000001');
