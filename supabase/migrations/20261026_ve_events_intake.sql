-- Events intake (Sean, 2026-10-26): "populate it with a list of events for us to crawl the web... keep this constantly
-- populated with vegan events that are happening. Then I would also like members to be able to submit events for
-- consideration... we could just on the back end approve the events... We just require there to be a link to where you
-- can purchase tickets or find more information, the official pages... the ability to upload images or documents for you
-- to pull information for events, because sometimes all they have is a banner on Instagram."
--
-- Every new event arrives as status 'pending' (members through ve-events submit, the crawl through ve_event_intake, a flyer
-- through the Depot) and goes live only when a super admin approves it in Depot > Events.

-- 1. Where an event came from, its continent, and the flyer it was read from.
alter table public.events add column if not exists continent text;
alter table public.events add column if not exists source text not null default 'member';
alter table public.events add column if not exists source_url text;
alter table public.events add column if not exists flyer_path text;
alter table public.events add column if not exists source_id uuid;
do $$ begin
  alter table public.events add constraint events_source_check check (source in ('member', 'crawl', 'flyer', 'admin', 'import'));
exception when duplicate_object then null; end $$;
update public.events set source = 'import' where source = 'member' and created_at < '2026-10-26';
update public.events set continent = case
  when upper(country) in ('US','CA','MX','JM','BS','PR','CR','PA','DO','CU','TT','BB') then 'North America'
  when upper(country) in ('GB','UK','IE','FR','DE','ES','IT','NL','PT','BE','CH','AT','SE','NO','DK','FI','PL','CZ','GR') then 'Europe'
  when upper(country) in ('AU','NZ') then 'Oceania'
  when upper(country) in ('BR','AR','CO','CL','PE') then 'South America'
  when upper(country) in ('IN','JP','TH','SG','KR','CN','IL','AE','ID','PH','VN','MY') then 'Asia'
  when upper(country) in ('ZA','NG','KE','GH','EG','MA') then 'Africa' end
where continent is null and country is not null;
create index if not exists events_dedupe_idx on public.events (lower(title), ((starts_at at time zone 'UTC')::date));
create index if not exists events_status_starts_idx on public.events (status, starts_at);

-- 2. Places the crawl reads: a website, an Instagram, a calendar, or a search ("Vegan events in Atlanta").
create table if not exists public.ve_event_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default 'website' check (kind in ('website', 'instagram', 'calendar', 'search')),
  url text,
  query text,
  city_slug text,
  notes text,
  active boolean not null default true,
  check_status text not null default 'queued' check (check_status in ('queued', 'checking', 'done')),
  marked_at timestamptz,
  last_checked_at timestamptz,
  last_found integer,
  last_note text,
  added_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.ve_event_sources enable row level security;
alter table public.events drop constraint if exists events_source_id_fkey;
alter table public.events add constraint events_source_id_fkey foreign key (source_id) references public.ve_event_sources(id) on delete set null;

-- A first set of searches: every city we serve, then the world. Sean adds his own sources in Depot > Events > Sources.
insert into public.ve_event_sources (name, kind, query, city_slug)
select v.name, 'search', v.query, v.city
from (values
  ('South Florida Vegan events', 'Vegan events festivals meetups Miami Fort Lauderdale Palm Beach upcoming', 'south-florida'),
  ('Central Florida Vegan events', 'Vegan events festivals meetups Orlando Tampa St. Petersburg upcoming', 'central-florida'),
  ('Atlanta Vegan events', 'Vegan events festivals meetups Atlanta Georgia upcoming', 'atlanta'),
  ('DMV Vegan events', 'Vegan events festivals meetups Washington DC Maryland Virginia upcoming', 'dmv'),
  ('New York Vegan events', 'Vegan events festivals meetups New York City Brooklyn upcoming', 'new-york'),
  ('Philadelphia Vegan events', 'Vegan events festivals meetups Philadelphia upcoming', 'philadelphia'),
  ('Los Angeles Vegan events', 'Vegan events festivals meetups Los Angeles upcoming', 'los-angeles'),
  ('London Vegan events', 'Vegan events festivals markets meetups London upcoming', 'london'),
  ('Vegan festivals in the United States', 'Vegan festival VegFest United States upcoming dates', null),
  ('Vegan festivals around the world', 'Vegan festival VegFest Europe Asia Australia Canada upcoming dates', null)
) as v(name, query, city)
where not exists (select 1 from public.ve_event_sources s where s.kind = 'search' and s.query = v.query);

-- 3. One event in, from the crawl or the Depot. Never goes live on its own: status pending, unless approve is true
-- (a super admin saving it from the Depot). A title already on the calendar the same day is not added twice.
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
    reviewed_by, reviewed_at)
  values ('00000000-0000-4000-a000-000000000002', v_author, left(v_title, 200), left(nullif(btrim(p_event->>'description'), ''), 2000),
    case when p_event->>'event_type' in ('in_person','virtual','hybrid') then p_event->>'event_type' else 'in_person' end,
    v_starts, v_ends, coalesce(nullif(p_event->>'timezone', ''), 'America/New_York'),
    nullif(btrim(p_event->>'location_name'), ''), nullif(btrim(p_event->>'address'), ''),
    nullif(btrim(p_event->>'city'), ''), nullif(upper(btrim(p_event->>'state')), ''), nullif(upper(btrim(p_event->>'country')), ''),
    nullif(btrim(p_event->>'continent'), ''), nullif(btrim(p_event->>'virtual_url'), ''), v_cat, v_link,
    nullif(p_event->>'price_cents', '')::integer,
    case when p_approve then 'approved' else 'pending' end, p_source,
    coalesce(nullif(btrim(p_event->>'source_url'), ''), v_link), p_source_id, nullif(p_event->>'flyer_path', ''),
    case when p_approve then p_author end, case when p_approve then now() end)
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$function$;
revoke all on function public.ve_event_intake(jsonb, text, uuid, uuid, boolean) from public, anon, authenticated;

-- The crawl marks a source read, with how many new events it found.
create or replace function public.ve_event_source_done(p_source uuid, p_found integer, p_note text default null)
 returns void
 language sql
 security definer
 set search_path to 'public'
as $function$
  update ve_event_sources set check_status = 'done', last_checked_at = now(), last_found = coalesce(p_found, 0),
    last_note = nullif(p_note, ''), marked_at = null where id = p_source;
$function$;
revoke all on function public.ve_event_source_done(uuid, integer, text) from public, anon, authenticated;

-- Sources come back around every 7 days (cron below), so the calendar keeps filling.
create or replace function public.ve_event_sources_requeue()
 returns integer
 language sql
 security definer
 set search_path to 'public'
as $function$
  with q as (update ve_event_sources set check_status = 'queued'
    where active and check_status = 'done' and (last_checked_at is null or last_checked_at < now() - interval '7 days') returning 1)
  select count(*)::integer from q;
$function$;
revoke all on function public.ve_event_sources_requeue() from public, anon, authenticated;

do $$ begin
  perform cron.unschedule('ve-event-sources-requeue');
exception when others then null; end $$;
select cron.schedule('ve-event-sources-requeue', '15 5 * * *', 'select public.ve_event_sources_requeue()');

-- 4. Flyers (an Instagram banner, a PDF): private, read by ve-events and seen by the team through signed links.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-flyers', 'event-flyers', false, 15728640, array['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
on conflict (id) do nothing;

-- Each flyer read is logged, so a member's reads can be capped (five a day).
create table if not exists public.ve_event_flyer_reads (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  flyer_path text not null,
  result jsonb,
  created_at timestamptz not null default now()
);
alter table public.ve_event_flyer_reads enable row level security;

-- 5. The Background writer job.
insert into public.lesaruss_dispatch_sources (key, label, enabled, batch, sort, instructions, notes)
values ('events_crawl', 'Events: find upcoming Vegan events on the web', true, 3,
  coalesce((select max(sort) from public.lesaruss_dispatch_sources where key = 'listing_essentials'), 14) + 1,
$i$
Vegans Explore Events (vegansexplore.com/events). Each source below is a place where upcoming Vegan events are announced: a website, an Instagram account, a calendar, or a search for one of our cities or the world. Find the upcoming Vegan events there and save each one for the team to approve. Nothing you save goes live until a person approves it.
1. Load up to BATCH sources:
   select id, name, kind, url, query, city_slug, notes from ve_event_sources
   where active and (check_status = 'queued' or (check_status = 'checking' and marked_at < now() - interval '30 minutes'))
   order by last_checked_at nulls first, created_at limit BATCH;
2. For each: update ve_event_sources set check_status = 'checking', marked_at = now() where id = '<id>';
   Open the url, or run the query as a web search. Keep only events that are Vegan or plant-based by their own description (a VegFest, a Vegan market, a Vegan dinner, a plant-based meetup, an animal-rights march), that have not ended yet, and that have an official page: the organizer's own site, its ticket page (Eventbrite, Ticketmaster, Dice and the like) or its own Instagram post. Never a listing site that copies events from elsewhere, and never guess a date, a time or a place: if the official page does not say it, leave the event out.
3. Save each one (dollar-quote the JSON as $j$...$j$):
   select ve_event_intake($j${"title": "...", "description": "two or three sentences in your own words", "starts_at": "2026-11-07T10:00:00-05:00", "ends_at": "...", "timezone": "America/New_York", "location_name": "the venue", "address": "...", "city": "Marietta", "state": "GA", "country": "US", "continent": "North America", "category": "festival", "event_type": "in_person", "ticket_url": "the official page or ticket link", "source_url": "where you found it"}$j$::jsonb, 'crawl', '<source id>');
   starts_at and ends_at carry the event's own UTC offset. state is the two-letter code in the US, else the region or empty. country is the two-letter ISO code (GB for the United Kingdom). category is one of festival, food, social, market, meetup, workshop, health, activism, fundraiser, film, general, other. event_type is in_person, virtual or hybrid (virtual: put the join link in ticket_url). Always capitalize Vegan; no em dashes or en dashes.
   It answers {ok, id} or {ok: false, why}: already_listed (it is on the calendar), already_over, no_official_link or no_date. Skip those and go on.
4. Mark the source read with how many new events it saved and a short note:
   select ve_event_source_done('<id>', 3, 'Found 3 on their events page');
Do not change any other table.
$i$,
'Events intake (Sean, 2026-10-26). Saves pending events through ve_event_intake; the team approves them in Depot > Events. Sources come back every 7 days (cron ve-event-sources-requeue).')
on conflict (key) do nothing;

create or replace function public.lesaruss_dispatch_pending()
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'news_desk_write', (select count(*) from ve_news_leads where status = 'write' or (status = 'drafting' and marked_at < now() - interval '20 minutes')),
    'pulse_topic_write', (select count(*) from ve_board_posts where kind = 'topic' and status = 'draft' and (write_status = 'queued' or (write_status = 'writing' and write_marked_at < now() - interval '20 minutes'))),
    'content_moments_tag', (select count(*) from ve_content_transcripts where status = 'ready' and (tag_status = 'queued' or (tag_status = 'tagging' and tag_marked_at < now() - interval '30 minutes'))),
    'menu_import', (select count(*) from ve_menu_imports where status = 'queued' or (status = 'reading' and marked_at < now() - interval '30 minutes')),
    'listing_essentials', (select count(*) from ve_listing_essentials where write_status = 'queued' or (write_status = 'writing' and write_marked_at < now() - interval '30 minutes')),
    'events_crawl', (select count(*) from ve_event_sources where active and (check_status = 'queued' or (check_status = 'checking' and marked_at < now() - interval '30 minutes'))),
    'fieldy_topicizer', (select count(*) from fieldy_transcripts where received_at > coalesce((select last_processed_through from fieldy_topicizer_state where id = 1), '2026-04-15') and received_at < now() - interval '30 minutes'),
    'room_work_orders', (select count(*) from room_work_orders where status = 'queued'),
    'agent_tasks_logan', (select count(*) from agent_tasks where status = 'pending' and lower(to_agent) = 'logan'),
    'fieldy_v_requests', (select count(*) from fieldy_transcripts where is_command and coalesce(command_status, 'pending') not in ('completed', 'done', 'dismissed', 'failed')),
    'personal_ideas_raw', (select count(*) from personal_ideas where status = 'raw'),
    'brand_features_to_build', (select count(*) from brand_dashboard_features where planned and not live),
    'playbook_orders_due', (select count(*) from playbook_records where applied = false),
    'people_tasks', (select count(*) from people_profile_queue where status not in ('profiled', 'skipped'))
  );
$function$;
