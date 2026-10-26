-- Events crawl, round 2 (Sean, 2026-10-26: "I want every event, possible vegan event, to be in this event directory... it
-- doesn't even matter if they're in regions where we are. I'm okay with them being anywhere").
-- The first pass searched "Vegan events <city>" and found nothing it could save: the results were past events or listings
-- with no date (notes on the six sources it read). Lists are where events gather, so the crawl now reads list pages
-- (directories, calendars, ticket-site searches) and opens each event's official page before saving it.

alter table public.ve_event_sources drop constraint if exists ve_event_sources_kind_check;
alter table public.ve_event_sources add constraint ve_event_sources_kind_check check (kind in ('website', 'instagram', 'calendar', 'search', 'list'));
alter table public.ve_event_sources add column if not exists every_days integer not null default 7 check (every_days between 1 and 60);

insert into public.ve_event_sources (name, kind, url, notes, every_days)
select v.name, 'list', v.url, v.notes, v.every_days
from (values
  ('American Vegan Society VegFest directory', 'https://www.americanvegan.org/vegfest/', 'Worldwide VegFest list. Each entry links to the festival; open it to confirm this year''s date.', 7),
  ('HappyCow events calendar', 'https://www.happycow.net/events', 'Worldwide Vegan events posted by organizers. Open each event''s own link.', 3),
  ('Eventbrite: Vegan, United States', 'https://www.eventbrite.com/d/united-states/vegan/', 'Many results only mention vegan food on a menu: keep only events that are Vegan or plant-based by their own description. The Eventbrite event page counts as the official page.', 3),
  ('Eventbrite: Plant-based, United States', 'https://www.eventbrite.com/d/united-states/plant-based/', 'Same rule as the Vegan search.', 3),
  ('Eventbrite: Vegan, United Kingdom', 'https://www.eventbrite.co.uk/d/united-kingdom/vegan/', 'Same rule as the US search.', 3),
  ('Eventbrite: Vegan, Canada', 'https://www.eventbrite.ca/d/canada/vegan/', 'Same rule as the US search.', 7),
  ('Eventbrite: Vegan, Australia', 'https://www.eventbrite.com.au/d/australia/vegan/', 'Same rule as the US search.', 7),
  ('Meetup: Vegan groups', 'https://www.meetup.com/topics/vegan/', 'Vegan meetup groups. Save their dated public events; the Meetup event page is the official page.', 7),
  ('vegconomist fairs and events', 'https://vegconomist.com/fairs-events/', 'Mixes consumer festivals and trade fairs. Save both; a trade fair is category general.', 14),
  ('Vegan Events UK', 'https://www.veganeventsuk.co.uk/', 'UK Vegan festivals by city. If this address does not open, search for Vegan Events UK and fix the link in Depot > Events > Crawl sources.', 14),
  ('VegfestUK', 'https://www.vegfest.co.uk/', 'UK VegfestUK festivals (Brighton, London, Bristol and more).', 14),
  ('Veggies Abroad festival list', 'https://veggiesabroad.com/vegan-festivals-events-expos/', 'A yearly roundup of Vegan festivals worldwide. Open each festival''s own site for this year''s date.', 14),
  ('SoFlo Vegans calendar', 'https://soflovegans.com/calendar/', 'South Florida Vegan and Vegan-friendly events.', 7)
) as v(name, url, notes, every_days)
where not exists (select 1 from public.ve_event_sources s where s.url = v.url);

-- A source comes back on its own cadence (every_days) instead of a fixed week.
create or replace function public.ve_event_sources_requeue()
 returns integer
 language sql
 security definer
 set search_path to 'public'
as $function$
  with q as (update ve_event_sources set check_status = 'queued'
    where active and check_status = 'done' and (last_checked_at is null or last_checked_at < now() - make_interval(days => every_days)) returning 1)
  select count(*)::integer from q;
$function$;
revoke all on function public.ve_event_sources_requeue() from public, anon, authenticated;

-- The writer's instructions: lists first, every event confirmed on its own page.
update public.lesaruss_dispatch_sources set batch = 3, instructions = $i$
Vegans Explore Events (vegansexplore.com/events), a calendar of every Vegan event in the world. Each source below is a place where Vegan events are announced: a list (a directory, a calendar, a ticket site's search), a website, an Instagram account, or a web search. Find every upcoming Vegan event there and save each one for the team to approve. Nothing you save goes live until a person approves it. Anywhere in the world counts.
1. Load up to BATCH sources, lists first:
   select id, name, kind, url, query, city_slug, notes from ve_event_sources
   where active and (check_status = 'queued' or (check_status = 'checking' and marked_at < now() - interval '45 minutes'))
   order by (kind = 'list') desc, last_checked_at nulls first, created_at limit BATCH;
2. For each: update ve_event_sources set check_status = 'checking', marked_at = now() where id = '<id>';
   Read the source (the url, or the query as a web search). Follow its own notes. A list can run to several pages: read up to the first 60 upcoming events.
   Keep an event only if it is Vegan or plant-based by its own description (a VegFest, a Vegan market, a Vegan dinner or potluck, a plant-based cooking class, a Vegan meetup, an animal-rights march or vigil, a sanctuary open day). A general food festival with a few Vegan vendors, or a restaurant night that only has a Vegan option, is not one.
   Open each kept event's official page (the organizer's site, its ticket page on Eventbrite, Dice, Ticketmaster, Meetup or the like, or its own Instagram post) and take the date, time, place and link from there, not from the list. If the official page does not give the date or the place, leave the event out. Never guess.
3. Save each one (dollar-quote the JSON as $j$...$j$):
   select ve_event_intake($j${"title": "...", "description": "two or three sentences in your own words", "starts_at": "2026-11-07T10:00:00-05:00", "ends_at": "...", "timezone": "America/New_York", "location_name": "the venue", "address": "...", "city": "Marietta", "state": "GA", "country": "US", "continent": "North America", "category": "festival", "event_type": "in_person", "ticket_url": "the official page or ticket link", "source_url": "the list page where you found it"}$j$::jsonb, 'crawl', '<source id>');
   starts_at and ends_at carry the event's own UTC offset. timezone is the IANA zone of its city. state is the two-letter code in the US, else the region or empty. country is the two-letter ISO code (GB for the United Kingdom). continent is North America, South America, Europe, Africa, Asia or Oceania. category is one of festival, food, social, market, meetup, workshop, health, activism, fundraiser, film, general, other. event_type is in_person, virtual or hybrid (virtual: the join link in ticket_url). A series (a weekly meetup) is saved as its next three dates, each its own event. Always capitalize Vegan; no em dashes or en dashes.
   It answers {ok, id} or {ok: false, why}: already_listed (on the calendar), already_over, no_official_link or no_date. Skip those and go on.
4. Mark the source read with how many new events it saved and a short note, including anything the team should fix (a dead link, a page that blocks reading):
   select ve_event_source_done('<id>', 12, 'Read 40 listings, saved 12 new; 20 already listed; the rest not Vegan events');
Do not change any other table.
$i$, notes = 'Events intake (Sean, 2026-10-26). Saves pending events through ve_event_intake; the team approves them in Depot > Events. Sources come back on their own cadence (every_days, cron ve-event-sources-requeue).'
where key = 'events_crawl';
