-- ve-theme-park-guide: members vote on a park's restaurants (Sean, 2026-11-05: "they can also vote on the different locations within it").
-- One vote per Guide owner per restaurant (ve_venue_spots.id as item_key), through ve-cookbook gvote / gvotes, guide_slug theme-park-guide.
alter table public.ve_guide_votes drop constraint if exists ve_guide_votes_kind_check;
alter table public.ve_guide_votes add constraint ve_guide_votes_kind_check check (kind in ('swap', 'episode', 'fix', 'promo', 'park_spot'));
