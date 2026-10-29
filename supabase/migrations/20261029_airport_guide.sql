-- The Airport Guide (Sean, 2026-10-29: "Let's look at the airport guide now"; locked 2026-10-28 in playbook ve-venue-guides). The
-- Stadium Guide's engine with airports: ve_venues kind airport, its layout the terminals and concourses with their gates, each stand
-- after security (airside) or before it (landside). Nori is the Guide. $11 or 1,100 points, FLL free, unpublished until Sean says launch.
insert into public.ve_guides (title, slug, description, cost_lesars, published, sort_order, access_rule)
values ('The Airport Guide', 'airport-guide',
  'Where the Vegan food is at the airports in our cities: every spot by terminal, before or after security and near which gate, checked by members on their way through. With Nori as your Guide.',
  1100, false, 4, 'points')
on conflict (slug) do nothing;

alter table public.ve_venue_spots drop constraint if exists ve_venue_spots_zone_check;
alter table public.ve_venue_spots add constraint ve_venue_spots_zone_check
  check (zone = any (array['concourse', 'club', 'suites', 'outside', 'airside', 'landside']));
