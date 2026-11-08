-- ve-feedback: clear the 8 broken Facebook addresses from the 2026-11-08 review list (Sean chose "The 8 broken").
-- Each stored value was not a page (/p, /pg, /search, /https:, a share link). The old value is kept in
-- details.social_removed.facebook and each change is a ve_listing_edits row (meta.playbook ve-feedback).
-- Applied through the Supabase connector on 2026-11-08; this file records it.
with bad as (
  select id, facebook, case when slug='vegan-squad-florida' then 'A Facebook share link, not a page address'
    else 'Not a Facebook page address (a Facebook path read off a website)' end why
  from listings where status='approved' and slug in ('good-kitchen-market','haam-caribbean-plant-cuisine','overgreens-salads-juice',
    'pgh-green-grains-co','renegade-vegan','seoul-food-d-c','soulicious-vegan-kitchen','vegan-squad-florida')
  and facebook is not null
), ins as (
  insert into ve_listing_edits (listing_id, field, old_value, new_value, meta)
  select id, 'facebook', to_jsonb(facebook), 'null'::jsonb, jsonb_build_object('where','cleanup','why',why,'by','logan',
    'playbook','ve-feedback','decided_by','sean','list','2026-11-08-ve-feedback-facebook-review-list') from bad returning listing_id
)
update listings l set facebook=null, details = coalesce(l.details,'{}'::jsonb) || jsonb_build_object('social_removed',
  coalesce(l.details->'social_removed','{}'::jsonb) || jsonb_build_object('facebook', jsonb_build_object('value', b.facebook, 'why', b.why, 'at', now())))
from bad b where b.id=l.id;
