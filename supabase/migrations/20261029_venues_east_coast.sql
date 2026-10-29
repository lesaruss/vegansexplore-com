-- The East Coast venues (Sean, 2026-10-29: "Let's do Central Florida... Atlanta... Philly... New York"). Researched from published
-- sources 2024 to 2026 (venue pages, team sites, PETA, VegNews, Veggl, local news), read through search because those sites are not
-- reachable from the build session; anything known only from before 2024 was left out, and anything unclear is 'ask'. Each item
-- names its sources. Members confirm from inside. Locations come from Google (ve-venues locate) after this runs; maps wait on the
-- seating charts. Safe to run twice: venues are matched by slug and their stands are replaced only when the venue is new.

insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$camping-world-stadium$q$, $q$Camping World Stadium$q$, $q$stadium$q$, $q$Orlando$q$, $q$FL$q$, $q$central-florida$q$, array[$q$Citrus Bowl$q$,$q$Pop-Tarts Bowl$q$]::text[], 400, nullif($q$Outside food and beverages are not permitted inside the stadium; exceptions can be made for medical purposes.$q$, ''), nullif($q$https://www.campingworldstadium.com/plan-your-visit/faq/$q$, ''), false, 10, '/public/guides/venues/camping-world-stadium.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$kia-center$q$, $q$Kia Center$q$, $q$arena$q$, $q$Orlando$q$, $q$FL$q$, $q$central-florida$q$, array[$q$Orlando Magic$q$,$q$Orlando Solar Bears$q$]::text[], 250, nullif($q$Outside food and beverages are not permitted inside the arena; exceptions may be made for medical purposes.$q$, ''), nullif($q$https://kiacenter.com/plan-your-visit/faqs$q$, ''), false, 11, '/public/guides/venues/kia-center.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$King Bao (Orlando Table)$q$, $q$Orlando Table, near Section 104 (not confirmed)$q$, $q$concourse$q$, '{}'::text[], 1 from public.ve_venues v
where v.slug = $q$kia-center$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$King Bao (Orlando Table)$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Veganville$q$, $q$Bao with crispy fried tofu. Named Veganville; ask whether the sauce is Vegan.$q$, $q$ask$q$, $q$[{"label": "Kia Center, Orlando Table", "url": "https://www.kiacenter.com/plan-your-visit/restaurants-bars/orlando-table/", "date": "2024-10"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$kia-center$q$ and sp.name = $q$King Bao (Orlando Table)$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Veganville$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Suite catering$q$, $q$Suites only$q$, $q$suites$q$, '{}'::text[], 2 from public.ve_venues v
where v.slug = $q$kia-center$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Suite catering$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Char-Grilled Plant Based Burger$q$, $q$Impossible plant-based burger; ask about the bun and toppings.$q$, $q$ask$q$, $q$[{"label": "Kia Center 2025-26 suite menu", "url": "https://info.suitehop.com/hubfs/Catering/2025/Arenas/Kia%20Center/2025-26%20Kia%20Center%20Suite%20Menu.pdf", "date": "2025"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$kia-center$q$ and sp.name = $q$Suite catering$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Char-Grilled Plant Based Burger$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$interandco-stadium$q$, $q$Inter&Co Stadium$q$, $q$stadium$q$, $q$Orlando$q$, $q$FL$q$, $q$central-florida$q$, array[$q$Orlando City SC$q$,$q$Orlando Pride$q$]::text[], 400, nullif($q$$q$, ''), nullif($q$$q$, ''), false, 12, '/public/guides/venues/interandco-stadium.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$raymond-james-stadium$q$, $q$Raymond James Stadium$q$, $q$stadium$q$, $q$Tampa$q$, $q$FL$q$, $q$central-florida$q$, array[$q$Tampa Bay Buccaneers$q$]::text[], 400, nullif($q$Food and drinks are on the stadium's list of prohibited items; tell security about allergy-related food.$q$, ''), nullif($q$https://raymondjamesstadium.com/stadium-policies$q$, ''), false, 13, '/public/guides/venues/raymond-james-stadium.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$The Healthy Spot$q$, $q$Section 140$q$, $q$concourse$q$, array[$q$140$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$raymond-james-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$The Healthy Spot$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Power Salad$q$, $q$Salad with plant protein. Ask which items are Vegan.$q$, $q$ask$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/raymond-james-stadium-vegan-options-tampa-buccaneers/", "date": "2025"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$raymond-james-stadium$q$ and sp.name = $q$The Healthy Spot$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Power Salad$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Hummus and dolmades platter$q$, $q$Hummus with stuffed grape leaves.$q$, $q$ask$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/raymond-james-stadium-vegan-options-tampa-buccaneers/", "date": "2025"}]$q$::jsonb, 2
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$raymond-james-stadium$q$ and sp.name = $q$The Healthy Spot$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Hummus and dolmades platter$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Hot Healthy Bowl$q$, $q$Hot bowl with plant-based chicken.$q$, $q$ask$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/raymond-james-stadium-vegan-options-tampa-buccaneers/", "date": "2025"}]$q$::jsonb, 3
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$raymond-james-stadium$q$ and sp.name = $q$The Healthy Spot$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Hot Healthy Bowl$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$benchmark-international-arena$q$, $q$Benchmark International Arena$q$, $q$arena$q$, $q$Tampa$q$, $q$FL$q$, $q$central-florida$q$, array[$q$Tampa Bay Lightning$q$]::text[], 250, nullif($q$No outside food or beverages except for medical purposes.$q$, ''), nullif($q$https://www.benchmarkintlarena.com/arena-info/a-z-faq$q$, ''), false, 14, '/public/guides/venues/benchmark-international-arena.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Loli's Tacos$q$, $q$Section 320$q$, $q$concourse$q$, array[$q$320$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$benchmark-international-arena$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Loli's Tacos$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Vegan tacos$q$, $q$The arena tags this stand Vegan but names no Vegan taco; ask which ones are.$q$, $q$ask$q$, $q$[{"label": "Benchmark International Arena, Dining", "url": "https://www.benchmarkintlarena.com/arena-dining/", "date": "2026-10"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$benchmark-international-arena$q$ and sp.name = $q$Loli's Tacos$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Vegan tacos$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Bull Market$q$, $q$Section 311$q$, $q$concourse$q$, array[$q$311$q$]::text[], 2 from public.ve_venues v
where v.slug = $q$benchmark-international-arena$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Bull Market$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Vegan bowls and sandwiches$q$, $q$The arena tags this stand Vegan but names no Vegan item; ask which ones are.$q$, $q$ask$q$, $q$[{"label": "Benchmark International Arena, Dining", "url": "https://www.benchmarkintlarena.com/arena-dining/", "date": "2026-10"}, {"label": "Stadibites", "url": "https://stadibites.com/foods/benchmark-arena-bull-market-sandwiches-bowls/", "date": "2026-10"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$benchmark-international-arena$q$ and sp.name = $q$Bull Market$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Vegan bowls and sandwiches$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$mercedes-benz-stadium$q$, $q$Mercedes-Benz Stadium$q$, $q$stadium$q$, $q$Atlanta$q$, $q$GA$q$, $q$atlanta$q$, array[$q$Atlanta Falcons$q$,$q$Atlanta United FC$q$]::text[], 400, nullif($q$No outside food or drink, except one factory-sealed 16.9 oz bottle of water per person; clear bags only.$q$, ''), nullif($q$https://www.aaa.com/tripcanvas/attraction/mercedes-benz-stadium-VA100881$q$, ''), false, 20, '/public/guides/venues/mercedes-benz-stadium.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$The Mac Shac$q$, $q$Sections 122, 238 and 320$q$, $q$concourse$q$, array[$q$122$q$,$q$238$q$,$q$320$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$mercedes-benz-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$The Mac Shac$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Vegan Mac & Cheese$q$, $q$Dairy-free mac and cheese; add jalapenos, scallions and hot sauce.$q$, $q$vegan$q$, $q$[{"label": "PETA, Vegan Guide to the 2026 World Cup", "url": "https://www.peta.org/lifestyle/food/vegan-guide-2026-world-cup/", "date": "2026"}, {"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/vegan-at-mercedes-benz-stadium-atlanta-falcons-atlanta-united/", "date": "2025"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$mercedes-benz-stadium$q$ and sp.name = $q$The Mac Shac$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Vegan Mac & Cheese$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$BBQ & Mac$q$, $q$Field level$q$, $q$concourse$q$, '{}'::text[], 2 from public.ve_venues v
where v.slug = $q$mercedes-benz-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$BBQ & Mac$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Vegan Hot Dog$q$, $q$Plant-based hot dog; also listed at The Mac Shac.$q$, $q$ask$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/vegan-at-mercedes-benz-stadium-atlanta-falcons-atlanta-united/", "date": "2025"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$mercedes-benz-stadium$q$ and sp.name = $q$BBQ & Mac$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Vegan Hot Dog$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$ATL Fan Fare$q$, $q$100, 200 and 300 concourses$q$, $q$concourse$q$, '{}'::text[], 3 from public.ve_venues v
where v.slug = $q$mercedes-benz-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$ATL Fan Fare$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Vegan Smokehouse Sausage$q$, $q$Vegan sausage with corn salsa, Vegan BBQ aioli and dairy-free parmesan. One guide says it left the menu in 2025.$q$, $q$ask$q$, $q$[{"label": "PETA, Vegan Guide to the 2026 World Cup", "url": "https://www.peta.org/lifestyle/food/vegan-guide-2026-world-cup/", "date": "2026"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$mercedes-benz-stadium$q$ and sp.name = $q$ATL Fan Fare$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Vegan Smokehouse Sausage$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Suite catering$q$, $q$Suites only$q$, $q$suites$q$, '{}'::text[], 4 from public.ve_venues v
where v.slug = $q$mercedes-benz-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Suite catering$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Plant-Based Nachos$q$, $q$Vegan cheese sauce, pico de gallo, Vegan sour cream, guacamole and plant-based taco meat.$q$, $q$vegan$q$, $q$[{"label": "Mercedes-Benz Stadium suite catering menu", "url": "https://www.suiteexperiencegroup.com/resources/Mercedes-Benz_Stadium/Mercedes-Benz_Stadium_Primary_catering_menu_2025-02-06.pdf", "date": "2025-02"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$mercedes-benz-stadium$q$ and sp.name = $q$Suite catering$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Plant-Based Nachos$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$state-farm-arena$q$, $q$State Farm Arena$q$, $q$arena$q$, $q$Atlanta$q$, $q$GA$q$, $q$atlanta$q$, array[$q$Atlanta Hawks$q$,$q$Atlanta Dream$q$]::text[], 250, nullif($q$Outside food and beverages are not allowed, except for medical reasons.$q$, ''), nullif($q$https://www.axs.com/venues/101172$q$, ''), false, 21, '/public/guides/venues/state-farm-arena.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Black Bean Burger$q$, $q$Sections 118, 211 and 221$q$, $q$concourse$q$, array[$q$118$q$,$q$211$q$,$q$221$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$state-farm-arena$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Black Bean Burger$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Black Bean Burger$q$, $q$Black bean, pepper and onion patty with cilantro aioli on a challah bun; the bun and aioli may not be Vegan, so ask.$q$, $q$ask$q$, $q$[{"label": "State Farm Arena", "url": "https://www.statefarmarena.com/news/detail/hawks-and-state-farm-arena-announce-new-food-options-integrating-the-best-aspects-of-southern-cuisine-and-atlantas-vibrant-culture", "date": "2025-10"}, {"label": "Atlanta News First", "url": "https://www.atlantanewsfirst.com/2025/10/23/atlanta-hawks-state-farm-arena-announce-new-food-options", "date": "2025-10"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$state-farm-arena$q$ and sp.name = $q$Black Bean Burger$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Black Bean Burger$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$truist-park$q$, $q$Truist Park$q$, $q$stadium$q$, $q$Atlanta$q$, $q$GA$q$, $q$atlanta$q$, array[$q$Atlanta Braves$q$]::text[], 400, nullif($q$Outside food is allowed if it fits in one clear, gallon-size plastic bag, plus one sealed plastic bottle of water, per ticket.$q$, ''), nullif($q$https://www.mlb.com/braves/ballpark/family-guide$q$, ''), false, 22, '/public/guides/venues/truist-park.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Slutty Vegan$q$, $q$Section 130, by the third base gate (reported closed in June 2025)$q$, $q$concourse$q$, array[$q$130$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$truist-park$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Slutty Vegan$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Hollywood Hooker$q$, $q$Vegan chopped Philly with peppers, onions and dairy-free provolone. The kiosk was reported closed in June 2025; check it is open.$q$, $q$ask$q$, $q$[{"label": "PETA", "url": "https://www.peta.org/media/news-releases/truist-park-scores-stadium-nabs-spot-on-list-of-most-vegan-friendly-ballparks-in-north-america/", "date": "2024-08"}, {"label": "HappyCow (closure report)", "url": "https://www.happycow.net/reviews/slutty-vegan-atlanta-356115", "date": "2025-06"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$truist-park$q$ and sp.name = $q$Slutty Vegan$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Hollywood Hooker$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$lincoln-financial-field$q$, $q$Lincoln Financial Field$q$, $q$stadium$q$, $q$Philadelphia$q$, $q$PA$q$, $q$philadelphia$q$, array[$q$Philadelphia Eagles$q$,$q$Temple Owls football$q$]::text[], 400, nullif($q$Outside food is allowed if it is wrapped in clear plastic for inspection; outside beverages are not allowed (an empty plastic water bottle may be brought to refill).$q$, ''), nullif($q$https://veggl.com/stadium-arena-cheat-sheets/vegan-at-lincoln-financial-field-philadelphia-eagles/$q$, ''), false, 30, '/public/guides/venues/lincoln-financial-field.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Jackass Burrito's$q$, $q$Sections C38, C23 (club level)$q$, $q$club$q$, array[$q$C38$q$,$q$C23$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$lincoln-financial-field$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Jackass Burrito's$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Vegan Burrito$q$, $q$Brown rice and farro, black beans, mushrooms and kale, crispy quinoa, salsa roja, corn and poblano salsa, guacamole, flour tortilla.$q$, $q$vegan$q$, $q$[{"label": "Lincoln Financial Field, Food and Concessions", "url": "https://www.lincolnfinancialfield.com/food-and-concessions/", "date": "2026-10"}, {"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/vegan-at-lincoln-financial-field-philadelphia-eagles/", "date": "2025-09"}, {"label": "The Philadelphia Inquirer", "url": "https://www.inquirer.com/food/best-food-drinks-lincoln-financial-field-eagles-20241019.html", "date": "2024-10"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$lincoln-financial-field$q$ and sp.name = $q$Jackass Burrito's$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Vegan Burrito$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Chips and guacamole$q$, $q$Veggl says the chips are not confirmed Vegan; ask about the frying oil and shared fryers.$q$, $q$ask$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/vegan-at-lincoln-financial-field-philadelphia-eagles/", "date": "2025-09"}]$q$::jsonb, 2
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$lincoln-financial-field$q$ and sp.name = $q$Jackass Burrito's$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Chips and guacamole$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Vegetarian burgers$q$, $q$Section 110 (one guide says 120)$q$, $q$concourse$q$, array[$q$110$q$]::text[], 2 from public.ve_venues v
where v.slug = $q$lincoln-financial-field$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Vegetarian burgers$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Vegetarian burger$q$, $q$Listed as vegetarian only; the patty, bun and cheese are not confirmed Vegan.$q$, $q$ask$q$, $q$[{"label": "The Philadelphia Inquirer", "url": "https://www.inquirer.com/eagles/eagles-lincoln-financial-field-food-guide-2025-20250903.html", "date": "2025-09"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$lincoln-financial-field$q$ and sp.name = $q$Vegetarian burgers$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Vegetarian burger$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$citizens-bank-park$q$, $q$Citizens Bank Park$q$, $q$stadium$q$, $q$Philadelphia$q$, $q$PA$q$, $q$philadelphia$q$, array[$q$Philadelphia Phillies$q$]::text[], 400, nullif($q$Fans may bring in food if it is sealed and fits inside a stadium-approved bag (12 x 6 x 12 inches); glass, cans, alcohol and hard-sided coolers are not allowed.$q$, ''), nullif($q$https://www.inquirer.com/food/a/citizens-bank-park-food-policy-phillies-20260808.html$q$, ''), false, 31, '/public/guides/venues/citizens-bank-park.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Greens & Grains$q$, $q$Section 125, behind home plate, in front of Shake Shack$q$, $q$concourse$q$, array[$q$125$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$citizens-bank-park$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Greens & Grains$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Chipotle Black Bean Burger$q$, $q$Chipotle black bean burger with Vegan cheddar, house-made burger sauce and veggies.$q$, $q$vegan$q$, $q$[{"label": "MLB.com, Phillies and Aramark", "url": "https://mlb.com/news/press-release-phillies-and-aramark-sports-entertainment-reveal-what-s-new-in-food-fan-gear-and-the-gameday-experience-for-the-2025-season-at-citizens-bank-park", "date": "2025-03"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citizens-bank-park$q$ and sp.name = $q$Greens & Grains$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Chipotle Black Bean Burger$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Veggie Burger with Special Sauce$q$, $q$Veggie and grain patty with melted Vegan cheez, lettuce, tomato, onion and special sauce.$q$, $q$vegan$q$, $q$[{"label": "Greens & Grains", "url": "https://www.greensandgrains.com/location/citizens-bank-park-pa/", "date": "2026-10"}]$q$::jsonb, 2
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citizens-bank-park$q$ and sp.name = $q$Greens & Grains$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Veggie Burger with Special Sauce$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Buffalo Chk'n Ranch Hoagie$q$, $q$Buffalo plant-based chicken hoagie with ranch.$q$, $q$vegan$q$, $q$[{"label": "Greens & Grains", "url": "https://www.greensandgrains.com/location/citizens-bank-park-pa/", "date": "2026-10"}, {"label": "PETA", "url": "https://www.peta.org/media/news-releases/citizens-bank-park-scores-stadium-nabs-spot-on-list-of-most-vegan-friendly-ballparks-in-north-america/", "date": "2024-06"}]$q$::jsonb, 3
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citizens-bank-park$q$ and sp.name = $q$Greens & Grains$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Buffalo Chk'n Ranch Hoagie$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Gyro Pita$q$, $q$Seitan gyro with Vegan tzatziki in a pita.$q$, $q$vegan$q$, $q$[{"label": "Greens & Grains", "url": "https://www.greensandgrains.com/location/citizens-bank-park-pa/", "date": "2026-10"}, {"label": "The Infatuation", "url": "https://www.theinfatuation.com/philadelphia/guides/phillies-stadium", "date": "2025-04"}]$q$::jsonb, 4
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citizens-bank-park$q$ and sp.name = $q$Greens & Grains$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Gyro Pita$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Vegan Ballpark Hot Dog$q$, $q$Plant-based hot dog on a toasted bun.$q$, $q$vegan$q$, $q$[{"label": "Greens & Grains", "url": "https://www.greensandgrains.com/location/citizens-bank-park-pa/", "date": "2026-10"}]$q$::jsonb, 5
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citizens-bank-park$q$ and sp.name = $q$Greens & Grains$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Vegan Ballpark Hot Dog$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Campo's$q$, $q$Ashburn Alley$q$, $q$concourse$q$, '{}'::text[], 2 from public.ve_venues v
where v.slug = $q$citizens-bank-park$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Campo's$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Vegan cheesesteak$q$, $q$Impossible meat with Daiya cheese; mushrooms, onions and peppers optional.$q$, $q$vegan$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/vegan-at-citizens-bank-park-philadelphia-phillies/", "date": "2025-04"}, {"label": "PETA", "url": "https://www.peta.org/features/vegan-friendly-ballparks-2024/", "date": "2024-06"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citizens-bank-park$q$ and sp.name = $q$Campo's$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Vegan cheesesteak$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Chickie's & Pete's$q$, $q$Ask for the nearest stand$q$, $q$concourse$q$, '{}'::text[], 3 from public.ve_venues v
where v.slug = $q$citizens-bank-park$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Chickie's & Pete's$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Crabfries, no cheese sauce$q$, $q$Order without the cheese sauce; the seasoning and fryer are not confirmed.$q$, $q$ask$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/vegan-at-citizens-bank-park-philadelphia-phillies/", "date": "2025-04"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citizens-bank-park$q$ and sp.name = $q$Chickie's & Pete's$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Crabfries, no cheese sauce$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$xfinity-mobile-arena$q$, $q$Xfinity Mobile Arena$q$, $q$arena$q$, $q$Philadelphia$q$, $q$PA$q$, $q$philadelphia$q$, array[$q$Philadelphia 76ers$q$,$q$Philadelphia Flyers$q$]::text[], 250, nullif($q$Outside food and beverage are prohibited, except baby food and medically necessary items.$q$, ''), nullif($q$https://www.xfinitymobilearena.com/plan-your-visit/security-policy$q$, ''), false, 32, '/public/guides/venues/xfinity-mobile-arena.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Buffalo Cauliflower Wrap$q$, $q$Section 107$q$, $q$concourse$q$, array[$q$107$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$xfinity-mobile-arena$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Buffalo Cauliflower Wrap$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Buffalo Cauliflower Wrap$q$, $q$Buffalo cauliflower with kale, shaved carrots and tahini ranch in a wrap; not called Vegan by the arena.$q$, $q$ask$q$, $q$[{"label": "Xfinity Mobile Arena", "url": "https://www.xfinitymobilearena.com/news/detail/xfinity-mobile-arena-announces-brand-new-concession-items-for-2025-2026-season", "date": "2025-10"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$xfinity-mobile-arena$q$ and sp.name = $q$Buffalo Cauliflower Wrap$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Buffalo Cauliflower Wrap$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Melissa's Produce$q$, $q$Section 118, Section 207A$q$, $q$concourse$q$, array[$q$118$q$,$q$207A$q$]::text[], 2 from public.ve_venues v
where v.slug = $q$xfinity-mobile-arena$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Melissa's Produce$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Salad bar and Vegan sandwiches$q$, $q$A salad bar with Vegan options and Vegan sandwiches, from 2024; not confirmed since.$q$, $q$ask$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/vegan-at-wells-fargo-center-philadelphia-flyers-76ers/", "date": "2024-01"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$xfinity-mobile-arena$q$ and sp.name = $q$Melissa's Produce$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Salad bar and Vegan sandwiches$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$subaru-park$q$, $q$Subaru Park$q$, $q$stadium$q$, $q$Chester$q$, $q$PA$q$, $q$philadelphia$q$, array[$q$Philadelphia Union$q$]::text[], 400, nullif($q$Food and beverage may be brought onto the grass area of Subaru Plaza but are not allowed into the stadium.$q$, ''), nullif($q$https://www.philadelphiaunion.com/stadium/parking$q$, ''), false, 33, '/public/guides/venues/subaru-park.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$metlife-stadium$q$, $q$MetLife Stadium$q$, $q$stadium$q$, $q$East Rutherford$q$, $q$NJ$q$, $q$new-york$q$, array[$q$New York Giants$q$,$q$New York Jets$q$]::text[], 400, nullif($q$Guides disagree on outside food; check the team's stadium FAQ before you go.$q$, ''), nullif($q$https://www.newyorkjets.com/faqs/stadium-faq$q$, ''), false, 40, '/public/guides/venues/metlife-stadium.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Fresh Fruit$q$, $q$Sections 116, 133, 144, 201, 216, 226, 237, 306 and 330$q$, $q$concourse$q$, array[$q$116$q$,$q$133$q$,$q$144$q$,$q$201$q$,$q$216$q$,$q$226$q$,$q$237$q$,$q$306$q$,$q$330$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$metlife-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Fresh Fruit$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Fresh fruit cup$q$, $q$A cup of fresh fruit.$q$, $q$vegan$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/metlife-stadium-vegan-options-new-york-giants-new-york-jets/", "date": "2025"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$metlife-stadium$q$ and sp.name = $q$Fresh Fruit$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Fresh fruit cup$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Mexican food stands$q$, $q$Sections 117, 211, 213, 217, 218, 234, 237, 241 and 315$q$, $q$concourse$q$, array[$q$117$q$,$q$211$q$,$q$213$q$,$q$217$q$,$q$218$q$,$q$234$q$,$q$237$q$,$q$241$q$,$q$315$q$]::text[], 2 from public.ve_venues v
where v.slug = $q$metlife-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Mexican food stands$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Veggie burrito, tacos and rice and bean bowl$q$, $q$Vegetable options not confirmed Vegan; ask about cheese, sour cream and how the rice and beans are made.$q$, $q$ask$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/metlife-stadium-vegan-options-new-york-giants-new-york-jets/", "date": "2025"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$metlife-stadium$q$ and sp.name = $q$Mexican food stands$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Veggie burrito, tacos and rice and bean bowl$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Dippin' Dots$q$, $q$Sections 103, 110, 118, 128, 133, 144, 149, 249, 302, 316, 320, 327 and 337$q$, $q$concourse$q$, array[$q$103$q$,$q$110$q$,$q$118$q$,$q$128$q$,$q$133$q$,$q$144$q$,$q$149$q$,$q$249$q$,$q$302$q$,$q$316$q$,$q$320$q$,$q$327$q$,$q$337$q$]::text[], 3 from public.ve_venues v
where v.slug = $q$metlife-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Dippin' Dots$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Rainbow Ice$q$, $q$The Dippin' Dots flavor without dairy.$q$, $q$vegan$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/metlife-stadium-vegan-options-new-york-giants-new-york-jets/", "date": "2025"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$metlife-stadium$q$ and sp.name = $q$Dippin' Dots$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Rainbow Ice$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Suite catering$q$, $q$Suites only$q$, $q$suites$q$, '{}'::text[], 4 from public.ve_venues v
where v.slug = $q$metlife-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Suite catering$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Beyond Sausage, kale quinoa salad, Vegan salsa trio$q$, $q$Part of the suite menu's Vegan and gluten-free package; confirm when you order.$q$, $q$ask$q$, $q$[{"label": "MetLife Stadium suite catering menu", "url": "https://suiteexperiencegroup.com/resources/MetLife_Stadium/MetLife_Stadium_Primary_catering_menu_2025-04-09.pdf", "date": "2025-04"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$metlife-stadium$q$ and sp.name = $q$Suite catering$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Beyond Sausage, kale quinoa salad, Vegan salsa trio$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$yankee-stadium$q$, $q$Yankee Stadium$q$, $q$stadium$q$, $q$Bronx$q$, $q$NY$q$, $q$new-york$q$, array[$q$New York Yankees$q$,$q$New York City FC$q$]::text[], 400, nullif($q$Outside food for one person is allowed in a clear plastic bag, eaten in general seating (not clubs or suites); sealed water up to 1 liter.$q$, ''), nullif($q$https://www.mlb.com/yankees/ballpark/information/policies$q$, ''), false, 41, '/public/guides/venues/yankee-stadium.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Benihana$q$, $q$Section 127$q$, $q$concourse$q$, array[$q$127$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$yankee-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Benihana$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Avocado roll with edamame$q$, $q$Avocado sushi roll with edamame.$q$, $q$vegan$q$, $q$[{"label": "VegNews", "url": "https://vegnews.com/vegan-snacks-baseball-game", "date": "2025-04"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$yankee-stadium$q$ and sp.name = $q$Benihana$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Avocado roll with edamame$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Mae Mae Cafe & Plant Shop$q$, $q$Ask for it; no section given$q$, $q$concourse$q$, '{}'::text[], 2 from public.ve_venues v
where v.slug = $q$yankee-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Mae Mae Cafe & Plant Shop$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Chickpea salad$q$, $q$Chickpea salad with arugula, marcona almonds, cucumbers, pickled red onion and harissa.$q$, $q$vegan$q$, $q$[{"label": "VegNews", "url": "https://vegnews.com/vegan-snacks-baseball-game", "date": "2025-04"}, {"label": "Secret NYC", "url": "https://secretnyc.co/yankee-stadium-2025-food-menu/", "date": "2025-03"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$yankee-stadium$q$ and sp.name = $q$Mae Mae Cafe & Plant Shop$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Chickpea salad$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$The Halal Guys$q$, $q$Carts in Bleachers 201 and Section 321$q$, $q$concourse$q$, array[$q$201$q$,$q$321$q$]::text[], 3 from public.ve_venues v
where v.slug = $q$yankee-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$The Halal Guys$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Falafel platter$q$, $q$Falafel with rice, lettuce, tomato and pita; skip the white sauce.$q$, $q$on_request$q$, $q$[{"label": "PETA", "url": "https://www.peta.org/media/news-releases/citi-field-and-yankee-stadium-nab-spots-on-list-of-most-vegan-friendly-ballparks-in-north-america/", "date": "2024-08"}, {"label": "Yankees Dining Guide", "url": "https://mlb.com/yankees/ballpark/food", "date": "2025"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$yankee-stadium$q$ and sp.name = $q$The Halal Guys$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Falafel platter$q$);
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Sweet Spot Bowl$q$, $q$Section 311$q$, $q$concourse$q$, array[$q$311$q$]::text[], 4 from public.ve_venues v
where v.slug = $q$yankee-stadium$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Sweet Spot Bowl$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Sweet Spot Bowl$q$, $q$Order it without the steak.$q$, $q$on_request$q$, $q$[{"label": "PETA", "url": "https://www.peta.org/features/vegan-friendly-ballparks-2024/", "date": "2024-08"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$yankee-stadium$q$ and sp.name = $q$Sweet Spot Bowl$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Sweet Spot Bowl$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$citi-field$q$, $q$Citi Field$q$, $q$stadium$q$, $q$Queens$q$, $q$NY$q$, $q$new-york$q$, array[$q$New York Mets$q$]::text[], 400, nullif($q$Guides say outside food and drink is not allowed except for medical or dietary needs, with one sealed water bottle allowed.$q$, ''), nullif($q$https://www.solotravellerapp.com/citi-field-food-policy/$q$, ''), false, 42, '/public/guides/venues/citi-field.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Vegan City$q$, $q$Field level behind Section 105 (one guide says 106)$q$, $q$concourse$q$, array[$q$105$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$citi-field$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Vegan City$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Vegan City Nachos$q$, $q$Chips with jackfruit chili, Vegan cheese fondue, pico de gallo, roasted salsa and guacamole.$q$, $q$vegan$q$, $q$[{"label": "VegNews", "url": "https://vegnews.com/vegan-snacks-baseball-game", "date": "2025-04"}, {"label": "PETA", "url": "https://www.peta.org/media/news-releases/citi-field-and-yankee-stadium-nab-spots-on-list-of-most-vegan-friendly-ballparks-in-north-america/", "date": "2024-08"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citi-field$q$ and sp.name = $q$Vegan City$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Vegan City Nachos$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Mushroom tacos$q$, $q$Mushroom tacos.$q$, $q$vegan$q$, $q$[{"label": "PETA", "url": "https://www.peta.org/features/vegan-friendly-ballparks-2024/", "date": "2024-08"}]$q$::jsonb, 2
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citi-field$q$ and sp.name = $q$Vegan City$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Mushroom tacos$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Vegan City Dog$q$, $q$Plant-based dog with jackfruit chili and Vegan cheese fondue; ask about the bun.$q$, $q$ask$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/citi-field-vegan-options/", "date": "2025"}]$q$::jsonb, 3
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citi-field$q$ and sp.name = $q$Vegan City$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Vegan City Dog$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Beyond Sausage & Peppers$q$, $q$Beyond Sausage with peppers; ask about the bun.$q$, $q$ask$q$, $q$[{"label": "VegNews", "url": "https://vegnews.com/vegan-snacks-baseball-game", "date": "2025-04"}]$q$::jsonb, 4
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citi-field$q$ and sp.name = $q$Vegan City$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Beyond Sausage & Peppers$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Pulled BBQ Jackfruit$q$, $q$Barbecue jackfruit topped with coleslaw; ask about the slaw and bun.$q$, $q$ask$q$, $q$[{"label": "Guilty Eats", "url": "https://guiltyeats.com/what-are-we-eating-at-citi-field-in-2025", "date": "2025"}]$q$::jsonb, 5
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$citi-field$q$ and sp.name = $q$Vegan City$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Pulled BBQ Jackfruit$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$madison-square-garden$q$, $q$Madison Square Garden$q$, $q$arena$q$, $q$New York$q$, $q$NY$q$, $q$new-york$q$, array[$q$New York Knicks$q$,$q$New York Rangers$q$]::text[], 250, nullif($q$Outside food and drink, including water, is not allowed.$q$, ''), nullif($q$https://msg.com/the-theater-at-msg/food-drink$q$, ''), false, 43, '/public/guides/venues/madison-square-garden.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$The Impossible Grille$q$, $q$Sixth-floor concourse$q$, $q$concourse$q$, '{}'::text[], 1 from public.ve_venues v
where v.slug = $q$madison-square-garden$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$The Impossible Grille$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Impossible Double Stack Smashburger$q$, $q$Two Impossible patties with plant-based American or Cheddar cheese.$q$, $q$vegan$q$, $q$[{"label": "Madison Square Garden (Business Wire)", "url": "https://www.businesswire.com/news/home/20260408540985/en/", "date": "2026-04"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$madison-square-garden$q$ and sp.name = $q$The Impossible Grille$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Impossible Double Stack Smashburger$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Impossible Banh Mi Hot Dog$q$, $q$Impossible hot dog dressed banh mi style.$q$, $q$vegan$q$, $q$[{"label": "The Knockturnal", "url": "https://theknockturnal.com/madison-square-garden-welcomes-the-impossible-grille/", "date": "2026-04"}]$q$::jsonb, 2
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$madison-square-garden$q$ and sp.name = $q$The Impossible Grille$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Impossible Banh Mi Hot Dog$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Orange Impossible Chicken Bowl$q$, $q$Impossible chicken in orange sauce over a bowl.$q$, $q$vegan$q$, $q$[{"label": "The Knockturnal", "url": "https://theknockturnal.com/madison-square-garden-welcomes-the-impossible-grille/", "date": "2026-04"}]$q$::jsonb, 3
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$madison-square-garden$q$ and sp.name = $q$The Impossible Grille$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Orange Impossible Chicken Bowl$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Impossible Steak Quesadilla$q$, $q$Impossible steak with dairy-free mozzarella.$q$, $q$vegan$q$, $q$[{"label": "The Knockturnal", "url": "https://theknockturnal.com/madison-square-garden-welcomes-the-impossible-grille/", "date": "2026-04"}]$q$::jsonb, 4
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$madison-square-garden$q$ and sp.name = $q$The Impossible Grille$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Impossible Steak Quesadilla$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Loaded Impossible Chopped Cheese Fries$q$, $q$Fries with Impossible beef, onions, plant-based Cheddar, pico de gallo and pickled jalapenos.$q$, $q$vegan$q$, $q$[{"label": "Green Queen", "url": "https://www.greenqueen.com.hk/impossible-foods-madison-square-garden-new-york-knicks-rangers-vegan/", "date": "2026-04"}]$q$::jsonb, 5
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$madison-square-garden$q$ and sp.name = $q$The Impossible Grille$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Loaded Impossible Chopped Cheese Fries$q$);
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$barclays-center$q$, $q$Barclays Center$q$, $q$arena$q$, $q$Brooklyn$q$, $q$NY$q$, $q$new-york$q$, array[$q$Brooklyn Nets$q$,$q$New York Liberty$q$]::text[], 250, nullif($q$Outside food and drink is not allowed, with exceptions for medical requirements and special needs.$q$, ''), nullif($q$https://www.barclayscenter.com/center-info/prohibited-items$q$, ''), false, 44, '/public/guides/venues/barclays-center.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venues (slug, name, kind, city, state, hub, teams, radius_m, note, note_source_url, free_example, sort_order, image_url, status)
values ($q$ubs-arena$q$, $q$UBS Arena$q$, $q$arena$q$, $q$Elmont$q$, $q$NY$q$, $q$new-york$q$, array[$q$New York Islanders$q$]::text[], 250, nullif($q$Outside food and drink is not allowed, with exceptions for medical requirements and special needs.$q$, ''), nullif($q$https://ubsarena.com/about-the-arena/faqs$q$, ''), false, 45, '/public/guides/venues/ubs-arena.webp', 'live')
on conflict (slug) do nothing;
insert into public.ve_venue_spots (venue_id, name, where_text, zone, map_sections, sort_order)
select v.id, $q$Salad stand$q$, $q$Section 107$q$, $q$concourse$q$, array[$q$107$q$]::text[], 1 from public.ve_venues v
where v.slug = $q$ubs-arena$q$ and not exists (select 1 from public.ve_venue_spots x where x.venue_id = v.id and x.name = $q$Salad stand$q$);
insert into public.ve_venue_items (venue_id, spot_id, name, description, vegan, sources, sort_order)
select sp.venue_id, sp.id, $q$Salads$q$, $q$Likely Vegan-friendly salads; ask about the dressing and toppings.$q$, $q$ask$q$, $q$[{"label": "Veggl", "url": "https://veggl.com/stadium-arena-cheat-sheets/ubs-arena-vegan-options/", "date": "2025"}]$q$::jsonb, 1
from public.ve_venue_spots sp join public.ve_venues v on v.id = sp.venue_id
where v.slug = $q$ubs-arena$q$ and sp.name = $q$Salad stand$q$ and not exists (select 1 from public.ve_venue_items x where x.spot_id = sp.id and x.name = $q$Salads$q$);
