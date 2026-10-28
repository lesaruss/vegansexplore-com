-- The restaurant search for the newer chapters (Sean, 2026-10-28: "Philadelphia doesn't have any restaurants, and neither does
-- London... West Virginia, Maryland, Delaware, Washington, D.C., and North Florida... do a scan of those areas and start populating
-- them with restaurants... follow what we've been doing for the other locations"). Virginia had none either and was searched too.
--
-- 59 Google Places text searches (Places API (New) searchText, "vegan restaurant / cafe / bakery in <city or neighborhood>",
-- 20 places each), run from the database with net.http_post and the key in lesaruss_secrets, request ids 222503 to 222561. Each
-- place was kept when it is open, in one of our chapters by its own address (GB, DC, MD, VA, DE, WV, PA, FL), not already listed
-- (same Google place, or the same name in the same city), and Vegan by Google's own labels:
--   fully_vegan    Google's main type is Vegan restaurant, or the name says Vegan (and not Vegetarian or -ish): public at once.
--   vegan_options  Google tags it Vegan restaurant or Vegetarian restaurant as a second type, or a fully_vegan name says
--                  Vegetarian or -ish: goes to the members-only Being vetted section until 10 members vote (public/ve-trust.js).
-- No Vegan label at all, grocery and health-food stores: left out. Category by Google's type: bakery, cake shop, cafe, coffee,
-- juice or tea shop -> Bakeries & Cafes; caterer -> Catering; the rest -> Restaurants. Two places with one name in one city get
-- their neighborhood after a dash, the way locations are named. Each listing carries crawl_source restaurant-search, its Google
-- place id, address and map pin, and a team note saying the category and how Vegan are Logan's best guess from Google. The
-- nightly essentials pass fills hours and socials, the logo sweep suggests logos, and the menu queue picks up their menus.
-- This file is the record: net._http_response keeps the search responses only for a few hours, so it does nothing if run later.
with m(rid) as (select g::bigint from generate_series(222503, 222561) g),
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
  from p where coalesce(p->>'businessStatus', 'OPERATIONAL') = 'OPERATIONAL'),
b as (select a.*, trim(left(p->'displayName'->>'text', 140)) nm,
    case when country = 'GB' then 'london' when st = 'DC' then 'washington-dc' when st = 'MD' then 'maryland' when st = 'VA' then 'virginia'
      when st = 'DE' then 'delaware' when st = 'WV' then 'west-virginia' when st = 'PA' then 'philadelphia' when st = 'FL' then 'florida' end hub,
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
  concat_ws(', ', city, case when country = 'GB' then null else st end), street, city, case when country = 'GB' then null else st end, zip, country,
  (p->'location'->>'latitude')::float8, (p->'location'->>'longitude')::float8, p->>'id', 'OPERATIONAL', vs,
  upper(left(regexp_replace(fname, '[^A-Za-z]', '', 'g'), 2)), 'restaurant-search',
  jsonb_build_object('restaurant_search', jsonb_build_object('hub', hub, 'at', now(), 'google_type', p->>'primaryType', 'place_id', p->>'id',
      'rating', p->'rating', 'reviews', p->'userRatingCount'),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Added from the restaurant search for the newer chapters (2026-10-28). ' || cat || ' and ' ||
        case vs when 'fully_vegan' then '100% Vegan' else 'Vegan options' end || ' are Logan''s best guess from Google''s labels (' ||
        coalesce(p->>'primaryType', 'none') || '); change them in the listing editor if they are wrong.'))),
  now()
from h;
