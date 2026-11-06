-- ve-vegan-sourcing-guide: batch 3, pasteurizing, high-pressure processing, tempeh fermentation and a nationwide plant-based wholesaler (Logan, 2026-11-06). No Google calls.
-- Bios from web search results (company sites are unreachable from the build session); bio_source says which. Machine makers get the equipment label. Safe to run twice.
insert into ve_suppliers (slug, name, website, domain, kinds, label, bio, bio_source, source, country, checked_at)
values
 ('hiperbaric', 'Hiperbaric', 'https://www.hiperbaric.com', 'machinery', '{high pressure processing equipment,cold pressed juice preservation}', 'equipment',
  'Hiperbaric is a Spanish maker of high pressure processing (HPP) machines, used to keep cold-pressed juice, plant milks and dips fresh longer without heat. Small producers often start with an HPP toller that runs its machines, and Hiperbaric keeps a list of tolling providers.',
  'web search 2026-11-06: hiperbaric.com articles on tolling services, Food Processing (2016), PR Newswire on Just Made''s Hiperbaric system; pricing not public, so confirm before ordering', 'web-search-2026-11', 'ES', now()),
 ('pro-engineering-manufacturing', 'PRO Engineering / Manufacturing', 'https://prowm.com', 'machinery', '{batch pasteurizers,tunnel pasteurizers,bottled beverage pasteurizing}', 'equipment',
  'PRO Engineering / Manufacturing in Milwaukee, Wisconsin, builds batch and tunnel pasteurizers in small, medium and large sizes for bottled and canned drinks, including compact single-temperature batch units for small producers.',
  'web search 2026-11-06: the company''s own sponsored articles and audio posts, nombase company listing; capacity figures are marketing, so confirm specs before ordering', 'web-search-2026-11', 'US', now()),
 ('tempeh-today', 'Tempeh Today (Schouten Europe)', null, 'machinery', '{tempeh fermentation units,small-scale tempeh production systems}', 'equipment',
  'Tempeh Today is a small-scale tempeh production system from Schouten Europe in the Netherlands: a standard fermentation unit with training, support and quality monitoring. Its rollout has been in India, with Marel India supplying equipment.',
  'web search 2026-11-06: vegconomist (2021, 2023), VegNews, Food Ingredients First; reports cover India only and the current unit count is not published, so confirm it is offered where you are before ordering', 'web-search-2026-11', 'NL', now()),
 ('vedgeco', 'VEDGEco', 'https://vedgeco.com', 'distribution', '{plant-based wholesale,foodservice,online wholesale ordering}', 'fully_vegan',
  'VEDGEco is a wholesaler of only plant-based foods, started in Hawaii, that sells bulk meat, cheese, seafood, egg and butter alternatives to restaurants and independent grocers online, with warehouses reported in Hawaii, Northern California and Georgia. It was bought by the Vancouver company Vejii in 2022.',
  'web search 2026-11-06: vegconomist (2020, 2021), PR Newswire on the Vejii purchase (2021), trendwatching (April 2025); little recent news, so confirm it is still shipping before ordering', 'web-search-2026-11', 'US', now())
on conflict (slug) do nothing;
