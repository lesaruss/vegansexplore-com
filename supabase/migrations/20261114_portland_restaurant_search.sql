-- Portland: the restaurant search before the chapter opens (Sean, 2026-11-14: "open the next Vegans Explore chapters with the
-- Seattle recipe, Portland first"; Next Level Veggie Grill has two locations there, Downtown Portland and Hawthorne, both already listed).
-- 16 Google Places text searches (once:portland-restaurants, about $0.64 at list), request ids 359718 to 359733: Downtown, the Pearl,
-- Northeast, Southeast, Alberta, Hawthorne and Division, North Portland, food carts, cafes, bakeries, vegetarian, Beaverton, Hillsboro
-- and Lake Oswego, Eugene, Salem, Bend, Gresham. Copied from 20261113_seattle_restaurant_search.sql: open, in Oregon, not already
-- listed, Vegan by Google's own labels; fully_vegan public at once, vegan_options to the members' Being vetted section. Cinnaholic is
-- a 100% Vegan bakery chain, so it is fully_vegan by name. Next Level is left out (its two Portland locations are listed already).
-- This file is the record: net._http_response keeps the responses only for a few hours, so the insert does nothing if run later.
with m(rid) as (select g::bigint from generate_series(359718, 359733) g),
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
    case when country = 'US' and st = 'OR' then 'portland' end hub,
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
      'text', 'Added from the Portland restaurant search before the chapter opens (2026-11-14). ' || cat || ' and ' ||
        case vs when 'fully_vegan' then '100% Vegan' else 'Vegan options' end || ' are Logan''s best guess from Google''s labels (' ||
        coalesce(p->>'primaryType', 'none') || '); change them in the listing editor if they are wrong.'))),
  now()
from h;

-- Checked against the businesses' own websites (ve-web-reader, 2026-11-14): four Google had as Vegan options say they are 100% Vegan.
-- Doe Donuts ("artisanal vegan donuts and ice creams"), Epif ("Vegan Brunch"), Face Plant ("100% plant-based, 100% vegan"), Petunia's
-- ("gluten-free & vegan bakery", a bakery, not a restaurant). Sweetpea, Memento Mori, DC Vegetarian, Kure, Darlene's, Harlow, Van Hanh
-- and Yuan Su did not say so on their home pages and stay in Being vetted.
update listings set vegan_status = 'fully_vegan',
  category = case when slug = 'petunia-s-pies-pastries' then 'Bakeries & Cafes' else category end,
  details = jsonb_set(details, '{admin_notes}', coalesce(details->'admin_notes', '[]'::jsonb) || jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Changed to 100% Vegan on 2026-11-14: the business''s own website says so (read through ve-web-reader).'))),
  updated_at = now()
where address_state = 'OR' and crawl_source = 'restaurant-search' and vegan_status = 'vegan_options'
  and slug in ('doe-donuts-ice-cream', 'epif', 'face-plant', 'petunia-s-pies-pastries');
