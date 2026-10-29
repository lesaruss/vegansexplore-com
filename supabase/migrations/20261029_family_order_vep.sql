-- Vegans Explore Podcast first among Sean's podcast tabs (Sean, 2026-10-29: "put Vegans Explore Podcast first in the tabs").
-- details.family_order orders listings of the same kind in a family (lower first, then A to Z; loadFamily in directory/listing.html).
update listings set details = details || '{"family_order": 1}'::jsonb, updated_at = now()
where slug = 'vegans-explore-podcast' and status = 'approved' and coalesce(details ->> 'family_order', '') <> '1';
