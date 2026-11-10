-- ve-holiday-guide: the first gifts in the Christmas Gift Guide (Sean, 2026-11-10: "let's use the images... mention VegNews as the source...
-- not use their descriptions... If any of these things are Amazon, we'll use the Amazon link"). Sean's picks from VegNews's 2025 Holiday
-- Gift Guide (the soup dumplings left out at his word) and its 2024 list of 40 Vegan gift ideas, with its animal companion picks. Notes are
-- ours. Pictures are the products as VegNews showed them, copied into the repo (/public/guides/holiday/gifts/), credited to VegNews on
-- every card. Links: the brand's own page, and Amazon only where VegNews's own link resolved to an Amazon product (affiliate tags
-- removed). No prices: VegNews printed none and the stores could not be checked from the build session, so none is shown rather than a
-- guess. Brands with a Directory listing link to it (20261110_gift_guide_brands.sql). Safe to run twice (skips a title already there).
with src(sort, section, title, brand, slug, link, amazon, img, note, yr) as (values
  -- For the Food Lover
  (10, 'For the Food Lover', 'Plant-Based Charcuterie', 'Renegade Foods', 'renegade-foods', 'https://renegadefoods.com/collections/renegade-food', null, 'renegade',
   'Slow-cured Vegan salami for a holiday board that nobody will believe is plant-based.', 2025),
  (11, 'For the Food Lover', 'Vegan Cheese Gift Box', 'Rebel Cheese', 'rebel-cheese', 'https://rebelcheese.com/collections/boxes/products/holiday-entertainer-box', null, 'rebel',
   'A box of cultured Vegan cheese wheels from Austin, ready for the party table.', 2025),
  (12, 'For the Food Lover', 'Vegan Dubai Chocolate Bar', 'ID-Eclair', 'id-eclair', 'https://id-eclair.com/products/dubai-chocolate-vegan', null, 'ideclair',
   'The pistachio-filled chocolate bar everyone is talking about, made fully Vegan by a Pasadena patisserie.', 2025),
  (13, 'For the Food Lover', 'Gourmet Vegan Bonbons', 'Nhiar Chocolates', 'nhiar-chocolates', 'https://nhiar.com/', null, 'chocolates',
   'Hand-painted Vegan bonbons that look like jewels and disappear just as fast.', 2024),
  (14, 'For the Food Lover', 'Vegan Restaurant Gift Card', 'Veggie Grill', 'veggie-grill', 'https://www.veggiegrill.com/gift-cards/', null, 'veggiegrill',
   'A night out at a Vegan restaurant. Veggie Grill is one; any favorite in our Directory works too.', 2024),
  -- For the Home Cook and Coffee Lover
  (20, 'For the Home Cook and Coffee Lover', 'Forged Knife Block Set', 'Mercer Culinary', null, null, 'https://www.amazon.com/dp/B000IBU9FW', 'mercer',
   'A six-piece forged knife set in a glass block, for the cook who chops a lot of vegetables.', 2024),
  (21, 'For the Home Cook and Coffee Lover', 'NanoFoamer Milk Frother', 'Subminimal', null, null, 'https://www.amazon.com/dp/B0B56TBNQJ', 'nanofoamer',
   'A handheld frother that turns oat or soy milk into silky cafe microfoam at home.', 2024),
  (22, 'For the Home Cook and Coffee Lover', 'Hot and Cold Plant Milk Frother', 'Dreo', null, 'https://www.dreo.com/products/baristamaker-milk-frother', null, 'dreo',
   'Warms or chills plant milk into foam for lattes in the winter and cold foam in the summer.', 2025),
  (23, 'For the Home Cook and Coffee Lover', 'Temperature-Controlled Smart Mug', 'Ember', null, 'https://ember.com/products/ember-mug-2', null, 'ember',
   'Keeps coffee or tea at just the right heat, for the person whose cup always goes cold.', 2025),
  (24, 'For the Home Cook and Coffee Lover', 'Goldie Sourdough Starter Home', 'Sourhouse', null, 'https://sourhouse.co/products/goldie-by-sourhouse-cooling-puck-usa', null, 'goldie',
   'A warm little home that keeps a sourdough starter happy, for the baker on your list.', 2024),
  -- Beauty and Self Care
  (30, 'Beauty and Self Care', 'Cream-Scented Body Mist', 'Phlur', 'phlur', 'https://phlur.com/products/heavy-cream-body-mist', null, 'phlur',
   'Smells like warm vanilla cream, with no dairy anywhere near it.', 2025),
  (31, 'Beauty and Self Care', 'Tinted Face Oil', 'The Organic Skin Co.', 'the-organic-skin-co', 'https://theorganicskinco.com/products/the-only-glow-light', null, 'organicskin',
   'A light tint and a lot of moisture for winter skin, in light, medium and deep shades.', 2025),
  (32, 'Beauty and Self Care', 'Vegan Korean Skin Care', 'Korean Vegan Beauty', 'korean-vegan-beauty', 'https://koreanveganbeauty.com/', null, 'koreanvegan',
   'Gentle K-beauty skin care from The Korean Vegan herself, Joanne Lee Molinaro.', 2025),
  (33, 'Beauty and Self Care', 'Glossybounce Lip Gloss Oil', 'Saie', 'saie', null, 'https://www.amazon.com/dp/B0CG519N4B', 'saie',
   'A glossy, hydrating lip oil that makes an easy stocking stuffer.', 2024),
  (34, 'Beauty and Self Care', 'Best Seller Soap Sampler Tin', 'Finchberry', 'finchberry', 'https://www.finchberry.com/collections/bulk-sets/products/best-seller-sampler-tin', null, 'finchberry',
   'Eight handmade Vegan soaps in one tin, so they can find a favorite.', 2024),
  (35, 'Beauty and Self Care', 'Aromatherapy Shower Steamers', 'Lazy Spa Day', null, null, 'https://www.amazon.com/dp/B0CNZKCMJV', 'lazyspaday',
   'A spa morning in the shower: set one on the floor and let the steam do the rest.', 2024),
  (36, 'Beauty and Self Care', 'Essential Oil Candles', 'LOHN', null, 'https://shoplohn.com/collections/all-products', null, 'lohn',
   'Vegan candles in coconut and soy wax, scented with pure essential oils.', 2024),
  -- Cozy and Stylish
  (40, 'Cozy and Stylish', 'Cozy Vegan Boots', 'PAWJ California', 'pawj-california', 'https://pawjcalifornia.com/products/pawj-tall-boot-chestnut', null, 'pawj',
   'The cozy winter boot look, with no sheepskin.', 2025),
  (41, 'Cozy and Stylish', 'Vegan Handbag', 'No. 49 Handbags', 'no-49-handbags', 'https://no49handbags.com/', null, 'no49',
   'Everyday bags in apple and bamboo leather, recycled materials and raffia.', 2024),
  (42, 'Cozy and Stylish', 'Socks That Give Back', 'Conscious Step', 'conscious-step', 'https://consciousstep.com/', null, 'consciousstep',
   'Organic cotton socks, each pair giving to a cause, from animals to oceans.', 2024),
  (43, 'Cozy and Stylish', 'Faux Fur Throw Blanket', 'UnHide', null, null, 'https://www.amazon.com/stores/UnHide/page/F3F65341-0E76-4248-AAF7-662D18545B2F', 'unhide',
   'An oversized, very soft plant-based throw for movie nights on the couch.', 2024),
  -- For Your Animal Companion
  (50, 'For Your Animal Companion', 'Corduroy Dog Bed', 'FURB', null, 'https://www.furb.com/products/corduroy-dog-bed-cream', null, 'furb',
   'A plush corduroy bed with a cover that comes off for the wash.', 2024),
  (51, 'For Your Animal Companion', 'Retro Harness and Leash Set', 'Spark Paws', null, null, 'https://www.amazon.com/dp/B0CCSJ7JFF', 'sparkpaws',
   'A bright, no-pull harness and leash for walks with a little style.', 2024),
  (52, 'For Your Animal Companion', 'Plant-Based Fresh Dog Food', 'Bramble', 'bramble-pets', 'https://bramblepets.com/subscription-builder/', null, 'bramble',
   'Fresh plant-based meals for dogs, delivered to the door.', 2024),
  (53, 'For Your Animal Companion', '3-in-1 Dog Water Bottle', 'Pup Pak', null, 'https://puppak.co/products/pup-pak-dog-water-bottle-w-detachable-bowls', null, 'puppak',
   'Water, a water bowl and a food bowl in one bottle, for hikes and road trips.', 2024),
  (54, 'For Your Animal Companion', 'Washable Orthopedic Pet Bed', 'Newton', null, 'https://www.newtonbaby.com/products/pet-bed', null, 'newton',
   'A supportive bed for older pups that goes right in the washing machine.', 2024)
)
insert into ve_holiday_gifts (holiday_slug, section, title, brand, listing_id, link, amazon_link, image_url, note, source_name, source_url, sort, status)
select 'christmas', s.section, s.title, s.brand, (select id from listings l where l.slug = s.slug and l.status = 'approved'), s.link, s.amazon,
  '/public/guides/holiday/gifts/' || s.img || '.jpg', s.note,
  case s.yr when 2025 then 'VegNews Holiday Gift Guide 2025' else 'VegNews Vegan Gift Ideas 2024' end,
  case s.yr when 2025 then 'https://vegnews.com/editor-curated-gift-guide' else 'https://vegnews.com/vegnews-guide-vegan-gifts' end,
  s.sort, 'live'
from src s
where not exists (select 1 from ve_holiday_gifts g where g.holiday_slug = 'christmas' and g.title = s.title);
