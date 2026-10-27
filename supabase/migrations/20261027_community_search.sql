-- The community search (Sean, 2026-10-27: "go"): Google Places text searches for farm animal sanctuaries, animal rescues and Vegan
-- nonprofits or animal rights organizations in each of our eight cities, run from the database (net.http_post, the key from
-- lesaruss_secrets). The responses were filtered (open only; no zoos, petting or city farms, wildlife parks, county animal services,
-- clinics, restaurants or unrelated charities; nothing already listed or waiting) and each one kept became a quarantined listing
-- (crawl_source community-search) with a backlog check on Ready to list, so it waits in Business outreach > New places for Sean to
-- Add under Rescues, Sanctuaries or Nonprofits, or set aside. Nothing went live. This file is the record: it reads the search
-- responses by request id, which net._http_response keeps only for a few hours, so it does nothing if run again later.
with m(rid, hub) as (select (regexp_split_to_array(x, '[=:]'))[1]::bigint, (regexp_split_to_array(x, '[=:]'))[2]
  from unnest(string_to_array('218445=south-florida:sanctuary 218446=south-florida:rescue 218447=south-florida:nonprofit 218448=central-florida:sanctuary 218449=central-florida:rescue 218450=central-florida:nonprofit 218451=atlanta:sanctuary 218452=atlanta:rescue 218453=atlanta:nonprofit 218454=dmv:sanctuary 218455=dmv:rescue 218456=dmv:nonprofit 218457=new-york:sanctuary 218458=new-york:rescue 218459=new-york:nonprofit 218460=philadelphia:sanctuary 218461=philadelphia:rescue 218462=philadelphia:nonprofit 218463=los-angeles:sanctuary 218464=los-angeles:rescue 218465=los-angeles:nonprofit 218466=london:sanctuary 218467=london:rescue 218468=london:nonprofit', ' ')) x),
p as (select m.rid, m.hub, e.p from m join net._http_response r on r.id = m.rid cross join jsonb_array_elements(coalesce((r.content::jsonb)->'places','[]'::jsonb)) e(p)),
f as (select distinct on (p->>'id') hub, p from p
  where coalesce(p->>'businessStatus','OPERATIONAL') = 'OPERATIONAL'
    and coalesce(p->'primaryTypeDisplayName'->>'text','') not in ('Zoo','Tourist Attraction','Park','Museum','Cultural Center','Event Venue','Vegan Restaurant','Indian Restaurant','Restaurant','Insurance Agency','Corporate Office','Church','Veterinary Care','Wildlife Park','Nature Preserve','Store','Services','Children''s camp')
    and (p->'displayName'->>'text') !~* '(zoo|petting|u-?pick|alpaca|safari|adventure|edventure|animal park|park and farm|city farm|urban farm|children''s farm|park farm|farmstead|fox chase farm|awbury|goat yoga|nature conservancy|audubon|hunger|food well|feeding ga|make a difference|volunteers for community|thrive dc|new york cares|women beyond|community action|helping hand|unstoppable|wissahickon|food rescue|livewell|eco foundation|we love philly|new sanctuary movement|animal services|clinic|world wildlife fund|greenpeace|peoples trust|conservation|wildlife alliance|wildlife sustainability|ideas for us|pet sustainability|pet advocacy|institute for humane studies|vegan blaze|bearded vegan|kfar saba|care farm|exotic|tamworth|animal action greece|vetpaw|national colonial|kinder farm|old maryland farm|cow cuddles|bell family|terra verde|wildflower farm|green meadows|amazing animals|river ranch|beautiful creatures|jungle adventures|animal reserve|tinez|redstone|madagascar|panther ridge|oatland|goat farm arts|creekwater|half moon|wild animal|untamed|chestatee|noah.s ark|yellow river|little creek|philly goat|rose bridge|sanctuary farm phila|tyler|ross mill|gress mountain|big purple barn|dragonfly acres|vegan friendly uk|jewish vegetarian|adoption service|labelle|sant. d.or|star eco|reptacular|animal tracks|wildlife learning|shambala|forever wild|moonwater|farm friendz|farralone|wildlife center|mudchute|hackney|spitalfields|vauxhall|stepney|kentish|surrey docks|freightliners|belmont|hounslow|crystal palace|lee valley|woodlands farm|maryon|animal assisted|big heart ranch|aware wildlife|wild nest|wildlife refuge|wildlife sanctuary|wellington|critter creek sanctuary ranch|elwyn)'
  order by p->>'id', hub),
n as (select f.hub, f.p, case when (p->'displayName'->>'text') ~* 'sanctuar|refuge|ranch|farm' then 'Sanctuaries'
    when (p->'displayName'->>'text') ~* 'rescue|humane|spca|shelter|paws|adoption|haven|league|pets|dog|cat|kitt|mutt|animal (aid|alliance|trust|home|refuge|project)|bideawee|battersea|mayhew|rspca|hand2paw|acct|bark' then 'Rescues' else 'Nonprofits' end cat,
    (select string_agg(c->>'longText', ' ') from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['street_number','route']) street,
    (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'locality' limit 1) locality,
    (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_town' limit 1) town,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'administrative_area_level_1' limit 1) st,
    (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_code' limit 1) zip,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'country' limit 1) country
  from f where not exists (select 1 from listings l where l.google_place_id = f.p->>'id' or (l.status in ('approved','pending','quarantined')
    and regexp_replace(lower(l.name),'[^a-z0-9]','','g') = regexp_replace(lower(f.p->'displayName'->>'text'),'[^a-z0-9]','','g')))),
-- One per name and city (a few have two Google places in the same city, and listings allow one name a city).
n1 as (select distinct on (lower(trim(left(p->'displayName'->>'text', 140))), lower(coalesce(locality, town, '')), lower(coalesce(case when country = 'GB' then null else st end, ''))) * from n
  order by lower(trim(left(p->'displayName'->>'text', 140))), lower(coalesce(locality, town, '')), lower(coalesce(case when country = 'GB' then null else st end, '')), (p->>'userRatingCount')::int desc nulls last),
ins as (insert into listings (name, category, specialty, description, status, website, phone, location, address_street, address_city, address_state, address_zip,
    initials, crawl_source, vegan_status, details)
  select left(p->'displayName'->>'text', 140), 'Uncategorized', '', '', 'quarantined', coalesce(p->>'websiteUri', ''), p->>'nationalPhoneNumber',
    concat_ws(', ', coalesce(locality, town), st), street, coalesce(locality, town), case when country = 'GB' then null else st end, zip,
    upper(left(regexp_replace(p->'displayName'->>'text', '[^A-Za-z]', '', 'g'), 2)), 'community-search', null,
    jsonb_build_object('community_search', jsonb_build_object('hub', hub, 'guess', cat, 'at', now(), 'google_type', p->'primaryTypeDisplayName'->>'text', 'place_id', p->>'id'))
  from n1 returning id, details)
insert into ve_backlog_checks (listing_id, track, stage, verdict, reason, community_slug, city_guess, place, checked_at)
select ins.id, 'google', 'done', 'list',
  'From the community search: looks like ' || case ins.details->'community_search'->>'guess' when 'Rescues' then 'a rescue' when 'Sanctuaries' then 'a sanctuary' else 'a nonprofit' end || ' (' || coalesce(n.p->'primaryTypeDisplayName'->>'text', 'Google') || '). Add it under Rescues, Sanctuaries or Nonprofits, or set it aside (Logan, 2026-10-27)',
  n.hub, coalesce(n.locality, n.town),
  jsonb_build_object('id', n.p->>'id', 'name', n.p->'displayName'->>'text', 'address', n.p->>'formattedAddress', 'street', n.street, 'city', coalesce(n.locality, n.town),
    'state', case when n.country = 'GB' then null else n.st end, 'zip', n.zip, 'country', n.country, 'lat', (n.p->'location'->>'latitude')::float, 'lng', (n.p->'location'->>'longitude')::float,
    'status', coalesce(n.p->>'businessStatus', 'OPERATIONAL'), 'rating', (n.p->>'rating')::float, 'reviews', (n.p->>'userRatingCount')::int, 'website', n.p->>'websiteUri',
    'phone', n.p->>'nationalPhoneNumber', 'type_name', n.p->'primaryTypeDisplayName'->>'text', 'types', n.p->'types'),
  now()
from ins join n1 n on n.p->>'id' = ins.details->'community_search'->>'place_id';

-- South Florida's nonprofit search also returned six national organizations elsewhere (Minneapolis, Portland, Colorado, Texas,
-- Oregon, France); their note says where they are, so Sean can list them as national or set them aside.
update ve_backlog_checks b set reason = b.reason || '. Not in South Florida: it is in ' || concat_ws(', ', l.address_city, coalesce(l.address_state, b.place->>'country')) || ', so it would be a national or out-of-area listing'
from listings l where l.id = b.listing_id and l.crawl_source = 'community-search' and l.details->'community_search'->>'hub' = 'south-florida'
  and coalesce(l.address_state, '') <> 'FL' and l.address_city is not null and b.reason not like '%Not in South Florida%';
