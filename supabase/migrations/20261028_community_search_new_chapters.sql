-- The community search for the newer chapters (Sean, 2026-10-28: "run the community search for the newer chapters"), the same way
-- as 20261027_community_search.sql: 24 Google Places text searches for farm animal sanctuaries, animal rescues and Vegan or animal
-- rights nonprofits in North Florida, Washington, D.C., Maryland, Virginia, Delaware and West Virginia (the 2026-10-27 search had
-- only the old DMV, around D.C.), request ids 224680 to 224703. Each place goes to the chapter of its own state; anything outside
-- the six states was left out. Filtered as before (open only; no zoos, petting or working farms, wildlife rehab, county or city animal
-- services and control, clinics, pet stores, boarding, breeders, thrift stores, conservation groups or charities for people) and
-- nothing already listed or waiting. 146 quarantined listings (crawl_source community-search, details.community_search with the hub
-- and a guess of Rescues, Sanctuaries or Nonprofits), each a backlog check on Ready to list in Business outreach > New places:
-- North Florida 45, Virginia 34, Maryland 27, West Virginia 21, Delaware 14, Washington, D.C. 5. Nothing went live. This file is the
-- record: net._http_response keeps the search responses only for a few hours, so it does nothing if run again later.
with m(rid, srch) as (select (regexp_split_to_array(x, '[=:]'))[1]::bigint, (regexp_split_to_array(x, '[=:]'))[2]
  from unnest(string_to_array('224680=north-florida:s 224681=north-florida:r 224682=north-florida:r 224683=north-florida:r 224684=north-florida:r 224685=north-florida:n 224686=washington-dc:s 224687=washington-dc:r 224688=washington-dc:n 224689=maryland:s 224690=maryland:r 224691=maryland:r 224692=maryland:n 224693=virginia:s 224694=virginia:r 224695=virginia:r 224696=virginia:r 224697=virginia:n 224698=delaware:s 224699=delaware:r 224700=delaware:n 224701=west-virginia:s 224702=west-virginia:r 224703=west-virginia:n', ' ')) x),
p0 as (select distinct on (e.p->>'id') e.p from m join net._http_response r on r.id = m.rid cross join jsonb_array_elements(coalesce((r.content::jsonb)->'places','[]'::jsonb)) e(p) order by e.p->>'id', m.rid),
p as (select p, p->'displayName'->>'text' nm, coalesce(p->'primaryTypeDisplayName'->>'text','') ty,
    (select string_agg(c->>'longText', ' ') from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['street_number','route']) street,
    (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'locality' limit 1) locality,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'administrative_area_level_1' limit 1) st,
    (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_code' limit 1) zip,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'country' limit 1) country
  from p0 where coalesce(p->>'businessStatus','OPERATIONAL') = 'OPERATIONAL'),
f as (select p.*, case st when 'FL' then 'north-florida' when 'DC' then 'washington-dc' when 'MD' then 'maryland' when 'VA' then 'virginia' when 'DE' then 'delaware' when 'WV' then 'west-virginia' end hub
  from p where st in ('FL','DC','MD','VA','DE','WV') and country = 'US'
    and ty not in ('Zoo','Tourist Attraction','Park','Museum','Cultural Center','Event Venue','Restaurant','Veterinary Care','Wildlife Park','Wildlife Refuge','Nature Preserve','Store','Pet Store','Thrift Store','Cemetery','Government Office','Wholesaler','Pet Boarding Service','Food Store')
    and (ty in ('Pet Care','Farm','Farmstay') or nm ~* 'animal|pet|paw|dog|cat|kitt|feline|rescue|humane|spca|sanctuar|refuge|ranch|vegan|\mveg|hound|mutt|pup|equine|pig|poodle|ferret|greyhound|pitbull|primate|creature|critter|tail|fur|hoove|kidden|meow|roar|rights')
    and nm !~* '(zoo|petting|animal services|animal control|county animal|police animal|city of |care & control|care and control|animal care and adoption|animal care & adoption|county humane society thrift|clinic|spay|wildlife|nature conservancy|conservation|wild virginia|estuary|nonprofit advancement|paws for people|rescue mission|rescue ministr|hunger|lawyers|pet advocacy|american humane|national colonial|old maryland farm|big purple barn|cow cuddles|green meadows|kinder farm|dragonfly acres|creatures great|coverdale|james farm|story hill|maymont|pactamere|heritage farm|wild goats|dairy|wild kid acres|grace haven|furry friends farm|redemptive love farm|french bulldog|cane corso|monkey rehome|hotel for dogs|joe and kloe|luv.n arms|cat cafe|everypet|earth pets|exterminator|infinity acres|aquarium|memorial park|wvu office|adoption authority|florida adoptions|angels for allison|be the solution|lifee|healing hearts|r&r loving|whole h\.e\.a\.r\.t|sacred friends|^acca$|we can be heroes|fetch a cure|petland|petsmart|catty shack|wild animal|odessa|rose bridge|little farm|barnyard besties|3 palms|four acres|providence animal|southeastern pa|protective services|tri-state bird|behavior and training|pets on wheels)'),
n as (select f.*, case when nm ~* 'faithful friends|purringpals|meow or never|house with a heart|luna.s house|hart for animals|tails of hope|rude ranch|rottweiler rescue ranch|puppy hill|cj acres' then 'Rescues'
    when nm ~* 'sanctuar|refuge|ranch|farm' then 'Sanctuaries'
    when nm ~* 'rescue|humane|spca|shelter|paws|adoption|haven|league|pets|dog|cat|kitt|mutt|pup|hound|feline|ferret|poodle|greyhound|pitbull|barcs|animal (aid|alliance|trust|home|refuge|project|friends|welfare|outreach)' then 'Rescues' else 'Nonprofits' end cat
  from f where not exists (select 1 from listings l where l.google_place_id = f.p->>'id' or (l.status in ('approved','pending','quarantined')
    and regexp_replace(lower(l.name),'[^a-z0-9]','','g') = regexp_replace(lower(f.nm),'[^a-z0-9]','','g')))),
n1 as (select distinct on (lower(trim(left(nm,140))), lower(coalesce(locality,'')), st) * from n
  order by lower(trim(left(nm,140))), lower(coalesce(locality,'')), st, (p->>'userRatingCount')::int desc nulls last),
ins as (insert into listings (name, category, specialty, description, status, website, phone, location, address_street, address_city, address_state, address_zip,
    initials, crawl_source, vegan_status, details)
  select left(nm, 140), 'Uncategorized', '', '', 'quarantined', coalesce(p->>'websiteUri', ''), p->>'nationalPhoneNumber',
    concat_ws(', ', locality, st), street, locality, st, zip,
    upper(left(regexp_replace(nm, '[^A-Za-z]', '', 'g'), 2)), 'community-search', null,
    jsonb_build_object('community_search', jsonb_build_object('hub', hub, 'guess', cat, 'at', now(), 'google_type', p->'primaryTypeDisplayName'->>'text', 'place_id', p->>'id'))
  from n1 returning id, details),
bc as (insert into ve_backlog_checks (listing_id, track, stage, verdict, reason, community_slug, city_guess, place, checked_at)
select ins.id, 'google', 'done', 'list',
  'From the community search: looks like ' || case n.cat when 'Rescues' then 'a rescue' when 'Sanctuaries' then 'a sanctuary' else 'a nonprofit' end || ' (' || coalesce(nullif(n.ty,''), 'Google') || '). Add it under Rescues, Sanctuaries or Nonprofits, or set it aside (Logan, 2026-10-28)',
  n.hub, n.locality,
  jsonb_build_object('id', n.p->>'id', 'name', n.nm, 'address', n.p->>'formattedAddress', 'street', n.street, 'city', n.locality,
    'state', n.st, 'zip', n.zip, 'country', n.country, 'lat', (n.p->'location'->>'latitude')::float, 'lng', (n.p->'location'->>'longitude')::float,
    'status', coalesce(n.p->>'businessStatus', 'OPERATIONAL'), 'rating', (n.p->>'rating')::float, 'reviews', (n.p->>'userRatingCount')::int, 'website', n.p->>'websiteUri',
    'phone', n.p->>'nationalPhoneNumber', 'type_name', n.ty, 'types', n.p->'types'),
  now()
from ins join n1 n on n.p->>'id' = ins.details->'community_search'->>'place_id' returning community_slug)
select community_slug, count(*) from bc group by 1 order by 1;