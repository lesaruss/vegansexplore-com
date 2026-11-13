-- Seattle: the restaurant search before the chapter opens (Sean, 2026-11-13: "start the Seattle city page"; the first city opened
-- because Next Level Veggie Grill is there: "each place we open up into is another opportunity for us to swing momentum").
-- 16 Google Places text searches (once:seattle-restaurants, about $0.64 at list), request ids 358923 to 358938: eight Seattle
-- neighborhoods, Seattle cafes, bakeries, vegetarian and food trucks, Bellevue, Redmond and Kirkland, Tacoma, Everett and Lynnwood.
-- Same rules as 20261028_restaurant_search_new_chapters.sql (copied): open, in Washington, not already listed, Vegan by Google's own
-- labels; fully_vegan public at once, vegan_options to the members' Being vetted section. Cinnaholic is a 100% Vegan bakery chain, so it
-- is fully_vegan by name. Next Level Veggie Grill is left out here and added below as a location of its chain.
-- This file is the record: net._http_response keeps the responses only for a few hours, so the insert does nothing if run later.
with m(rid) as (select g::bigint from generate_series(358923, 358938) g),
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
    case when country = 'US' and st = 'WA' then 'seattle' end hub,
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
      'text', 'Added from the Seattle restaurant search before the chapter opens (2026-11-13). ' || cat || ' and ' ||
        case vs when 'fully_vegan' then '100% Vegan' else 'Vegan options' end || ' are Logan''s best guess from Google''s labels (' ||
        coalesce(p->>'primaryType', 'none') || '); change them in the listing editor if they are wrong.'))),
  now()
from h;


-- Next Level Veggie Grill, University Village (found in this search; Google had not shown it for the chain): their 20th location,
-- added through the Add a location path and owned by their account like the other 19.
do $$
declare res jsonb; v_owner uuid := 'bb861387-f0bd-475f-8e8b-fdbaa2aa4c76';
begin
  if exists (select 1 from listings where google_place_id = 'ChIJo6Dh_4UUkFQRv4deKp03S6w') then return; end if;
  res := ve_listing_add_location((select id from listings where slug = 'next-level-veggie-grill-long-beach-b4fc'), 'University Village',
    '2681 Northeast University Village Street', 'Seattle', 'WA', '98105', null, v_owner);
  if not (res->>'ok')::boolean then raise exception 'add failed: %', res; end if;
  update listings set google_place_id = 'ChIJo6Dh_4UUkFQRv4deKp03S6w', owner_member_id = v_owner, claimed_by_member_id = v_owner,
    claim_status = 'verified', website = 'https://www.nextlevelvg.com/', instagram = 'nextlevelvg',
    description = 'Next Level Veggie Grill in University Village serves a 100% Vegan menu made with fresh organic vegetables and responsibly sourced, non-GMO ingredients, good for people, animals and the planet.',
    updated_at = now()
  where id = (res->>'id')::uuid;
  insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, price_range, holiday_hours, contact_note, team_note, reviewed_at, submitted_at)
  select src.holiday_slug, (res->>'id')::uuid, src.member_id, 'live', src.summary, src.items, src.order_url, src.order_by, src.pickup, src.price_range, src.holiday_hours, src.contact_note,
    'Copied from Long Beach 2026-11-13 by Logan (same menu at every location, per Carrie Davis).', now(), now()
  from ve_holiday_menus src join listings m on m.id = src.listing_id and m.slug = 'next-level-veggie-grill-long-beach-b4fc' where src.holiday_slug = 'thanksliving';
end $$;
