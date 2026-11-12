-- Directory: brands from the Holiday Guide's Gift Guide (Sean, 2026-11-10: "All these brands, by the way, if they're not in directory, we add
-- them"). Added by the team, live at once (crawl_source 'admin', details.added_by_hand), the way the screenshot listings were the same day.
-- The About lines are ours. Facts come from the brands as VegNews and retailers present them; what could not be confirmed is left empty.
-- Brands whose whole line is not confirmed Vegan are vegan_options. Left out on purpose: makers of kitchen and pet gear that are not Vegan
-- businesses (Dreo, Ember, Mercer Culinary, Subminimal, Sourhouse, FURB, Spark Paws, Pup Pak, Newton Baby, Lazy Spa Day), and home goods
-- with no Directory category yet (LOHN candles, UnHide blankets): their gifts show the brand's name with no listing. Safe to run twice.
with src(slug, name, category, vegan_status, street, city, state, zip, country, website, instagram, about, color) as (values
  ('renegade-foods', 'Renegade Foods', 'Food Brands', 'fully_vegan', null, null, 'CA', null, 'US', 'https://renegadefoods.com', null,
   'Plant-based salami and charcuterie from Sonoma County, made the slow old-world way with fermentation and curing.', '#8a2c1f'),
  ('rebel-cheese', 'Rebel Cheese', 'Food Brands', 'fully_vegan', null, 'Austin', 'TX', null, 'US', 'https://rebelcheese.com', 'rebel.cheese',
   'A Vegan cheese shop in Austin making cultured cheese wheels, spreads and gift boxes that ship nationwide.', '#1f3d2b'),
  ('id-eclair', 'ID-Eclair', 'Bakeries & Cafes', 'fully_vegan', '169 W Green St', 'Pasadena', 'CA', '91105', 'US', 'https://id-eclair.com', null,
   'A plant-based French pastry shop in Pasadena known for eclairs, entremets and filled chocolate bars.', '#6b4a2b'),
  ('pawj-california', 'PAWJ California', 'Clothing and Fashion', 'fully_vegan', null, null, 'CA', null, 'US', 'https://pawjcalifornia.com', null,
   'Cozy sheepskin-free boots and slippers made with plant-based and recycled materials, on PETA''s Vegan approved list.', '#a0703c'),
  ('korean-vegan-beauty', 'Korean Vegan Beauty', 'Beauty and Personal Care', 'fully_vegan', null, null, null, null, 'US', 'https://koreanveganbeauty.com', null,
   'Vegan Korean skin care from Joanne Lee Molinaro, The Korean Vegan, built around gentle plant-based actives.', '#d9627a'),
  ('nhiar-chocolates', 'Nhiar Chocolates', 'Food Brands', 'fully_vegan', null, null, null, null, 'US', 'https://nhiar.com', null,
   'Hand-painted Vegan bonbons and chocolate gift boxes, made in small batches.', '#3b2416'),
  ('no-49-handbags', 'No. 49 Handbags', 'Clothing and Fashion', 'fully_vegan', null, null, null, null, 'CA', 'https://no49handbags.com', null,
   'Canadian Vegan handbags in apple leather, bamboo leather, recycled materials and raffia.', '#9c3b35'),
  ('finchberry', 'Finchberry', 'Beauty and Personal Care', 'fully_vegan', null, 'Waldo', 'FL', null, 'US', 'https://www.finchberry.com', null,
   'Handmade Vegan soaps and bath gifts from North Florida, from single bars to sampler tins.', '#5b7a3a'),
  ('bramble-pets', 'Bramble', 'Animal Care', 'fully_vegan', null, 'New York', 'NY', null, 'US', 'https://bramblepets.com', null,
   'Fresh plant-based dog food made with whole foods and delivered by subscription.', '#2f5d50'),
  ('conscious-step', 'Conscious Step', 'Clothing and Fashion', 'fully_vegan', null, null, null, null, 'US', 'https://consciousstep.com', null,
   'Organic cotton socks made in Fairtrade factories, each design giving to a cause. PETA approved Vegan.', '#2b4a6b'),
  ('saie', 'Saie', 'Beauty and Personal Care', 'vegan_options', null, null, null, null, 'US', 'https://saiehello.com', null,
   'Clean makeup and skin care sold as cruelty-free, with Vegan products like its Glossybounce lip gloss oil.', '#c47a7a'),
  ('phlur', 'Phlur', 'Beauty and Personal Care', 'vegan_options', null, null, null, null, 'US', 'https://phlur.com', null,
   'A fragrance house whose body mists, including the cream-scented Heavy Cream, are sold as Vegan and cruelty-free.', '#d8c2b0'),
  ('the-organic-skin-co', 'The Organic Skin Co.', 'Beauty and Personal Care', 'vegan_options', null, null, null, null, 'NZ', 'https://theorganicskinco.com', null,
   'Natural skin care and tinted face oils from New Zealand, with Vegan formulas.', '#c08a5a')
)
insert into listings (slug, name, category, specialty, description, location, website, status, initials, color, vegan_status, address_street, address_city,
  address_state, address_zip, address_country, instagram, ig_handle, communities, crawl_source, listed_at, details)
select s.slug, s.name, s.category, '', s.about, coalesce(nullif(nullif(concat_ws(', ', s.city, s.state), ''), s.state), 'Online'), s.website, 'approved',
  upper(left(regexp_replace(s.name, '^(The|A) ', ''), 1)), s.color, s.vegan_status, s.street, s.city, s.state, s.zip, s.country, s.instagram, s.instagram,
  array[]::text[], 'admin', now(),
  jsonb_build_object('added_by_hand', true, 'team_note', 'Featured in the Holiday Guide''s Gift Guide.', 'added_from', 'Holiday Gift Guide, 2026-11-10')
from src s
where not exists (select 1 from listings l where l.slug = s.slug);

-- Their shelves in Products (product_kinds), only where the listing has none yet.
update listings l set product_kinds = k.kinds, updated_at = now()
from (values ('renegade-foods', array['meat']), ('rebel-cheese', array['dairy']), ('id-eclair', array['baked']), ('pawj-california', array['shoes']),
  ('korean-vegan-beauty', array['skincare']), ('nhiar-chocolates', array['snacks']), ('no-49-handbags', array['bags']), ('finchberry', array['bodycare']),
  ('saie', array['makeup', 'skincare']), ('phlur', array['fragrance', 'bodycare']), ('the-organic-skin-co', array['skincare'])) k(slug, kinds)
where l.slug = k.slug and coalesce(cardinality(l.product_kinds), 0) = 0;
