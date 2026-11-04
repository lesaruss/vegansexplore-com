-- ve-theme-park-guide: Magic Kingdom launch (Sean: "go, launch Magic Kingdom with River", 2026-11-04).
-- Disney's plant-based list was re-checked against Sean's paste the same day: all 44 live items matched.
-- (1) Liberty Square Market, on Disney's list, becomes a spot (no pin yet) with its one line, "Various Snack Options".
-- (2) Two items take Disney's wording. (3) Spots with no live item (not on Disney's list) are set to gone: kept, not deleted.
-- (4) The Guide row is published ($11 or 1,100 points; Magic Kingdom stays the free_example venue).
insert into public.ve_venue_spots (venue_id, name, kind, zone, land, where_text, pin_source, note, sort_order, status)
select v.id, 'Liberty Square Market', 'food', 'outside', 'Liberty Square', 'Liberty Square', null, null, 26, 'live'
from public.ve_venues v where v.kind = 'theme_park' and v.free_example
  and not exists (select 1 from public.ve_venue_spots s where s.venue_id = v.id and s.name = 'Liberty Square Market');

insert into public.ve_venue_items (venue_id, spot_id, name, vegan, sources, sort_order, status)
select s.venue_id, s.id, 'Various snack options', 'vegan',
  '[{"url":"https://disneyworld.disney.go.com/dining/plant-based/","date":"2026-11-04","label":"Walt Disney World, plant-based list for Magic Kingdom Park"}]'::jsonb, 1, 'live'
from public.ve_venue_spots s join public.ve_venues v on v.id = s.venue_id
where v.kind = 'theme_park' and s.name = 'Liberty Square Market'
  and not exists (select 1 from public.ve_venue_items i where i.spot_id = s.id);

update public.ve_venue_items i set name = 'Curried Vegetable Crew Stew'
from public.ve_venue_spots s where s.id = i.spot_id and s.name = 'Skipper Canteen' and i.name = 'Curried vegetable stew';
update public.ve_venue_items i set name = 'Panna-Connie''s Congo Lime Delight'
from public.ve_venue_spots s where s.id = i.spot_id and s.name = 'Skipper Canteen' and i.name = 'Congo lime dessert';

update public.ve_venue_spots s set status = 'gone'
from public.ve_venues v
where v.id = s.venue_id and v.kind = 'theme_park' and s.status = 'live'
  and not exists (select 1 from public.ve_venue_items i where i.spot_id = s.id and i.status = 'live');

update public.ve_guides set published = true where slug = 'theme-park-guide';
