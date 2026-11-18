-- Paris: the restaurant search before the chapter opens (Sean, 2026-11-18: "I want us to launch a Paris chapter"; first case
-- Land & Monkeys, the all-Vegan boulangerie chain, from his screenshots Ideas 111826 IMG_8436 and 8437). Copied from
-- 20261114_portland_restaurant_search.sql with London's international rules (no state).
-- 18 Google Places text searches (once:paris-restaurants, $0.72 at list), request ids 398393 to 398410: Le Marais, Bastille, Oberkampf,
-- Montmartre, Canal Saint-Martin, the Latin Quarter, Saint-Germain, Belleville, Batignolles, Pigalle, Vegan bakeries, Vegan cafes,
-- vegetarian, Land & Monkeys, and Boulogne-Billancourt, Montreuil, Saint-Denis and Vincennes. The chapter is Paris and the inner
-- suburbs (the communes listed below). Same rules: open, not already listed, Vegan by Google's own labels; fully_vegan public at once,
-- vegan_options to the members' Being vetted section. A French name saying "vegetarien" is not fully Vegan by name. Land & Monkeys is a
-- 100% Vegan bakery chain, so every location is fully_vegan by name, named for its street or area (the Rue de Turenne shop is Turenne),
-- and the Beaumarchais shop (the founders' first address) is the parent the others hang from.
-- This file is the record: net._http_response keeps the responses only for a few hours, so the insert does nothing if run later.
with m(rid) as (select g::bigint from generate_series(398393, 398410) g),
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
    case when country = 'FR' and city = any (array['Paris','Boulogne-Billancourt','Montreuil','Saint-Denis','Vincennes','Neuilly-sur-Seine','Levallois-Perret','Issy-les-Moulineaux','Ivry-sur-Seine','Pantin','Saint-Ouen-sur-Seine','Clichy','Vanves','Malakoff','Montrouge','Bagnolet','Les Lilas','Le Pré-Saint-Gervais','Charenton-le-Pont','Saint-Mandé','Gentilly','Le Kremlin-Bicêtre','Aubervilliers','Puteaux','Courbevoie']) then 'paris' end hub,
    case when (p->'displayName'->>'text') ~* '^land ?& ?monkeys' then 'fully_vegan'
         when (p->>'primaryType' = 'vegan_restaurant' or (p->'displayName'->>'text') ~* '\mvegan')
           and (p->'displayName'->>'text') !~* 'vegetarian|v[ée]g[ée]tarien|vegan.?ish' then 'fully_vegan'
         when (p->'types') ? 'vegan_restaurant' or (p->'types') ? 'vegetarian_restaurant' or p->>'primaryType' = 'vegetarian_restaurant'
           or (p->'displayName'->>'text') ~* '\mvegan' then 'vegan_options' end vs,
    case when p->>'primaryType' in ('bakery','pastry_shop','cake_shop','cafe','coffee_shop','juice_shop','tea_house','dessert_shop','ice_cream_shop','donut_shop') then 'Bakeries & Cafes'
         when p->>'primaryType' = 'catering_service' then 'Catering' else 'Restaurants' end cat
  from a),
c as (select * from b where hub is not null and vs is not null
    and coalesce(p->>'primaryType', '') not in ('food_store','health_food_store','grocery_store','supermarket','market')
    and not exists (select 1 from listings l where l.google_place_id = b.p->>'id'
      or (l.status in ('approved','pending','quarantined') and regexp_replace(lower(l.name), '[^a-z0-9]', '', 'g') = regexp_replace(lower(b.nm), '[^a-z0-9]', '', 'g')
          and lower(coalesce(l.address_city, '')) = lower(coalesce(b.city, ''))))),
d as (select c.*, count(*) over (partition by lower(nm), lower(coalesce(city, ''))) twins,
    count(*) over (partition by lower(nm), lower(coalesce(city, '')), lower(coalesce(hood, ''))) hoodtwins from c),
e as (select d.*, case when nm = 'Land & Monkeys' then 'Land & Monkeys Turenne' when nm ~* '^land ?& ?monkeys ' then regexp_replace(nm, '^land ?& ?monkeys', 'Land & Monkeys', 'i') when twins = 1 then nm when hood is not null and hoodtwins = 1 then nm || ' - ' || hood
    else nm || ' - ' || coalesce(street, zip, left(md5(p->>'id'), 4)) end fname from d),
f as (select e.*, trim(both '-' from regexp_replace(translate(lower(fname), 'àâäáãåçéèêëíìîïñóòôöõúùûüÿœæ’''', 'aaaaaaceeeeiiiinooooouuuuyoa  '), '[^a-z0-9]+', '-', 'g')) base,
    trim(both '-' from regexp_replace(translate(lower(coalesce(city, '')), 'àâäáçéèêëíìîïóòôöúùûü', 'aaaaceeeeiiiioooouuuu'), '[^a-z0-9]+', '-', 'g')) cslug from e),
g as (select f.*, row_number() over (partition by base order by p->>'id') rn from f),
h as (select g.*, case when rn = 1 and not exists (select 1 from listings l where l.slug = g.base) then base
    when not exists (select 1 from listings l where l.slug = g.base || '-' || g.cslug) and rn = 1 then base || '-' || cslug
    else base || '-' || cslug || '-' || left(md5(p->>'id'), 4) end slug from g)
insert into listings (name, slug, category, specialty, description, status, website, phone, location, address_street, address_city,
  address_state, address_zip, address_country, latitude, longitude, google_place_id, business_status, vegan_status, initials,
  crawl_source, details, updated_at)
select left(fname, 140), slug, cat, '', '', 'approved', coalesce(p->>'websiteUri', ''), p->>'nationalPhoneNumber',
  concat_ws(', ', city, 'France'), street, city, null, zip, country,
  (p->'location'->>'latitude')::float8, (p->'location'->>'longitude')::float8, p->>'id', 'OPERATIONAL', vs,
  upper(left(regexp_replace(fname, '[^A-Za-z]', '', 'g'), 2)), 'restaurant-search',
  jsonb_build_object('restaurant_search', jsonb_build_object('hub', hub, 'at', now(), 'google_type', p->>'primaryType', 'place_id', p->>'id',
      'rating', p->'rating', 'reviews', p->'userRatingCount'),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Added from the Paris restaurant search before the chapter opens (2026-11-18). ' || cat || ' and ' ||
        case vs when 'fully_vegan' then '100% Vegan' else 'Vegan options' end || ' are Logan''s best guess from Google''s labels (' ||
        coalesce(p->>'primaryType', 'none') || '); change them in the listing editor if they are wrong.'))),
  now()
from h;


-- Land & Monkeys: one chain. Beaumarchais is the parent, the other seven are its locations; the chain's description written once.
update listings set description = 'Land & Monkeys is a 100% Vegan boulangerie and patisserie chain in Paris, baking plant-based versions of French classics: croissants, pain au chocolat, quiches, focaccia, sandwiches and its Monkey cookie.',
  category = 'Bakeries & Cafes', vegan_status = 'fully_vegan', updated_at = now()
where address_country = 'FR' and name ~* '^land & monkeys' and coalesce(description, '') = '';
update listings c set parent_id = p.id, updated_at = now()
from listings p
where p.slug = 'land-monkeys-beaumarchais' and c.address_country = 'FR' and c.name ~* '^land & monkeys' and c.id <> p.id and c.parent_id is null;
-- The inner suburbs belong to the Paris chapter, as London's outer boroughs carry communities ['london'].
update listings set communities = array['paris'], updated_at = now()
where address_country = 'FR' and crawl_source = 'restaurant-search' and address_city <> 'Paris' and not ('paris' = any (coalesce(communities, '{}')));
