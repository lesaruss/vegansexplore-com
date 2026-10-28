-- The second, wider restaurant search for London and Philadelphia (Sean, 2026-10-28: "run the restaurant search for London and
-- Philadelphia again"). 88 Google Places text searches ("vegan restaurant / vegan cafe in <area>"): 23 London neighborhoods and,
-- since the Philadelphia chapter is all of Pennsylvania, 10 Philadelphia neighborhoods and 11 other Pennsylvania cities (request ids
-- 225220 to 225307). Same rules as 20261028_restaurant_search_new_chapters.sql, with two changes: the field mask now asks for
-- regularOpeningHours, so each listing's hours are saved from Google's opening periods at insert (google_hours_json {Day: "11 AM to
-- 8 PM"}, Closed for a day with none), and the name check now matches a listing of any status, so a place we set aside never comes
-- back. 102 live: London 62 (23 100% Vegan, 39 Vegan options), Philadelphia 40 (8 and 32). ve_listing_essentials_queue() and
-- ve_menu_import_queue() were then run so the About reader (ve-listing-about) and the menu finders take them at once.
-- This file is the record: net._http_response keeps the search responses only for a few hours, so it does nothing if run later.
with p as (select distinct on (e.p->>'id') e.p from net._http_response r
  cross join jsonb_array_elements(coalesce((r.content::jsonb)->'places', '[]'::jsonb)) e(p)
  where r.id between 225220 and 225307 and r.content like '{%' and r.content like '%"places"%' order by e.p->>'id'),
a as (select p,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'country' limit 1) country,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'administrative_area_level_1' limit 1) st0,
    coalesce((select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'locality' limit 1),
             (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_town' limit 1)) city,
    coalesce((select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['neighborhood','sublocality','sublocality_level_1'] limit 1),
             (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'route' limit 1)) hood,
    (select string_agg(c->>'longText', ' ') from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['street_number','route']) street,
    (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_code' limit 1) zip,
    (select case when count(*) = 0 then null
        when bool_or(o.per->'close' is null) then jsonb_build_object('Monday','Open 24 hours','Tuesday','Open 24 hours','Wednesday','Open 24 hours','Thursday','Open 24 hours','Friday','Open 24 hours','Saturday','Open 24 hours','Sunday','Open 24 hours')
        else (select jsonb_object_agg(dn, coalesce((select string_agg(
              replace(to_char(make_time((x->'open'->>'hour')::int, coalesce((x->'open'->>'minute')::int,0), 0), 'FMHH12:MI AM'), ':00 ', ' ') || ' to ' ||
              replace(to_char(make_time((x->'close'->>'hour')::int, coalesce((x->'close'->>'minute')::int,0), 0), 'FMHH12:MI AM'), ':00 ', ' '), ', '
              order by (x->'open'->>'hour')::int, (x->'open'->>'minute')::int)
            from jsonb_array_elements(p->'regularOpeningHours'->'periods') x where (x->'open'->>'day')::int = di), 'Closed'))
          from unnest(array['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']) with ordinality w(dn, di1), lateral (select (di1 - 1)::int di) z) end
      from jsonb_array_elements(p->'regularOpeningHours'->'periods') o(per)) hours
  from p where coalesce(p->>'businessStatus', 'OPERATIONAL') = 'OPERATIONAL'),
b as (select a.*, case when country = 'GB' then null else st0 end st, trim(left(p->'displayName'->>'text', 140)) nm,
    case when country = 'GB' and city = 'London' then 'london' when country = 'US' and st0 = 'PA' then 'philadelphia' end hub,
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
      or (regexp_replace(lower(l.name), '[^a-z0-9]', '', 'g') = regexp_replace(lower(b.nm), '[^a-z0-9]', '', 'g')
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
  address_state, address_zip, address_country, latitude, longitude, google_place_id, google_hours_json, business_status, vegan_status, initials,
  crawl_source, details, updated_at)
select left(fname, 140), slug, cat, '', '', 'approved', coalesce(p->>'websiteUri', ''), coalesce(p->>'nationalPhoneNumber', p->>'internationalPhoneNumber'),
  coalesce(nullif(concat_ws(', ', city, st), ''), city), street, city, st, zip, country,
  (p->'location'->>'latitude')::float8, (p->'location'->>'longitude')::float8, p->>'id', hours, 'OPERATIONAL', vs,
  upper(left(regexp_replace(fname, '[^A-Za-z]', '', 'g'), 2)), 'restaurant-search',
  jsonb_build_object('restaurant_search', jsonb_build_object('hub', hub, 'at', now(), 'google_type', p->>'primaryType', 'place_id', p->>'id',
      'rating', p->'rating', 'reviews', p->'userRatingCount', 'pass', 2),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Added from the second, wider restaurant search for ' || case hub when 'london' then 'London' else 'Philadelphia' end || ' (2026-10-28). ' || cat || ' and ' ||
        case vs when 'fully_vegan' then '100% Vegan' else 'Vegan options' end || ' are Logan''s best guess from Google''s labels (' ||
        coalesce(p->>'primaryType', 'none') || '); change them in the listing editor if they are wrong.'))),
  now()
from h
returning details->'restaurant_search'->>'hub' hub, vegan_status;
