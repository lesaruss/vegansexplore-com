-- Two moving ads side by side is distracting (Sean, 2026-10-31: "on the ones that have the two smaller ads together, make one of them
-- humble cabbage... it's a little distracting seeing both of them move at the same time... The longer ones that are the guides can stay").
-- Every chapter pair (the Directory's /directory pair and each city hub's two landscape slots, which the Directory and Media rails show)
-- keeps its Guide in slot 1 and goes back to Humble Cabbage's still image in slot 2: that slot's own Humble Cabbage campaign is active
-- again and its Guide link is removed (ad-resolve serves the newest active campaign, which would otherwise stay the Guide).

delete from public.ad_campaign_placements cp
using public.ad_placements p
where cp.placement_id = p.id and p.brand_slug = 'vegans-explore'
  and (p.slot_id = 've-directory-landscape-2' or p.slot_id like 've-%-hub-landscape-2')
  and cp.campaign_id::text like '7b1c4f2e-1a10-4d2e-9a51-0c0de5a1400%';

update public.ad_campaigns c set status = 'active',
  notes = coalesce(c.notes || ' ', '') || 'Active again 2026-10-31: the second slot of each pair (Sean).'
from public.ad_campaign_placements cp, public.ad_placements p
where cp.campaign_id = c.id and cp.placement_id = p.id and p.brand_slug = 'vegans-explore'
  and (p.slot_id = 've-directory-landscape-2' or p.slot_id like 've-%-hub-landscape-2')
  and c.sponsor_campaign_id = (select id from public.ad_sponsor_campaigns where slug = 'humble-cabbage')
  and c.status = 'paused';

update public.ad_sponsor_campaigns set status = 'active' where slug = 'humble-cabbage' and status = 'paused';
