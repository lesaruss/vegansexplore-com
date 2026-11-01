-- Events with no city (Sean, 2026-11-01: "fill in the cities for those events"). 232 approved Vegans Explore events had no city,
-- so no city hub showed them; 227 were group events from the Meetup and Instagram history imported 2026-10-29. Nothing guessed:
--   * Meetup (219): each event page's own schema.org data, read through pg_net: eventAttendanceMode (Online / Offline) and
--     location.address (addressLocality, addressRegion, addressCountry, the place Meetup publishes even when it hides the venue;
--     its GraphQL returns no venue to anonymous callers). 93 in person got their city (Atlanta 75, New York 13, London 3,
--     Washington 1, Los Angeles 1; London's region code "17" stored as England, continent Europe); 126 are online.
--   * Vegan Social Club (South Florida, Instagram): five held at a Directory listing took that listing's city (The Plantisserie,
--     Vegan Cuban Cuisine and Aguacate Garden of Love in Miami, Zen Mystery in Dania Beach, La Chia Vegana in Lake Worth Beach).
--   * Holistic Holiday at Sea: Alaska 2027, "Departing from Seattle" on its own page.
--   Left empty: 129 online events (no city is right; they show in their host group's chapters, VECityBanner.matches), and four
--   with no published place (a beach picnic, a 4th of July BBQ, a lunch at Stephanie's Vegan Bakery, which is not in the
--   Directory, and the March 2027 cruise, whose page lists three ports).
-- Every change is a row here with what it replaced (before), so it can be undone.
create table if not exists public.ve_event_place_fill (
  event_id uuid primary key references public.events(id) on delete cascade,
  url text not null,
  req_id bigint,
  mode text,
  city text, state text, country text,
  before jsonb,
  applied_at timestamptz,
  note text
);
alter table public.ve_event_place_fill enable row level security;
-- Undo: update events e set city = f.before->>'city', state = f.before->>'state', country = f.before->>'country',
--   continent = f.before->>'continent' from ve_event_place_fill f where f.event_id = e.id and f.applied_at is not null;
