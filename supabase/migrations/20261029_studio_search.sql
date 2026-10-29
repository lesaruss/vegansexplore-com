-- The studio search (Sean, 2026-10-29, playbook ve-business-hub-ad-console: "studio directory... production studios, podcast
-- studios... claim your listing for $11", prompted by Trisha). Twelve Google Places text searches across South Florida for
-- podcast, video production, photo and content studios, run from the database (net.http_post, the key from lesaruss_secrets),
-- request ids 233609 to 233620, 151 places. Kept: Florida, open, a studio by its name, not a coworking space, salon, gym,
-- agency or store, nothing already listed or waiting. 129 quarantined listings (crawl_source studio-search,
-- details.studio_search with the hub south-florida, the guess Studios and its kind), each a backlog check on Ready to list in
-- Business outreach > New places with the note "Add it under Services > Studios": 91 video and production studios, 25 podcast
-- studios, 13 photo studios. Nothing went live. This file is the record: net._http_response keeps the responses only for a few
-- hours, so it does nothing if run again later. The insert ran as below.
with p0 as (select distinct on (e.p->>'id') e.p from net._http_response r cross join jsonb_array_elements(coalesce((r.content::jsonb)->'places','[]'::jsonb)) e(p)
  where r.id between 233609 and 233620 order by e.p->>'id'),
p as (select p, p->'displayName'->>'text' nm, coalesce(p->'primaryTypeDisplayName'->>'text','') ty,
    (select string_agg(c->>'longText', ' ') from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['street_number','route']) street,
    (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'locality' limit 1) locality,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'administrative_area_level_1' limit 1) st,
    (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_code' limit 1) zip
  from p0 where coalesce(p->>'businessStatus','OPERATIONAL') = 'OPERATIONAL'),
f as (select p.*, case when nm ~* 'podcast|\mpod|radio|cast studio|chat room' then 'a podcast studio'
    when nm ~* 'photo|lensology|visuals|yxphotos|strobe|eniary|éniary' then 'a photo studio' else 'a video and production studio' end guess
  from p where st = 'FL' and ty not in ('Coworking Space','Electronics Store','Manufacturer','Point of interest')
    and nm ~* 'studio|podcast|production|film|video|photo|media|lensology|visuals|yxphotos|radio|content|klip|playback|reel|creative'
    and nm !~* 'cowork|new you|nuovo|luxe galore|soultuary|the move|nucleus|cuz\.|mass inbound|hub 954|creative currency|stars international|content gym'
    and not exists (select 1 from listings l where l.google_place_id = p.p->>'id' or (l.status in ('approved','pending','quarantined')
      and regexp_replace(lower(l.name),'[^a-z0-9]','','g') = regexp_replace(lower(p.nm),'[^a-z0-9]','','g')))),
n1 as (select distinct on (lower(trim(left(nm,140))), lower(coalesce(locality,''))) * from f
  order by lower(trim(left(nm,140))), lower(coalesce(locality,'')), (p->>'userRatingCount')::int desc nulls last),
ins as (insert into listings (name, category, specialty, description, status, website, phone, location, address_street, address_city, address_state,
    address_zip, initials, crawl_source, vegan_status, details)
  select left(nm,140), 'Uncategorized', '', '', 'quarantined', coalesce(p->>'websiteUri',''), p->>'nationalPhoneNumber', concat_ws(', ', locality, st), street,
    locality, st, zip, upper(left(regexp_replace(nm, '[^A-Za-z]', '', 'g'), 2)), 'studio-search', null,
    jsonb_build_object('studio_search', jsonb_build_object('hub','south-florida','guess','Studios','kind',guess,'at',now(),
      'google_type',p->'primaryTypeDisplayName'->>'text','place_id',p->>'id'))
  from n1 returning id, details),
bc as (insert into ve_backlog_checks (listing_id, track, stage, verdict, reason, community_slug, city_guess, place, checked_at)
  select ins.id, 'google', 'done', 'list',
    'From the studio search (Sean, 2026-10-29): looks like ' || n.guess || ' (' || coalesce(nullif(n.ty,''),'Google') ||
      '). Add it under Services > Studios, How Vegan: Not a Vegan business, unless it is one.',
    'south-florida', n.locality,
    jsonb_build_object('id', n.p->>'id', 'name', n.nm, 'address', n.p->>'formattedAddress', 'street', n.street, 'city', n.locality, 'state', n.st,
      'zip', n.zip, 'country', 'US', 'lat', (n.p->'location'->>'latitude')::float, 'lng', (n.p->'location'->>'longitude')::float,
      'status', coalesce(n.p->>'businessStatus','OPERATIONAL'), 'rating', (n.p->>'rating')::float, 'reviews', (n.p->>'userRatingCount')::int,
      'website', n.p->>'websiteUri', 'phone', n.p->>'nationalPhoneNumber', 'type_name', n.ty, 'types', n.p->'types'),
    now()
  from ins join n1 n on n.p->>'id' = ins.details->'studio_search'->>'place_id' returning reason)
select substring(reason from 'looks like (a [a-z ]+) \(') k, count(*) from bc group by 1;
