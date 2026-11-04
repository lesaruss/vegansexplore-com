-- ve-theme-park-guide: Magic Kingdom items, hand-made from facts in three published lists (read 2026-11-04).
-- Names only, no descriptions or photos. Every item is "ask" (Ask before you order) until a member confirms it at the
-- restaurant. Sources: V = VeggL (Updated 2025), P = PETA (undated), N = VegNews (undated); all three say they follow
-- Disney's own plant-based guide. A conflict (Cosmic Ray's, Pecos Bill) lists both items.
with src(k, url, label, d) as (values
  ('V','https://veggl.com/vegan-options-at-theme-parks/vegan-options-at-disney-world-magic-kingdom','VeggL, Vegan Options at Disney World''s Magic Kingdom','2025'),
  ('P','https://www.peta.org/living/food/vegan-at-disney-world/','PETA, Vegan at Disney World','read 2026-11-04'),
  ('N','https://vegnews.com/vegan-guides/vegan-guide-disney-world','VegNews, Vegan Guide to Disney World','read 2026-11-04')),
it(spot, item, ks, ord) as (values
  ('Aloha Isle','DOLE Whip soft serve','V,P,N',1),('Aloha Isle','Pineapple float','P',2),('Aloha Isle','Raspberry swirl float','P',3),
  ('Be Our Guest Restaurant','Potato leek soup','V',1),('Be Our Guest Restaurant','Charred eggplant','V',2),('Be Our Guest Restaurant','Vanilla cake with lemon curd','V',3),
  ('Casey''s Corner','Plant-based dog','V,P',1),('Casey''s Corner','Plant-based Chicago-style dog','V',2),('Casey''s Corner','French fries','P',3),
  ('Cinderella''s Royal Table','Plant-based breakfast','V',1),('Cinderella''s Royal Table','Soup of the day','V',2),('Cinderella''s Royal Table','Pan-roasted cauliflower','V',3),('Cinderella''s Royal Table','Floating island','V',4),
  ('Columbia Harbour House','Plant-based crispy mushroom roll','V',1),
  ('Cosmic Ray''s Starlight Café','Patty melt','V',1),('Cosmic Ray''s Starlight Café','Impossible burger, no Swiss cheese','N',2),
  ('The Friar''s Nook','Beyond Bratwurst with tater tots','P',1),
  ('Liberty Tree Tavern','Tavern salad','V',1),('Liberty Tree Tavern','Impossible meatloaf','V',2),('Liberty Tree Tavern','Warm apple cake','V',3),
  ('Pecos Bill Tall Tale Inn and Cafe','Grilled masa flatbread','V',1),('Pecos Bill Tall Tale Inn and Cafe','Veggie rice bowl','P',2),
  ('Pinocchio Village Haus','Plant-based cheese pizza','V,N',1),
  ('The Plaza Restaurant','House salad','V',1),('The Plaza Restaurant','Impossible chili burger','V,N',2),('The Plaza Restaurant','Dark chocolate-banana bread pudding','V',3),
  ('Skipper Canteen','Falls Family Falafel','V,N',1),('Skipper Canteen','Curried vegetable stew','V,N',2),('Skipper Canteen','Panna cotta dessert','V,N',3),
  ('Sunshine Tree Terrace','DOLE Whip soft serve','V',1),
  ('Storybook Treats','Lime DOLE Whip','N',1),('Storybook Treats','Cherry DOLE Whip','N',2),
  ('Tony''s Town Square Restaurant','House salad','V',1),('Tony''s Town Square Restaurant','Spaghetti with Impossible meatballs','V,N',2),('Tony''s Town Square Restaurant','Plant-based affogato','V,N',3),
  ('The Crystal Palace','Plant-based Mickey-shaped waffles','V',1),('The Crystal Palace','Keralan tofu curry','V',2),('The Crystal Palace','Vegetable chana masala','V',3),('The Crystal Palace','Harvest grains salad','V',4))
insert into public.ve_venue_items (venue_id, spot_id, name, vegan, sources, sort_order, status)
select v.id, s.id, it.item, 'ask',
  (select jsonb_agg(jsonb_build_object('url', src.url, 'date', src.d, 'label', src.label) order by src.k)
   from src where src.k = any(string_to_array(it.ks, ','))),
  it.ord, 'live'
from it
join public.ve_venues v on v.slug = 'magic-kingdom'
join public.ve_venue_spots s on s.venue_id = v.id and s.name = it.spot
where not exists (select 1 from public.ve_venue_items x where x.spot_id = s.id and x.name = it.item);
