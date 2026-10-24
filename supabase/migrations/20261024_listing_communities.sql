-- Chapters a listing serves beyond its address (Sean, 2026-10-24: "Florida Animal Rescue Alliance is an
-- organization that covers the entirety of Florida. And right now I only have a way of showing Miramar...
-- PETA, that would be a global organization. It could have its headquarters notated, but it should show
-- up in all the community sections").
--
-- The address still puts a listing in its home chapter (VE_HUBS[].match). `communities` adds more: hub
-- slugs from VE_HUBS (south-florida, central-florida, ...), or 'all' for every chapter, now and to come.
-- /public/ve-region-directory.js shows a listing in a chapter when either says so; the address stays the
-- headquarters on the card. Set in the listing editor (ve-claims admin_listing).
alter table public.listings add column if not exists communities text[] not null default '{}';

alter table public.listings drop constraint if exists listings_communities_slugs;
alter table public.listings add constraint listings_communities_slugs
  check (array_to_string(communities, ',') ~ '^([a-z0-9-]+(,[a-z0-9-]+)*)?$' and cardinality(communities) <= 20);

-- The first two Sean named.
update public.listings set communities = array['south-florida', 'central-florida']
  where slug = 'florida-animal-rescue-alliance' and status = 'approved';
update public.listings set communities = array['all']
  where slug = 'be-an-animal-hero' and status = 'approved';
