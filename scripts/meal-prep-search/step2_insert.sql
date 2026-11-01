-- Step 2: add the meal prep businesses step 1 found. Replace FIRST_ID and LAST_ID with step 1's request ids, and run it within a few
-- hours (net._http_response keeps responses only briefly). Same shape as the restaurant searches (20261028_restaurant_search_*.sql).
-- Rules (Sean, 2026-11-01: "Do the local meal prep search next"): a meal prep or meal delivery business by its name or Google's type, AND Vegan
-- by its name or Google's Vegan category. 100% Vegan when the name says Vegan or plant-based or Google's main type is Vegan restaurant
-- (never "vegetarian" or "vegan-ish"); otherwise Vegan options, which waits in Being vetted for 10 member votes. Stores left out. Nothing
-- already listed (any status) by Google place or by name and city. The chapter comes from the address (Florida split by latitude).
with p as (select distinct on (e.p->>'id') e.p from net._http_response r
  cross join jsonb_array_elements(coalesce((r.content::jsonb)->'places', '[]'::jsonb)) e(p)
  where r.id between FIRST_ID and LAST_ID and r.content like '{%' and r.content like '%"places"%' order by e.p->>'id'),
a as (select p,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'country' limit 1) country,
    (select c->>'shortText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'administrative_area_level_1' limit 1) st0,
    coalesce((select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'locality' limit 1),
             (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['sublocality','sublocality_level_1'] limit 1),
             (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_town' limit 1)) city,
    (select string_agg(c->>'longText', ' ') from jsonb_array_elements(p->'addressComponents') c where c->'types' ?| array['street_number','route']) street,
    (select c->>'longText' from jsonb_array_elements(p->'addressComponents') c where c->'types' ? 'postal_code' limit 1) zip,
    (p->'location'->>'latitude')::float8 lat, (p->'location'->>'longitude')::float8 lng,
    trim(left(p->'displayName'->>'text', 140)) nm
  from p where coalesce(p->>'businessStatus', 'OPERATIONAL') = 'OPERATIONAL'),
b as (select a.*, case when country = 'GB' then null else st0 end st,
    case when country = 'GB' and (city = 'London' or zip ~ '^(E|EC|N|NW|SE|SW|W|WC)[0-9]') then 'london'
         when country <> 'US' then null
         when st0 = 'FL' then case when lng > -80.9 and lat < 27.9 then 'south-florida' when lat >= 29.4 then 'north-florida' else 'central-florida' end
         when st0 = 'GA' then 'atlanta' when st0 = 'DC' then 'dc' when st0 = 'MD' then 'maryland' when st0 = 'VA' then 'virginia'
         when st0 = 'DE' then 'delaware' when st0 = 'WV' then 'west-virginia' when st0 = 'NY' then 'new-york' when st0 = 'PA' then 'philadelphia'
         when st0 = 'CA' then 'los-angeles' end hub,
    (nm ~* 'meal|prep|deliver|chef|kitchen' or (p->'types') ?| array['meal_delivery','meal_takeaway']) mealish,
    case when (p->>'primaryType' = 'vegan_restaurant' or nm ~* '\mvegan|plant.?based|plant.?powered') and nm !~* 'vegetarian|vegan.?ish|options' then 'fully_vegan'
         when (p->'types') ? 'vegan_restaurant' or nm ~* '\mvegan|\mplant' then 'vegan_options' end vs
  from a),
c as (select * from b where hub is not null and vs is not null and mealish
    and coalesce(p->>'primaryType', '') not in ('food_store','health_food_store','grocery_store','supermarket','market','gym','fitness_center')
    and not exists (select 1 from listings l where l.google_place_id = b.p->>'id'
      or (regexp_replace(lower(l.name), '[^a-z0-9]', '', 'g') = regexp_replace(lower(b.nm), '[^a-z0-9]', '', 'g')
          and lower(coalesce(l.address_city, '')) = lower(coalesce(b.city, ''))))),
f as (select c.*, trim(both '-' from regexp_replace(lower(nm), '[^a-z0-9]+', '-', 'g')) base,
    trim(both '-' from regexp_replace(lower(coalesce(city, '')), '[^a-z0-9]+', '-', 'g')) cslug from c),
g as (select f.*, row_number() over (partition by base order by p->>'id') rn from f),
h as (select g.*, case when rn = 1 and not exists (select 1 from listings l where l.slug = g.base) then base
    when rn = 1 and not exists (select 1 from listings l where l.slug = g.base || '-' || g.cslug) then base || '-' || cslug
    else base || '-' || cslug || '-' || left(md5(p->>'id'), 4) end slug from g)
insert into listings (name, slug, category, specialty, description, status, website, phone, location, address_street, address_city,
  address_state, address_zip, address_country, latitude, longitude, google_place_id, business_status, vegan_status, initials, communities,
  crawl_source, tenant_id, details, updated_at)
select nm, slug, 'Meal Prep', '', '', 'approved', coalesce(p->>'websiteUri', ''), p->>'nationalPhoneNumber',
  coalesce(nullif(concat_ws(', ', city, st), ''), city), street, city, st, zip, country, lat, lng, p->>'id', 'OPERATIONAL', vs,
  upper(left(regexp_replace(nm, '[^A-Za-z]', '', 'g'), 2)), array[hub], 'meal-prep-search', '00000000-0000-4000-a000-000000000002',
  jsonb_build_object('meal_prep_search', jsonb_build_object('hub', hub, 'at', now(), 'google_type', p->>'primaryType', 'place_id', p->>'id'),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Added from the local meal prep search (2026-11-02). ' || case vs when 'fully_vegan' then '100% Vegan' else 'Vegan options' end ||
        ' is Logan''s best guess from its name and Google''s labels (' || coalesce(p->>'primaryType', 'none') || '); change it in the listing editor if wrong.'))),
  now()
from h
returning details->'meal_prep_search'->>'hub' hub, vegan_status, name;
