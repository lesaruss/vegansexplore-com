-- The restaurant search for South Florida (Sean, 2026-10-28: "run the restaurant search for South Florida"). The same searches and
-- rules as 20261028_restaurant_search_new_chapters.sql: 33 Google Places text searches across Miami-Dade, Broward, Palm Beach, the
-- Treasure Coast and the Keys, request ids 224594 to 224626, kept when the place is in one of the chapter's cities. Five cities the
-- search found joined the chapter (Naranja, North Bay Village and Opa-locka with Miami-Dade, Tavernier and Stock Island with the Keys;
-- VE_HUBS SF in public/ve-hubs.js with its county slices moved, SF_CITIES in directory/listing.html, now the whole list, HUBS in
-- ve-claims, and the row below). 101 listed live: 18 100% Vegan, 83 Vegan options. This file is the record: net._http_response
-- keeps the search responses only for a few hours.
update ve_outreach_cities set cities = (select array_agg(distinct x) from unnest(cities || array['Naranja','North Bay Village','Opa-locka','Tavernier','Stock Island']) x)
where community_slug = 'south-florida';

with m(rid) as (select g::bigint from generate_series(224594, 224626) g),
p as (select distinct on (e.p->>'id') e.p from m join net._http_response r on r.id = m.rid
  cross join jsonb_array_elements(coalesce((r.content::jsonb)->'places', '[]'::jsonb)) e(p) order by e.p->>'id'),
a as (select p,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'administrative_area_level_1' limit 1) st,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'country' limit 1) country,
    replace(coalesce((select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'locality' limit 1),
             (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'sublocality_level_1' limit 1)), 'The Bronx', 'Bronx') city,
    coalesce((select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['neighborhood','sublocality','sublocality_level_1'] limit 1),
             (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'route' limit 1)) hood,
    (select string_agg(c->>'longText', ' ') from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['street_number','route']) street,
    (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_code' limit 1) zip
  from p where coalesce(p->>'businessStatus', 'OPERATIONAL') = 'OPERATIONAL'),
b as (select a.*, trim(left(p->'displayName'->>'text', 140)) nm,
    case when st = 'FL' and country = 'US' and city = any(array['Miami','Miami Beach','North Miami','North Miami Beach','Aventura','Bal Harbour','Sunny Isles Beach','Surfside','Doral','Hialeah','Miami Gardens','Miami Lakes','Miami Springs','Coral Gables','South Miami','Key Biscayne','Pinecrest','Palmetto Bay','Cutler Bay','Homestead','Florida City','Naranja','North Bay Village','Opa-locka','Fort Lauderdale','Hollywood','Sunrise','Pompano Beach','Coral Springs','Margate','Miramar','Pembroke Pines','Weston','Davie','Cooper City','Plantation','Lauderhill','Lauderdale Lakes','North Lauderdale','Tamarac','Oakland Park','Wilton Manors','Dania Beach','Hallandale','Hallandale Beach','Deerfield Beach','Lighthouse Point','Coconut Creek','Parkland','Lauderdale-by-the-Sea','Southwest Ranches','West Palm Beach','Boca Raton','Delray Beach','Boynton Beach','Palm Beach Gardens','Jupiter','Lake Worth','Lake Worth Beach','Tequesta','Loxahatchee','Riviera Beach','Royal Palm Beach','Wellington','North Palm Beach','Palm Beach','Greenacres','Lantana','Lake Park','Juno Beach','Palm Springs','Highland Beach','Belle Glade','Port St. Lucie','Port Saint Lucie','Stuart','Palm City','Jensen Beach','Hobe Sound','Fort Pierce','Vero Beach','Sebastian','Loxahatchee Groves','South Florida','Key West','Key Largo','Marathon','Islamorada','Tavernier','Stock Island']) then 'south-florida' end hub,
    case when (p->>'primaryType' = 'vegan_restaurant' or (p->'displayName'->>'text') ~* '\mvegan')
           and (p->'displayName'->>'text') !~* 'vegetarian|vegan.?ish' then 'fully_vegan'
         when (p->'types') ? 'vegan_restaurant' or (p->'types') ? 'vegetarian_restaurant' or p->>'primaryType' = 'vegetarian_restaurant'
           or (p->'displayName'->>'text') ~* '\mvegan' then 'vegan_options' end vs,
    case when p->>'primaryType' in ('bakery','cake_shop','cafe','coffee_shop','juice_shop','tea_house','dessert_shop','ice_cream_shop','donut_shop') then 'Bakeries & Cafes'
         when p->>'primaryType' = 'catering_service' then 'Catering' else 'Restaurants' end cat
  from a),
c as (select * from b where hub is not null and vs is not null
    and coalesce(p->>'primaryType', '') not in ('food_store','health_food_store','grocery_store','supermarket','market')
    and not exists (select 1 from listings l where l.google_place_id = b.p->>'id'
      or (l.status in ('approved','pending','quarantined') and regexp_replace(lower(l.name), '[^a-z0-9]', '', 'g') = regexp_replace(lower(b.nm), '[^a-z0-9]', '', 'g')
          and lower(coalesce(l.address_city, '')) = lower(coalesce(b.city, ''))))),
d as (select c.*, count(*) over (partition by lower(nm), lower(coalesce(city, ''))) twins,
    count(*) over (partition by lower(nm), lower(coalesce(city, '')), lower(coalesce(hood, ''))) hoodtwins from c),
e as (select d.*, case when twins = 1 then nm when hood is not null and hoodtwins = 1 then nm || ' - ' || hood
    else nm || ' - ' || coalesce(street, zip, left(md5(p->>'id'), 4)) end fname from d),
f as (select e.*, trim(both '-' from regexp_replace(lower(fname), '[^a-z0-9]+', '-', 'g')) base,
    trim(both '-' from regexp_replace(lower(coalesce(city, '')), '[^a-z0-9]+', '-', 'g')) cslug from e),
g as (select f.*, row_number() over (partition by base order by p->>'id') rn from f),
h as (select g.*, case when rn = 1 and not exists (select 1 from listings l where l.slug = g.base) then base
    when not exists (select 1 from listings l where l.slug = g.base || '-' || g.cslug) and rn = 1 then base || '-' || cslug
    else base || '-' || cslug || '-' || left(md5(p->>'id'), 4) end slug from g)
insert into listings (name, slug, category, specialty, description, status, website, phone, location, address_street, address_city,
  address_state, address_zip, address_country, latitude, longitude, google_place_id, business_status, vegan_status, initials,
  crawl_source, details, updated_at)
select left(fname, 140), slug, cat, '', '', 'approved', coalesce(p->>'websiteUri', ''), p->>'nationalPhoneNumber',
  concat_ws(', ', city, st), street, city, st, zip, country,
  (p->'location'->>'latitude')::float8, (p->'location'->>'longitude')::float8, p->>'id', 'OPERATIONAL', vs,
  upper(left(regexp_replace(fname, '[^A-Za-z]', '', 'g'), 2)), 'restaurant-search',
  jsonb_build_object('restaurant_search', jsonb_build_object('hub', hub, 'at', now(), 'google_type', p->>'primaryType', 'place_id', p->>'id',
      'rating', p->'rating', 'reviews', p->'userRatingCount'),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Added from the restaurant search for South Florida (2026-10-28). ' || cat || ' and ' ||
        case vs when 'fully_vegan' then '100% Vegan' else 'Vegan options' end || ' are Logan''s best guess from Google''s labels (' ||
        coalesce(p->>'primaryType', 'none') || '); change them in the listing editor if they are wrong.'))),
  now()
from h;
