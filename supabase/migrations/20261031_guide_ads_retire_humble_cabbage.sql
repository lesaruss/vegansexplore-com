-- Our Guides take every ad slot; Humble Cabbage is retired for now (Sean, 2026-10-31: "we should have the majority of our ads be the
-- guides instead of Humble Cabbage, because that is a better front door... let's actually just retire Humble Cabbage for now and just
-- make them all our guides, but just create an assortment of them around the different places").
--
-- Six rail campaigns under the house sponsor (ve-house-banners), one per Guide, each the HTML5 ad /ads/guides/guide.html?g=<guide> with
-- its own tracked /go/ link, so ad-resolve counts impressions and ad-click counts clicks by slot, and ve-links names the member who
-- clicked (initiative ve-house-banners, tags house-banner and the Guide). Each slot gets one Guide, spread so neighbouring slots differ
-- and the Stadium & Arena Guide shows only in chapters with mapped venues. Humble Cabbage's campaigns and sponsor campaign are paused,
-- never deleted, so its history reads and a slot can go back to it by setting one campaign active.

-- The three Guides that had no tracked link yet.
insert into public.ve_links (code, label, destination, initiative_slug, tags, channel, active) values
  ('ve-guide-restaurant', 'House banner: the Vegan Restaurant Survival Guide', 'https://vegansexplore.com/guides/vegan-restaurant-survival-guide', 've-house-banners', array['house-banner', 'vegan-restaurant-survival-guide'], 'other', true),
  ('ve-guide-nonprofit', 'House banner: the Nonprofit Guide', 'https://vegansexplore.com/guides/nonprofit-guide', 've-house-banners', array['house-banner', 'nonprofit-guide'], 'other', true),
  ('ve-guide-creator', 'House banner: the Creator Guide', 'https://vegansexplore.com/guides/creator-guide', 've-house-banners', array['house-banner', 'creator-guide'], 'other', true)
on conflict (code) do nothing;

insert into public.ad_campaigns (id, campaign_name, sponsor_name, campaign_type, creative_url, click_through_url, start_date, status, notes, sponsor_campaign_id) values
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a14001', 'Vegans Explore - The Vegan Dairy Guide (ad rails)', 'Vegans Explore', 'house', 'https://vegansexplore.com/ads/guides/guide.html?g=vegan-dairy-guide', 'https://vegansexplore.com/go/ve-guide-dairy', '2026-10-31', 'active', 'HTML5 Guide ad, ads/guides/guide.html.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001'),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a14002', 'Vegans Explore - The Restaurant Guide (ad rails)', 'Vegans Explore', 'house', 'https://vegansexplore.com/ads/guides/guide.html?g=vegan-restaurant-survival-guide', 'https://vegansexplore.com/go/ve-guide-restaurant', '2026-10-31', 'active', 'HTML5 Guide ad, ads/guides/guide.html.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001'),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a14003', 'Vegans Explore - The Stadium & Arena Guide (ad rails)', 'Vegans Explore', 'house', 'https://vegansexplore.com/ads/guides/guide.html?g=stadium-arena-guide', 'https://vegansexplore.com/go/ve-guide-stadium', '2026-10-31', 'active', 'HTML5 Guide ad, ads/guides/guide.html.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001'),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a14004', 'Vegans Explore - The Airport Guide (ad rails)', 'Vegans Explore', 'house', 'https://vegansexplore.com/ads/guides/guide.html?g=airport-guide', 'https://vegansexplore.com/go/ve-guide-airport', '2026-10-31', 'active', 'HTML5 Guide ad, ads/guides/guide.html.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001'),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a14005', 'Vegans Explore - The Nonprofit Guide (ad rails)', 'Vegans Explore', 'house', 'https://vegansexplore.com/ads/guides/guide.html?g=nonprofit-guide', 'https://vegansexplore.com/go/ve-guide-nonprofit', '2026-10-31', 'active', 'HTML5 Guide ad, ads/guides/guide.html.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001'),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a14006', 'Vegans Explore - The Creator Guide (ad rails)', 'Vegans Explore', 'house', 'https://vegansexplore.com/ads/guides/guide.html?g=creator-guide', 'https://vegansexplore.com/go/ve-guide-creator', '2026-10-31', 'active', 'HTML5 Guide ad, ads/guides/guide.html.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001')
on conflict (id) do nothing;

-- Which Guide each slot carries (d dairy, r restaurant, s stadium, a airport, n nonprofit, c creator).
with plan(slot_id, g) as (values
  ('ve-directory-landscape-1', 'd'), ('ve-directory-landscape-2', 'r'),
  ('skyscraper', 'n'), ('landscape-1', 'c'),
  ('ve-events-skyscraper', 's'),
  ('ve-directory-listing-landscape-1', 'd'), ('ve-directory-listing-skyscraper', 'r'),
  ('ve-sofl-hub-skyscraper', 's'), ('ve-sofl-hub-landscape-1', 'd'), ('ve-sofl-hub-landscape-2', 'r'),
  ('ve-central-florida-hub-skyscraper', 'r'), ('ve-central-florida-hub-landscape-1', 's'), ('ve-central-florida-hub-landscape-2', 'n'),
  ('ve-north-florida-hub-skyscraper', 'd'), ('ve-north-florida-hub-landscape-1', 'a'), ('ve-north-florida-hub-landscape-2', 'c'),
  ('ve-atlanta-hub-skyscraper', 'a'), ('ve-atlanta-hub-landscape-1', 'r'), ('ve-atlanta-hub-landscape-2', 's'),
  ('ve-washington-dc-hub-skyscraper', 'n'), ('ve-washington-dc-hub-landscape-1', 'd'), ('ve-washington-dc-hub-landscape-2', 'a'),
  ('ve-delaware-hub-skyscraper', 'c'), ('ve-delaware-hub-landscape-1', 'r'), ('ve-delaware-hub-landscape-2', 'd'),
  ('ve-maryland-hub-skyscraper', 'a'), ('ve-maryland-hub-landscape-1', 'n'), ('ve-maryland-hub-landscape-2', 'r'),
  ('ve-virginia-hub-skyscraper', 'd'), ('ve-virginia-hub-landscape-1', 'c'), ('ve-virginia-hub-landscape-2', 'a'),
  ('ve-west-virginia-hub-skyscraper', 'r'), ('ve-west-virginia-hub-landscape-1', 'd'), ('ve-west-virginia-hub-landscape-2', 'n'),
  ('ve-new-york-hub-skyscraper', 's'), ('ve-new-york-hub-landscape-1', 'a'), ('ve-new-york-hub-landscape-2', 'c'),
  ('ve-philadelphia-hub-skyscraper', 'c'), ('ve-philadelphia-hub-landscape-1', 's'), ('ve-philadelphia-hub-landscape-2', 'd'),
  ('ve-los-angeles-hub-skyscraper', 'a'), ('ve-los-angeles-hub-landscape-1', 'c'), ('ve-los-angeles-hub-landscape-2', 'r'),
  ('ve-london-hub-skyscraper', 'd'), ('ve-london-hub-landscape-1', 'a'), ('ve-london-hub-landscape-2', 'n')
), camp(g, id) as (values
  ('d', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14001'::uuid), ('r', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14002'::uuid),
  ('s', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14003'::uuid), ('a', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14004'::uuid),
  ('n', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14005'::uuid), ('c', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14006'::uuid)
)
insert into public.ad_campaign_placements (campaign_id, placement_id)
select camp.id, p.id
from plan join camp using (g)
join public.ad_placements p on p.slot_id = plan.slot_id and p.brand_slug = 'vegans-explore'
where not exists (select 1 from public.ad_campaign_placements x where x.placement_id = p.id
                  and x.campaign_id in (select id from camp));

-- Humble Cabbage paused everywhere, kept for its history.
update public.ad_campaigns set status = 'paused',
  notes = coalesce(notes || ' ', '') || 'Paused 2026-10-31: our Guides took every slot (Sean).'
where sponsor_campaign_id = (select id from public.ad_sponsor_campaigns where slug = 'humble-cabbage') and status = 'active';
update public.ad_sponsor_campaigns set status = 'paused' where slug = 'humble-cabbage' and status = 'active';
