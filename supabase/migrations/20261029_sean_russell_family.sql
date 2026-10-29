-- Sean's pages linked as one family (Sean, 2026-10-29: "because those pages should be connected, you should also still see the tabs
-- for my overview and book"): his profile, the Vegans Explore, SoFlo Vegans and Pre-Vegans podcasts, and Pre-Vegans the book share
-- `sean-russell` (was `pre-vegans`), so each page shows Overview, the three podcasts and Books. No YouTube page joins it (Sean: not
-- until there is video he wants to promote). Safe to run twice.
insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
select id, 'details.family', to_jsonb(details ->> 'family'), '"sean-russell"'::jsonb, jsonb_build_object('by', 'logan', 'why', 'Sean''s pages linked (Sean)')
from listings where status = 'approved'
  and slug in ('sean-russell', 'vegans-explore-podcast', 'soflo-vegans-podcast', 'pre-vegans-podcast', 'pre-vegans-by-sean-russell')
  and coalesce(details ->> 'family', '') <> 'sean-russell';
update listings set details = details || '{"family": "sean-russell"}'::jsonb, updated_at = now()
where status = 'approved'
  and slug in ('sean-russell', 'vegans-explore-podcast', 'soflo-vegans-podcast', 'pre-vegans-podcast', 'pre-vegans-by-sean-russell')
  and coalesce(details ->> 'family', '') <> 'sean-russell';
