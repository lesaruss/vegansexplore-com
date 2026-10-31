-- The Nutrition Guide's animated banner card (Sean, 2026-10-31: the Guides' new banner style, "copy that"): the same HTML5 ad as every
-- Guide, /ads/guides/guide.html?g=nutrition-guide (four scenes: Theo's banner, the plate, Theo at the market, a physician on our podcast),
-- a campaign under the house sponsor (ve-house-banners), its own tracked link, and four slots taken from the Dairy Guide, which held the
-- most (the North Florida, Virginia and London hubs' tall slots, and South Florida's first 300 x 250). Safe to run twice.
insert into public.ve_links (code, label, destination, initiative_slug, tags, channel, active) values
  ('ve-guide-nutrition', 'House banner: the Nutrition Guide', 'https://vegansexplore.com/guides/nutrition-guide', 've-house-banners', array['house-banner', 'nutrition-guide'], 'other', true)
on conflict (code) do nothing;

insert into public.ad_campaigns (id, campaign_name, sponsor_name, campaign_type, creative_url, click_through_url, start_date, status, notes, sponsor_campaign_id) values
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a14007', 'Vegans Explore - The Nutrition Guide (ad rails)', 'Vegans Explore', 'house', 'https://vegansexplore.com/ads/guides/guide.html?g=nutrition-guide', 'https://vegansexplore.com/go/ve-guide-nutrition', '2026-10-31', 'active', 'HTML5 Guide ad, ads/guides/guide.html.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001')
on conflict (id) do nothing;

with slots as (select id from public.ad_placements where brand_slug = 'vegans-explore' and slot_id in
  ('ve-north-florida-hub-skyscraper', 've-virginia-hub-skyscraper', 've-london-hub-skyscraper', 've-sofl-hub-landscape-1'))
delete from public.ad_campaign_placements x using slots
where x.placement_id = slots.id and x.campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14001';

insert into public.ad_campaign_placements (campaign_id, placement_id)
select '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14007'::uuid, p.id from public.ad_placements p
where p.brand_slug = 'vegans-explore' and p.slot_id in ('ve-north-florida-hub-skyscraper', 've-virginia-hub-skyscraper', 've-london-hub-skyscraper', 've-sofl-hub-landscape-1')
  and not exists (select 1 from public.ad_campaign_placements x where x.placement_id = p.id and x.campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14007');
