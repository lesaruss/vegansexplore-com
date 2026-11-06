-- ve-vegan-sourcing-guide: batch 2, a regional distributor and plant-milk machinery (Logan, 2026-11-06). No Google calls.
-- Sean kept the Equipment label ("Keep Equipment, go with your defaults"). Bios from web search results; bio_source says which. Safe to run twice.
insert into ve_suppliers (slug, name, website, domain, kinds, label, bio, bio_source, source, country, checked_at)
values
 ('earthly-gourmet', 'Earthly Gourmet', 'https://earthlygourmet.com', 'distribution', '{wholesale distribution,foodservice}', 'fully_vegan',
  'Earthly Gourmet is a Portland, Oregon, wholesale distributor started in 2006 that carries only plant-based products, many from small producers who cannot distribute themselves. It sells to restaurants, bakeries, cafés, food carts and natural food stores in the Pacific Northwest.',
  'web search 2026-11-06: earthlygourmet.com product criteria page (100% plant-based from suppliers), People''s Food Co-op, FoodCo Directory (2021); service area differs between sources, so confirm before ordering', 'web-search-2026-11', 'US', now()),
 ('unfi', 'UNFI (United Natural Foods)', 'https://www.unfi.com', 'distribution', '{natural foods distribution,foodservice}', 'offers_options',
  'UNFI is a large natural and organic food distributor in North America. It carries plant-based brands such as Kite Hill and The Very Good Food Company alongside conventional products, so check each item.',
  'web search 2026-11-06: UNFI co-op listings for Kite Hill, Deli Market News on the Very Good Food Company partnership', 'web-search-2026-11', 'US', now()),
 ('prosoya', 'ProSoya', 'https://prosoya.com', 'machinery', '{soy milk equipment,oat milk lines,almond milk equipment}', 'equipment',
  'ProSoya designs and builds equipment for plant-based milks, from soy milk machines of 1,000 liters an hour to complete oat milk lines with milling, enzyming, bran separation and sterilization. It has a demonstration facility in Ottawa.',
  'web search 2026-11-06: prosoya.com product pages, Protein Industries Canada project page; capacity figures are the company''s own', 'web-search-2026-11', 'CA', now()),
 ('the-oater', 'The Oater', null, 'machinery', '{oat milk machines}', 'equipment',
  'The Oater is a startup in Cologne, Germany, that makes a compact machine to make fresh oat milk on site, aimed at cafés. It offers the machine with an ingredient subscription paid by the liter.',
  'web search 2026-11-06: EU-Startups (2023), CORDIS project page, CB Insights; no company site confirmed, pilots in four cafés only, so confirm it is available before ordering', 'web-search-2026-11', 'DE', now())
on conflict (slug) do nothing;
