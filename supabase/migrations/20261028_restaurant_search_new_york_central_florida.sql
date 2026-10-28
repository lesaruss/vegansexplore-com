-- The restaurant search for New York and Central Florida (Sean, 2026-10-28: "run the restaurant search for New York and Central
-- Florida"). The same searches and rules as 20261028_restaurant_search_new_chapters.sql: 38 Google Places text searches (20 for
-- Manhattan, Brooklyn, Queens, the Bronx and Staten Island; 18 for Orlando, Tampa Bay, the Space Coast, Daytona and the southwest
-- Gulf), request ids 222923 to 222960. New York is any place in NY; a borough with no city of its own takes the borough (Brooklyn,
-- Queens, Bronx, Staten Island), as the listings already there do. Central Florida is a place in one of the chapter's cities; 13
-- the search found nearby were added to the chapter (VE_HUBS CF in public/ve-hubs.js, CFL_CITIES in directory/listing.html, now the
-- whole list, HUBS in ve-claims, and the row below). 191 listed live: New York 105 (46 100% Vegan, 59 Vegan options), Central
-- Florida 86 (15 and 71). This file is the record: net._http_response keeps the search responses only for a few hours.
update ve_outreach_cities set cities = (select array_agg(distinct x) from unnest(cities || array['Cape Canaveral','Lake Buena Vista','Nokomis','Gulfport','Pinellas Park','Poinciana','Sand Lake','Indialantic','Rockledge','Indian Harbour Beach','Belleair Bluffs','Daytona Beach Shores','South Daytona']) x)
where community_slug = 'central-florida';

with m(rid) as (select g::bigint from generate_series(222923, 222960) g),
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
    case when st = 'NY' and country = 'US' then 'new-york' when st = 'FL' and country = 'US' and city = any(array['Orlando','Altamonte Springs','Apopka','Lakeland','The Villages','Winter Haven','Ocala','Sanford','Oviedo','Winter Park','Winter Garden','Kissimmee','Celebration','Clermont','Maitland','Longwood','Casselberry','Lake Mary','Windermere','Ocoee','Leesburg','Mount Dora','Eustis','Haines City','Bartow','Davenport','Sebring','Tampa','St. Petersburg','Saint Petersburg','Clearwater','Clearwater Beach','Largo','Dunedin','Palm Harbor','Tarpon Springs','Brandon','Riverview','Wesley Chapel','Land O'' Lakes','Lutz','Plant City','Temple Terrace','New Port Richey','Bradenton','Sarasota','Venice','North Port','Myakka City','Duette','Punta Gorda','Port Charlotte','Fort Myers','Cape Coral','Naples','Bonita Springs','Estero','Daytona Beach','Ormond Beach','Port Orange','New Smyrna Beach','DeLand','Deltona','Melbourne','Titusville','Cocoa','Cocoa Beach','Palm Bay','Cape Canaveral','Lake Buena Vista','Nokomis','Gulfport','Pinellas Park','Poinciana','Sand Lake','Indialantic','Rockledge','Indian Harbour Beach','Belleair Bluffs','Daytona Beach Shores','South Daytona']) then 'central-florida' end hub,
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
      'text', 'Added from the restaurant search for New York and Central Florida (2026-10-28). ' || cat || ' and ' ||
        case vs when 'fully_vegan' then '100% Vegan' else 'Vegan options' end || ' are Logan''s best guess from Google''s labels (' ||
        coalesce(p->>'primaryType', 'none') || '); change them in the listing editor if they are wrong.'))),
  now()
from h;
