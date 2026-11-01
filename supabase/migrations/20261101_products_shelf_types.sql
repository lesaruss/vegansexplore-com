-- Products shelves get their own types (Sean, 2026-11-01: "I don't want 1,000 categories... vitamins... Huel is a meal replacement...
-- protein... shoes... suits, streetwear... Makeup. Fragrances"). Nutrition & Supplements: protein, vitamins, meal_replace, greens, sports.
-- Clothing and Fashion: shoes, streetwear, outerwear, formal, bags. Beauty and Personal Care: makeup, skincare, haircare, fragrance,
-- bodycare. All in listings.product_kinds; the Directory shows only a type with at least one listing (KIND_GROUPS in
-- public/ve-region-directory.js). Every listing on the three shelves tagged from its own description, each change a ve_listing_edits row.

alter table public.listings drop constraint if exists listings_product_kinds_known;
alter table public.listings add constraint listings_product_kinds_known check (product_kinds <@ array['dairy','meat','egg','seafood','snacks',
  'drinks','protein','pantry','baked','frozen','meals','vitamins','meal_replace','greens','sports','shoes','streetwear','outerwear','formal',
  'bags','makeup','skincare','haircare','fragrance','bodycare']::text[]);

with t(slug, kinds) as (values
  ('acure', array['skincare','haircare','bodycare']), ('arbonne', array['skincare','makeup']), ('axiology', array['makeup']),
  ('elfcosmetics', array['makeup','skincare']), ('ethique', array['haircare','skincare','bodycare']), ('herbivore-botanicals', array['skincare']),
  ('jecca-blac', array['makeup']), ('kvd-beauty', array['makeup']), ('lime-crime', array['makeup','haircare']), ('milk-makeup', array['makeup']),
  ('pacifica-beauty', array['skincare','makeup','fragrance']), ('youth-to-the-people', array['skincare']),
  ('angela-roi', array['bags']), ('doshi', array['bags']), ('immaculate-vegan', array['shoes','bags']), ('matt-and-nat', array['bags']),
  ('mooshoes', array['shoes','bags']), ('nae-vegan-shoes', array['shoes','bags']), ('noize', array['outerwear']),
  ('plant-faced-clothing', array['streetwear']), ('save-the-duck', array['outerwear']), ('vegetarian-shoes', array['shoes','bags']),
  ('aloha', array['protein']), ('amazing-grass', array['greens']), ('complement', array['vitamins']), ('deva-nutrition', array['vitamins']),
  ('form-nutrition', array['protein','meal_replace']), ('future-kind', array['vitamins','protein']), ('garden-of-life', array['protein','vitamins']),
  ('happy-viking', array['protein']), ('huel', array['meal_replace','protein','greens']), ('kos', array['protein']),
  ('nested-naturals', array['greens','vitamins']), ('nuzest', array['protein','greens']), ('ora-organic', array['protein','greens','vitamins']),
  ('plant-fusion', array['protein','meal_replace']), ('ritual', array['vitamins','protein']), ('sprout-living', array['protein']),
  ('sunwarrior', array['protein','greens','sports']), ('truvani', array['protein']), ('vedgenutrition', array['protein','sports']),
  ('vega', array['protein','sports']), ('vivo-life', array['protein','sports']), ('your-super', array['greens','protein']),
  ('sakara-life', array['meals','vitamins'])
), cur as (
  select l.id, l.product_kinds old, (select array_agg(distinct k order by k) from unnest(coalesce(l.product_kinds,'{}') || t.kinds) k) new
  from public.listings l join t on t.slug = l.slug where l.status = 'approved'
), logged as (
  insert into public.ve_listing_edits (listing_id, field, old_value, new_value, meta)
  select id, 'product_kinds', to_jsonb(old), to_jsonb(new), '{"by":"Logan","why":"Products shelf types, from its own description (Sean, 2026-11-01)"}'::jsonb
  from cur where new is distinct from old returning listing_id
)
update public.listings l set product_kinds = cur.new from cur where l.id = cur.id and cur.new is distinct from cur.old;
