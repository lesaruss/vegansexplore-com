-- Products > Food & Drink > Meal Prep & Delivery (Sean, 2026-11-01: "create a meal prep section under Products < Food & Drink <
-- Meal Prep & Delivery. Add mosaic and the other brands"). A product kind, 'meals', under Food Brands (shown as Food & Drink), with a
-- visible switch on that shelf (All food & drink / Meal Prep & Delivery) in ve-region-directory.js.
-- Every Meal Prep listing in Local Food was a national shipper with a stand-in Los Angeles address (Purple Carrot is Boston, Sakara and
-- Splendid Spoon New York), so all five move to Food Brands with the meals kind, online, no address. Mosaic Foods (a vegetarian menu with
-- Vegan options) and Trifecta Nutrition (meat meals with a Vegan plan) become Vegan options. Daily Harvest (an all plant-based menu) is
-- added. Local Food > Meal Prep stays for local meal preppers.

alter table public.listings drop constraint if exists listings_product_kinds_known;
alter table public.listings add constraint listings_product_kinds_known check (product_kinds <@ array['dairy','meat','egg','seafood','snacks',
  'drinks','protein','pantry','baked','frozen','meals']::text[]);

insert into public.ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'category', to_jsonb(category), '"Food Brands"'::jsonb, '{"by":"Logan","why":"national meal delivery: Products > Food & Drink > Meal Prep & Delivery (Sean, 2026-11-01)"}'::jsonb
from public.listings where status = 'approved' and slug in ('mosaic-foods','purple-carrot-2','sakara-life','splendid-spoon','trifecta-nutrition') and category = 'Meal Prep';
insert into public.ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'vegan_status', to_jsonb(vegan_status), '"vegan_options"'::jsonb, '{"by":"Logan","why":"not an all-Vegan menu"}'::jsonb
from public.listings where status = 'approved' and slug in ('mosaic-foods','trifecta-nutrition') and vegan_status = 'fully_vegan';

update public.listings set category = 'Food Brands', product_kinds = array['meals'], location = 'Online', address_street = null,
  address_city = null, address_state = null, address_zip = null, communities = '{}'
where status = 'approved' and slug in ('mosaic-foods','purple-carrot-2','sakara-life','splendid-spoon','trifecta-nutrition');
update public.listings set vegan_status = 'vegan_options' where status = 'approved' and slug in ('mosaic-foods','trifecta-nutrition');

insert into public.listings (name, slug, category, specialty, description, tagline, location, website, status, vegan_status,
  communities, product_kinds, crawl_source, tenant_id, initials, details)
select 'Daily Harvest', 'daily-harvest', 'Food Brands', 'Plant-based frozen meals delivered',
  'Frozen smoothies, harvest bowls, flatbreads, soups and snacks, all plant-based, delivered to your door and ready in minutes.',
  'Plant-based meals, delivered frozen', 'Online', 'https://daily-harvest.com', 'approved', 'fully_vegan', '{}', array['meals'], 'admin',
  '00000000-0000-4000-a000-000000000002', 'D',
  jsonb_build_object('added_by_hand', true, 'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Added 2026-11-01 to Food & Drink > Meal Prep & Delivery: an all plant-based menu, checked by web search.')))
where not exists (select 1 from public.listings where slug = 'daily-harvest' and status = 'approved');
