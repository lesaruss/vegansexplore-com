-- The Dairy Guide moves to points (Sean, 2026-10-10, canon-ve-guide-pricing: "record it and flip").
-- Every paid Guide is $11 or 1,100 points. Members active at the flip keep the Guide: anyone active without a
-- purchase row gets one (0 points spent), in the same transaction as the flip, so no one who joined while it
-- "came with membership" loses it. The page (guide-scripts/vegan-dairy-guide.js) reads access_rule and switches its offer.
insert into public.ve_guide_purchases (member_id, guide_id, lesars_spent)
select m.id, g.id, 0
from public.ve_guides g cross join public.members m
where g.slug in ('vegan-dairy-guide', 'vegan-dairy-guide-site')
  and m.membership_status = 'active'
  and not exists (select 1 from public.ve_guide_purchases p where p.guide_id = g.id and p.member_id = m.id);

update public.ve_guides set access_rule = 'points', cost_lesars = 1100
where slug in ('vegan-dairy-guide', 'vegan-dairy-guide-site');
