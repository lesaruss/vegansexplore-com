-- The Supermarket Guide's store pages get the ad rail (Sean, 2026-11-01: "3/4 with two section next to each other and then for the 1/4
-- section on the right we can have advertising reserved for our sponsors. We can put in our normal advertising there of Humble Cabbage
-- and a complimentary Guide"). Two 300 x 250 slots on page /guides/supermarket-guide (public/ve-ad-rail.js PAGES): slot 1 the Dairy
-- Guide's house campaign (its animated card), slot 2 Humble Cabbage's still image, the same pair as the Directory's All cities rail. A
-- supermarket or brand sponsor takes a slot by linking its campaign to the placement (ad-resolve serves the newest active one).
insert into public.ad_placements (brand_slug, site_name, site_url, page_name, page_slug, slot_id, slot_position, dimensions, status, notes)
select 'vegans-explore', 'VEGANS EXPLORE', 'https://vegansexplore.com', 'The Supermarket Guide', '/guides/supermarket-guide', s, 'sticky-sidebar', '300x250', 'active',
  'Supermarket Guide store pages, reserved for its sponsors (Sean 2026-11-01); a Guide then Humble Cabbage until sold.'
from (values ('ve-supermarket-guide-1'), ('ve-supermarket-guide-2')) v(s)
where not exists (select 1 from public.ad_placements p where p.slot_id = v.s);

insert into public.ad_campaign_placements (campaign_id, placement_id)
select c.cid::uuid, p.id from public.ad_placements p
join (values ('ve-supermarket-guide-1', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14001'), ('ve-supermarket-guide-2', '83f733a2-e116-4cab-b9d7-5722336f4a04')) c(slot, cid) on c.slot = p.slot_id
where not exists (select 1 from public.ad_campaign_placements x where x.placement_id = p.id and x.campaign_id = c.cid::uuid);
