-- ve-theme-park-guide: the venue kind (LOCKED by Sean 2026-11-04, canon canon-ve-theme-park-guide, step 1 of the build order).
-- The Vegan Theme Park Guide runs on the venue Guides' engine (ve-venues): a park is a ve_venues row of kind 'theme_park', each
-- restaurant a spot with a pin, each dish an item. Nothing here is public: the Guide row is unpublished and the pilot park is hidden
-- until its pins have been looked at by Sean.

alter table public.ve_venues drop constraint if exists ve_venues_kind_check;
alter table public.ve_venues add constraint ve_venues_kind_check
  check (kind = any (array['stadium','arena','airport','supermarket','theme_park']));

-- A resort label for browsing only (Walt Disney World Resort, Universal Orlando Resort). Plain text, never a logo.
alter table public.ve_venues add column if not exists resort text;

-- The Guide: $11 or 1,100 points, one Guide for every park, unpublished until launch (BUILD-A-GUIDE.md).
insert into public.ve_guides (title, slug, description, cost_lesars, published, sort_order, access_rule)
select 'The Vegan Theme Park Guide', 'theme-park-guide',
  'Find the Vegan food inside the parks, restaurant by restaurant, with a map that knows where you are. Kept current by members. Not affiliated with any park.',
  1100, false, 10, 'points'
where not exists (select 1 from public.ve_guides where slug = 'theme-park-guide');

-- The free park and the pilot: Magic Kingdom. free_example is the flag every venue Guide already reads (ve-venues `venue` opens a
-- free_example venue to everyone). Hidden, with no pin, until the pilot import has run and Sean has seen the pins. The radius is a
-- guess (canon: about 700 m) and is reset from the farthest pin plus 100 m after the import.
insert into public.ve_venues (slug, name, kind, city, state, country, hub, resort, radius_m, free_example, status, sort_order, note)
select 'magic-kingdom', 'Magic Kingdom Park', 'theme_park', 'Lake Buena Vista', 'FL', 'US', 'central-florida',
  'Walt Disney World Resort', 700, true, 'hidden', 1,
  'Not affiliated with, endorsed by or sponsored by any park or resort. Park names are used only to say where a restaurant is.'
where not exists (select 1 from public.ve_venues where slug = 'magic-kingdom');
