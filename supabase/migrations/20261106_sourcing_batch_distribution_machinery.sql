-- ve-vegan-sourcing-guide: distributors, machinery and the Buy or make gaps, batch 1 (Logan, 2026-11-06). No Google calls.
-- Bios from web search results (company sites are unreachable from our build session); every bio_source says which.
-- A fifth label, equipment: a machine maker is not a food company, so no Vegan claim fits it. The label says so plainly.
-- Kinds are worded so Buy or make's patterns in ve-sourcing match only what each company really sells
-- (Kite Hill's whipped ricotta is stored as "ricotta alternative", or it would show under Whipped cream). Safe to run twice.

alter table ve_suppliers drop constraint if exists ve_suppliers_label_check;
alter table ve_suppliers add constraint ve_suppliers_label_check
  check (label in ('peta_approved','fully_vegan','offers_options','plant_material','equipment'));

-- Clark Distributing sat under ready-made food; it is a distributor.
update ve_suppliers set domain = 'distribution' where slug = 'clark-distributing-co' and domain = 'food_drink';

insert into ve_suppliers (slug, name, website, domain, kinds, label, bio, bio_source, source, country, checked_at)
values
 -- Buy or make: ricotta, whipped cream, buttermilk, evaporated milk, condensed milk
 ('kite-hill', 'Kite Hill', 'https://kite-hill.com', 'food_drink', '{ricotta alternative,dairy-free tortellini}', 'fully_vegan',
  'Kite Hill makes cultured dairy alternatives from almond milk, among them a ricotta alternative that the company says swaps 1:1 for dairy ricotta. It reaches restaurant kitchens through Sysco Marketplace (fulfilled by Dot Foods) and UNFI. Every product contains almond.',
  'web search 2026-11-06 (company site unreachable from our build session): kite-hill.com product page, Sysco Marketplace and UNFI co-op listings as returned by search', 'web-search-2026-11', 'US', now()),
 ('natures-charm', 'Nature''s Charm', null, 'food_drink', '{sweetened condensed coconut milk,evaporated coconut milk}', 'offers_options',
  'Nature''s Charm makes canned coconut milk products in Thailand, including a sweetened condensed coconut milk and an evaporated coconut milk that retailers list as dairy free and Vegan. Check the label on each can: listings show more than one sweetener.',
  'web search 2026-11-06: retailer listings (Giant Food, PlantX, Well.ca); no company site confirmed, so no website is listed', 'web-search-2026-11', 'TH', now()),
 ('mill-it', 'Mill It', null, 'food_drink', '{plant-based buttermilk,buttermilk dressings}', 'fully_vegan',
  'Mill It is a family-owned company in Bakersfield, California, that ferments millet and sorghum into a plant-based buttermilk sold in 32 oz bottles, plus ranch, Italian and Thousand Island dressings made from it.',
  'web search 2026-11-06: VegNews, vegconomist, The Spoon (2021 to 2022) and a QFC listing; no 2026 news found, so confirm they are trading before ordering', 'web-search-2026-11', 'US', now()),
 ('richs', 'Rich Products (Rich''s)', 'https://www.richs.com', 'food_drink', '{coconut whipped topping,plant-based heavy cooking cream}', 'offers_options',
  'Rich''s is a foodservice supplier that has made non-dairy whipped topping since 1945. Its Café Whip is made with coconut milk and its Plant-Based Heavy Cooking Crème comes in 8 lb cartons. Rich''s also sells dairy products, so check each item.',
  'web search 2026-11-06: WebstaurantStore listing, Perishable News and Refrigerated & Frozen Foods coverage', 'web-search-2026-11', 'US', now()),
 ('violife', 'Violife (Flora Food Group)', 'https://www.violife.com', 'food_drink', '{vegan cheese,vegan heavy whipping cream,plant butter}', 'fully_vegan',
  'Violife says it has made only Vegan foods since the 1990s. Its foodservice line, now sold as Flora Professional, includes cheese slices and blocks, plant butter and a heavy whipping cream alternative in 1 and 10 liter packs for bakeries and cafés.',
  'web search 2026-11-06: violife.com our story, Bidfood (Flora Professional), WebstaurantStore and Foodservice Direct listings', 'web-search-2026-11', 'GR', now()),

 -- Distributors
 ('vegan-supply', 'Vegan Supply Wholesale', 'https://wholesale.vegansupply.ca', 'distribution', '{wholesale distribution,foodservice bulk}', 'fully_vegan',
  'Vegan Supply Wholesale is a Vegan-owned distributor in Canada that carries only Vegan products, including bulk foodservice packs for restaurants, cafés and bars. Brands apply by sending sell sheets and samples.',
  'web search 2026-11-06: wholesale.vegansupply.ca about, brands and join pages as returned by search', 'web-search-2026-11', 'CA', now()),
 ('gtfo-its-vegan', 'GTFO It''s Vegan', null, 'distribution', '{wholesale distribution,online vegan marketplace}', 'fully_vegan',
  'GTFO It''s Vegan is an online retailer and wholesaler of Vegan foods that ships frozen, refrigerated and shelf-stable products from Orange County, California, to restaurants, food trucks and shops. Its own sashimi line is carried by KeHE and Sysco.',
  'web search 2026-11-06: vegconomist, Refrigerated & Frozen Foods, PR Newswire (2020 to 2022); no 2025 or 2026 news found, so confirm before ordering', 'web-search-2026-11', 'US', now()),
 ('feesers', 'Feeser''s Food Distributors', 'https://www.feesers.com', 'distribution', '{foodservice distribution,vegan and vegetarian products}', 'offers_options',
  'Feeser''s is a foodservice distributor in Central Pennsylvania serving businesses of every size, with a range of Vegan and vegetarian products alongside its full line.',
  'web search 2026-11-06: feesers.com as returned by search', 'web-search-2026-11', 'US', now()),

 -- Machinery
 ('yung-soon-lih', 'Yung Soon Lih Food Machine', null, 'machinery', '{tofu production lines,soy milk equipment}', 'equipment',
  'Yung Soon Lih Food Machine in Taiwan builds soy milk, tofu and soybean processing equipment, from an instant tofu machine made for small producers to complete turnkey production lines.',
  'web search 2026-11-06: CDTI trade document (2025) and supplier directory listings', 'web-search-2026-11', 'TW', now()),
 ('takai-tofu-soymilk-equipment', 'Takai Tofu & Soymilk Equipment', null, 'machinery', '{tofu equipment,soy milk equipment}', 'equipment',
  'Takai Manufacturing in Ishikawa, Japan, makes machinery for producing tofu and soy milk and has done so for about a century.',
  'web search 2026-11-06: CB Insights company profiles (its founding year differs between sources, 1917 or 1923)', 'web-search-2026-11', 'JP', now()),
 ('goodnature', 'Goodnature', 'https://www.goodnature.com', 'machinery', '{cold press juicers,nut milk presses}', 'equipment',
  'Goodnature makes cold press equipment, from the countertop X-1 Mini to the X-6, which holds six press bags. The company publishes how to press nut milk on it and names nut milk producers among its users.',
  'web search 2026-11-06: goodnature.com knowledge base and blog as returned by search', 'web-search-2026-11', 'US', now()),
 ('buhler-extrusion', 'Bühler (plant-based extrusion)', 'https://www.buhlergroup.com', 'machinery', '{high moisture extrusion,plant-based meat lines}', 'equipment',
  'Bühler builds extrusion lines for plant-based meat, from the PolyCool 50 cooling die for product development to the PolyCool 1000 for industrial runs, with lab services and training.',
  'web search 2026-11-06: buhlergroup.com media release (PolyCool 1000), World Grain, vegconomist', 'web-search-2026-11', 'CH', now())
on conflict (slug) do nothing;
