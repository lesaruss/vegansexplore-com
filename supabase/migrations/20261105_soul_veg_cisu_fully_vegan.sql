-- vegans-explore-initiative-business-certification: How Vegan fix (Sean, 2026-11-05: "Yes, set Soul Vegetarian and Ci Su to 100% Vegan").
-- Both were listed Vegan options; their own sites say "100% VEGAN" (originalsoulvegan.com) and "All Vegan" (cisuveganhouse.com),
-- read through pg_net on 2026-11-05. Both outreach contacts already sit on the restaurant door (left there by 20261105_pre_vegan_door).
-- Each change is a ve_listing_edits row with the value it replaced, so it can be undone.
with ch as (
  select id, vegan_status as old from public.listings
  where slug in ('soul-vegetarian-no-2', 'ci-su-vegetarian-bistro') and vegan_status is distinct from 'fully_vegan'
), up as (
  update public.listings l set vegan_status = 'fully_vegan' from ch where l.id = ch.id returning l.id, ch.old
)
insert into public.ve_listing_edits (listing_id, member_id, field, old_value, new_value, meta)
select id, null, 'vegan_status', to_jsonb(old), to_jsonb('fully_vegan'::text),
  jsonb_build_object('by', 'logan', 'approved_by', 'sean', 'why', 'Their own site says 100% Vegan',
    'migration', '20261105_soul_veg_cisu_fully_vegan')
from up;
