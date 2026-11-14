-- San Francisco, Austin, Denver and Boston: the restaurant searches before the chapters open (Sean, 2026-11-14: "go" on Logan's
-- recommendation to build the four remaining Next Level cities as one batch). 56 Google Places text searches, request ids 359892 to
-- 359947: once:sf-restaurants 16 (359892-359907), once:austin-restaurants 12 (359908-359919), once:denver-restaurants 13 (359920-359932),
-- once:boston-restaurants 15 (359933-359947); about $2.24 at list. Copied from 20261114_portland_restaurant_search.sql (Seattle's rules):
-- open, in the chapter by its own address, not already listed, Vegan by Google's own labels; fully_vegan public at once, vegan_options to
-- Being vetted. Reach: the Bay Area and Central Texas by their city lists (California is also Los Angeles's and the rest of Texas is left for
-- Houston and others), Denver all of Colorado, Boston all of Massachusetts. Next Level is left out (its locations are listed already).
-- This file is the record: net._http_response keeps the responses only for a few hours, so the insert does nothing if run later.
with m(rid) as (select g::bigint from generate_series(359892, 359947) g),
p as (select distinct on (e.p->>'id') e.p from m join net._http_response r on r.id = m.rid
  cross join jsonb_array_elements(coalesce((r.content::jsonb)->'places', '[]'::jsonb)) e(p) order by e.p->>'id'),
a as (select p,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'administrative_area_level_1' limit 1) st,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'country' limit 1) country,
    coalesce((select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'locality' limit 1),
             (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_town' limit 1)) city,
    coalesce((select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['neighborhood','sublocality','sublocality_level_1'] limit 1),
             (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'route' limit 1)) hood,
    (select string_agg(c->>'longText', ' ') from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['street_number','route']) street,
    (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_code' limit 1) zip
  from p where coalesce(p->>'businessStatus', 'OPERATIONAL') = 'OPERATIONAL' and (p->'displayName'->>'text') !~* '^next level'),
b as (select a.*, trim(left(p->'displayName'->>'text', 140)) nm,
    case when country = 'US' and st = 'CA' and city = any (array['San Francisco','Oakland','Berkeley','San Jose','Palo Alto','Mountain View','Santa Clara','Sunnyvale','Fremont','Hayward','Walnut Creek','Concord','San Mateo','Redwood City','San Rafael','Alameda','Emeryville','Richmond','Daly City','South San Francisco','Burlingame','Menlo Park','Cupertino','Campbell','Los Gatos','Milpitas','Pleasanton','Livermore','Dublin','San Leandro','Albany','El Cerrito','Mill Valley','Sausalito','Novato','Petaluma','Santa Rosa','Napa','Vallejo','Danville','San Ramon','Lafayette','Orinda','Union City','Newark','Saratoga','Los Altos','Half Moon Bay','Pacifica','San Bruno','Millbrae','Belmont','San Carlos','Foster City','Pittsburg','Antioch','Martinez','Pleasant Hill','Castro Valley','Larkspur','Corte Madera','Fairfax','San Anselmo','Morgan Hill','Gilroy','Sebastopol']) then 'san-francisco'
         when country = 'US' and st = 'TX' and city = any (array['Austin','Round Rock','Cedar Park','Pflugerville','Georgetown','Leander','San Marcos','Kyle','Buda','Lakeway','Bee Cave','Dripping Springs','Hutto','Manor','Bastrop','Wimberley','New Braunfels','Taylor','Liberty Hill','Lago Vista','West Lake Hills','Sunset Valley','Elgin','Lockhart','Spicewood','Del Valle','Canyon Lake']) then 'austin'
         when country = 'US' and st = 'CO' then 'denver' when country = 'US' and st = 'MA' then 'boston' end hub,
    case when (p->'displayName'->>'text') ~* '^cinnaholic' then 'fully_vegan'
         when (p->>'primaryType' = 'vegan_restaurant' or (p->'displayName'->>'text') ~* '\mvegan')
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
  concat_ws(', ', city, case when country = 'GB' then null else st end), street, city, case when country = 'GB' then null else st end, zip, country,
  (p->'location'->>'latitude')::float8, (p->'location'->>'longitude')::float8, p->>'id', 'OPERATIONAL', vs,
  upper(left(regexp_replace(fname, '[^A-Za-z]', '', 'g'), 2)), 'restaurant-search',
  jsonb_build_object('restaurant_search', jsonb_build_object('hub', hub, 'at', now(), 'google_type', p->>'primaryType', 'place_id', p->>'id',
      'rating', p->'rating', 'reviews', p->'userRatingCount'),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Added from the ' || case hub when 'san-francisco' then 'San Francisco' when 'austin' then 'Austin' when 'denver' then 'Denver' else 'Boston' end || ' restaurant search before the chapter opens (2026-11-14). ' || cat || ' and ' ||
        case vs when 'fully_vegan' then '100% Vegan' else 'Vegan options' end || ' are Logan''s best guess from Google''s labels (' ||
        coalesce(p->>'primaryType', 'none') || '); change them in the listing editor if they are wrong.'))),
  now()
from h;
