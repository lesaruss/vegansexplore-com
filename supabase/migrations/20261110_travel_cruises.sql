-- Travel > Cruises (Sean, 2026-11-10: "find some vegan cruises and cruise liners that are strong vegan options... great to have when we're
-- reaching out to the tourism bureaus"; "go, add them and put it live"). Each checked on the operator's own site (research 2026-11-10).
-- Vegan cruises (100% Vegan): Holistic Holiday at Sea (moved from Events, Events kept as an extra), Vegan Travel, World Vegan Travel.
-- Cruise lines with a published Vegan menu on every ship (Vegan options): Royal Caribbean, Carnival, Princess, Holland America, Oceania.
-- Left out: aPlantBasedDiet.org's 2027 cruise (schedule TBD), Windstar (not on its own site), Virgin Voyages, Celebrity, Norwegian.
insert into listings (name, slug, category, status, website, vegan_status, tagline, specialty, description, location, address_country, crawl_source, tenant_id, business_status, details, listed_at)
select n, s, 'Cruises', 'approved', w, vs, t, t, d, 'Sails worldwide', 'US', 'admin', '00000000-0000-4000-a000-000000000002', 'OPERATIONAL',
  jsonb_build_object('added_by_hand', true, 'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note', 'text', 'Added 2026-11-10 to Travel > Cruises (Sean: "go, add them"). Source: ' || src))), now()
from (values
 ('Vegan Travel','vegan-travel-cruises','https://vegan-cruises.com','fully_vegan','100% Vegan river and ocean cruises',
  'Vegan Travel charters whole river ships and small ocean ships, so every voyage is 100% Vegan, from the meals on board to the shore days. Its sailings include river cruises in Europe and ocean trips further afield.','vegan-cruises.com, about our voyages'),
 ('World Vegan Travel','world-vegan-travel','https://worldvegantravel.com','fully_vegan','100% Vegan small-group trips, including sailings',
  'World Vegan Travel runs 100% Vegan small-group trips around the world, including a private-yacht sailing along the Croatian coast.','worldvegantravel.com, Vegan Croatia Odyssey'),
 ('Royal Caribbean','royal-caribbean','https://www.royalcaribbean.com','vegan_options','A 7-day Vegan menu on every ship',
  'Royal Caribbean offers a 7-day rotating Vegan menu on all of its ships, and Vegan dishes on request in the Main Dining Room.','royalcaribbean.com FAQ, Vegan menus in the Main Dining Room'),
 ('Princess Cruises','princess-cruises','https://www.princess.com','vegan_options','Vegan menus across the fleet',
  'Princess Cruises has Vegan menus across its fleet, which you can ask for before your cruise or on board.','princess.com news release, October 2023'),
 ('Holland America Line','holland-america-line','https://www.hollandamerica.com','vegan_options','A Vegan and vegetarian menu in the Dining Room',
  'Holland America Line offers a dedicated Vegan and vegetarian menu in the main Dining Room. Ask for it early in your cruise.','hollandamerica.com, Vegan and vegetarian dining'),
 ('Oceania Cruises','oceania-cruises','https://www.oceaniacruises.com','vegan_options','Plant-based dishes on every ship',
  'Oceania Cruises serves a wide choice of plant-based dishes in The Grand Dining Room on all of its ships.','oceaniacruises.com, wellness')
) v(n, s, w, vs, t, d, src)
where not exists (select 1 from listings l where l.slug = v.s);

update listings set name='Carnival Cruise Line', category='Cruises', status='approved', website='https://www.carnival.com', vegan_status='vegan_options',
  tagline='A separate Vegan menu on every ship', specialty='A separate Vegan menu on every ship', location='Sails worldwide', business_status='OPERATIONAL', listed_at=coalesce(listed_at, now()),
  description='Carnival Cruise Line offers a separate Vegan menu on all of its ships, except those sailing in Australia.'
where slug='carnival';

update listings set category='Cruises', extra_categories = array['Events'], vegan_status='fully_vegan',
  tagline='A Vegan wellness cruise with talks and classes', specialty='A Vegan wellness cruise with talks and classes',
  description='Holistic Holiday at Sea is a Vegan wellness group cruise, sailing from Miami and beyond: a 100% Vegan whole-food menu on board, with talks and classes alongside the ports of call.'
where slug='holistic-holiday-at-sea-miami';

-- Checked on the live site (Sean opened the network to holisticholidayatsea.com, 2026-11-10): "The Original Vegan Cruise", a 100% whole-foods,
-- plant-based menu, over 100 classes led by 30+ experts, Miami (March 2027) and Seattle to Alaska (August 2027) on MSC Poesia.
update listings set tagline='The Original Vegan Cruise', specialty='The Original Vegan Cruise',
 description='Holistic Holiday at Sea calls itself the Original Vegan Cruise: a Vegan wellness group cruise from Miami to the Caribbean and Latin America, and from Seattle to Alaska. On board, a 100% whole-foods, plant-based menu and more than 100 classes from 30-plus experts, from lectures and cooking classes to yoga and fitness.'
where slug='holistic-holiday-at-sea-miami';
