-- A research bounty (Sean, 2026-10-29: "let's experiment with getting the rest of these items as one bounty that a person can
-- complete for like 150 points... they can collect this and research and grab this information"). The gate and seating maps the
-- venue Guides still need, as one bundle job in the existing Bounties system (every part needed to earn the points, reviewed in
-- Depot > Bounties). One person, 14 days. Listed in South Florida, where the Bounties page lists by city.
insert into ve_bounty_campaigns (slug, community_slug, kind, title, story, cover_url, due_at, status, proposed_by, decided_by, decided_at)
select 'map-the-venues', 'south-florida', 'ongoing', 'Map the airports and stadiums',
  'Our Airport Guide and Stadium & Arena Guide show members the closest Vegan food from their gate or seat. A few airports and stadiums are still missing their maps. Find the official maps, send them in, and the Guides get better for every traveler and fan.',
  '/public/guides/airports/lax.webp', '2026-11-12 04:59:00+00', 'open',
  'aa000000-0000-4000-a000-000000000010', 'aa000000-0000-4000-a000-000000000010', now()
where not exists (select 1 from ve_bounty_campaigns where slug = 'map-the-venues');

insert into ve_bounties (community_slug, campaign_id, kind, title, brief, deliverable, points, slots, max_awards, due_at, status, sort, parts)
select 'south-florida', c.id, 'other', 'Find the official gate and seating maps',
  'Online research, from anywhere. For each place below, find the map on its own official website or app (the airport''s site, the team''s or venue''s site), dated 2024 or later, that shows every gate number (airports) or every section number (stadiums). Send a screenshot or PDF of each, plus the link to the page you found it on. Not from a ticket resale site or a map blog, and nothing guessed: if a place has no official map, say so in your note with the pages you checked. We check every map against the official site before paying.',
  'Official maps (screenshot or PDF) with the link to each, for all seven places', 150, 1, 1, '2026-11-12 04:59:00+00', 'open', 0,
  array[
    'Newark Liberty (EWR): the Terminal B gate map',
    'LAX: the gate maps for Terminals 1 to 8 and the Tom Bradley International Terminal',
    'JFK: the Terminal 5 gate map, with its new gate numbers (501 and up)',
    'LaGuardia: the Terminal C gate map',
    'London Heathrow: the gate maps for Terminals 2, 3, 4 and 5',
    'Yankee Stadium: the seating chart with every section number',
    'UBS Arena: the seating chart with every section number (the Islanders layout)'
  ]
from ve_bounty_campaigns c
where c.slug = 'map-the-venues' and not exists (select 1 from ve_bounties b where b.campaign_id = c.id);
