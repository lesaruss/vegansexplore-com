-- Products > Food & Drink, a round of whole-Vegan brands (Sean, 2026-11-01: "start the Food & Drink round"), aimed at the thin types
-- (seafood and egg alternatives, drinks, pantry, baked goods, frozen). Checked by web search. Eight come from the June Instagram import,
-- where they sat quarantined (the first copy is listed; other copies stay put); three are new. Tags added to four listed brands with none.
-- Left out: Good Catch, Sophie's Kitchen and Upton's Naturals (no current sign of trading found), Lightlife (not confirmed fully Vegan),
-- Impossible Foods (Sean's call: plant ingredients, but animal testing of its heme).

with b(slug, name, specialty, website, instagram, tagline, description, kinds) as (values
 ('beyondmeat', 'Beyond Meat', 'Plant-based meat', 'https://www.beyondmeat.com', 'beyondmeat',
  'Plant-based burgers, sausage and more',
  'Plant-based burgers, sausages, ground, chicken and steak pieces, made from peas, beans and rice. Every product is plant-based.', array['meat']),
 ('fieldroast', 'Field Roast', 'Plant-based meat', 'https://fieldroast.com', 'fieldroast',
  'Plant-based sausages, roasts and more',
  'Seattle brand making grain meat from wheat protein since 1997: sausages, deli slices, burgers and its holiday roast.', array['meat']),
 ('gardein', 'Gardein', 'Plant-based meat', 'https://www.gardein.com', 'gardein',
  'Meatless favorites, frozen',
  'Frozen plant-based chicken, beef, fish and pork style favorites, from crispy tenders to fishless filets. All Vegan.', array['meat','frozen']),
 ('hippeas_snacks', 'HIPPEAS', 'Chickpea snacks', 'https://hippeas.com', 'hippeas_snacks',
  'Organic chickpea puffs and chips',
  'Organic chickpea puffs, tortilla chips and pops in flavors from Vegan White Cheddar to Bohemian Barbecue. Vegan and gluten-free.', array['snacks']),
 ('drinkkoia', 'Koia', 'Plant protein shakes', 'https://drinkkoia.com', 'drinkkoia',
  'Plant protein shakes',
  'Ready-to-drink plant protein shakes and keto shakes in flavors like Cacao Bean and Vanilla Bean, sold at Target, Publix and Whole Foods.', array['drinks','protein']),
 ('partake', 'Partake Foods', 'Vegan, allergen-free cookies', 'https://partakefoods.com', null,
  'Vegan cookies, free of the top allergens',
  'Vegan cookies, baking mixes and grahams made free of the top food allergens. A certified B Corporation.', array['baked','snacks']),
 ('abesmuffins', 'Abe''s', 'Vegan muffins and cakes', 'https://abesmuffins.com', 'abesmuffins',
  'Vegan muffins, cakes and brownies',
  'Vegan muffins, mini muffins, pound cakes, layer cakes and brownies, sold at Whole Foods, Sprouts and Ralphs.', array['baked']),
 ('navitasorganics', 'Navitas Organics', 'Organic superfoods', 'https://navitasorganics.com', 'navitasorganics',
  'Organic, plant-based superfoods',
  'Organic, plant-based superfood powders, cacao, seeds, berries and snacks, since 2003.', array['pantry','snacks'])
)
update public.listings l set name = b.name, category = 'Food Brands', specialty = b.specialty, description = b.description, tagline = b.tagline,
  website = b.website, instagram = coalesce(b.instagram, l.instagram), location = 'Online', status = 'approved', vegan_status = 'fully_vegan',
  communities = '{}', product_kinds = b.kinds, crawl_source = coalesce(l.crawl_source, 'admin'), tenant_id = '00000000-0000-4000-a000-000000000002',
  initials = upper(left(b.name, 1)),
  details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('added_by_hand', true, 'admin_notes', coalesce(l.details->'admin_notes', '[]'::jsonb) ||
    jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note', 'text', 'Listed 2026-11-01 from the import (it was quarantined): a whole-Vegan Food & Drink brand, checked by web search.')))
from b where l.slug = b.slug and l.status = 'quarantined';

with b(slug, name, specialty, website, tagline, description, kinds) as (values
 ('konscious-foods', 'Konscious Foods', 'Vegan sushi and poke', 'https://konsciousfoods.com',
  'Plant-based sushi and poke',
  'Canadian brand making frozen plant-based sushi rolls, onigiri and poke bowls with Vegan tuna and salmon. On PETA''s 2025 list of top Vegan seafood brands.', array['seafood','frozen']),
 ('simply-eggless', 'Simply Eggless', 'Plant-based eggs', 'https://simplyeggless.com',
  'Plant-based eggs from lupin',
  'Plant-based liquid egg, patties and egg bites made from lupin beans.', array['egg']),
 ('crackd', 'Crackd', 'Plant-based egg', 'https://crackd.com',
  'The no-egg egg',
  'Pea protein liquid egg for scrambles and baking, launched in the UK and in the US since 2025.', array['egg'])
)
insert into public.listings (name, slug, category, specialty, description, tagline, location, website, status, vegan_status,
  communities, product_kinds, crawl_source, tenant_id, initials, details)
select b.name, b.slug, 'Food Brands', b.specialty, b.description, b.tagline, 'Online', b.website, 'approved', 'fully_vegan',
  '{}'::text[], b.kinds, 'admin', '00000000-0000-4000-a000-000000000002', upper(left(b.name, 1)),
  jsonb_build_object('added_by_hand', true, 'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
    'text', 'Added 2026-11-01 to Food & Drink: a whole-Vegan brand, checked by web search.')))
from b where not exists (select 1 from public.listings l where l.slug = b.slug);

-- Types for listed brands that had none.
with t(slug, kinds) as (values ('chia-ballz', array['snacks']), ('flex-bites', array['snacks','protein']), ('no-cow', array['protein','snacks']),
  ('planted-table', array['meals']))
, logged as (insert into public.ve_listing_edits (listing_id, field, old_value, new_value, meta)
  select l.id, 'product_kinds', to_jsonb(l.product_kinds), to_jsonb(t.kinds), '{"by":"Logan"}'::jsonb
  from public.listings l join t on t.slug = l.slug where l.status = 'approved' and coalesce(l.product_kinds, '{}') = '{}' returning listing_id)
update public.listings l set product_kinds = t.kinds from t where l.slug = t.slug and l.status = 'approved' and coalesce(l.product_kinds, '{}') = '{}';
