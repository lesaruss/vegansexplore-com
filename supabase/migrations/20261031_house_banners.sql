-- House banners: the Guides and Become a creator on Directory listings (Sean, 2026-10-31: "create that for other guides and sprinkle
-- it throughout the website... that's the only banner on the right-hand side... remove the humble cabbage... make sure we're tracking it
-- in ads... which member clicked it, how many times they clicked it... follow-up communications").
-- One sponsor campaign (ve-house-banners, sponsor Vegans Explore), a campaign per banner, two placements (a listing's right column, a
-- People page's right column), so views and clicks land in ad_impressions like any ad. Each banner leaves through its own tracked /go/
-- link (initiative ve-house-banners): ve-links logs the click, nav.js names the signed-in member on it, and ve_initiative_interest keeps
-- each member's clicks for /dashboard/leads. The page draws the banner itself (public/ve-promo.js), so the placements use their own
-- page_slug and ad-resolve never counts them.

insert into public.ad_sponsor_campaigns (id, slug, name, sponsor_name, status, paid, budget_cents, start_date, goal, notes, default_link, link_initiative)
values ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001', 've-house-banners', 'Vegans Explore Guides and creators', 'Vegans Explore', 'active', false, 0,
  '2026-10-31', 'Guide purchases and creator applications from Directory listings',
  'House banners drawn by public/ve-promo.js: the Airport, Dairy and Stadium & Arena Guides on listings, Become a creator on People pages.',
  'https://vegansexplore.com/guides', 've-house-banners')
on conflict (id) do nothing;

insert into public.ad_placements (id, brand_slug, site_name, site_url, page_name, page_slug, slot_id, slot_position, dimensions, status, notes) values
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a12001', 'vegans-explore', 'VEGANS EXPLORE', 'https://vegansexplore.com', 'Directory listing (house banner)',
   '/directory/[slug]#house', 've-listing-house-banner', 'sidebar', '320x400', 'active', 'A Guide banner in every listing''s right column (not People pages).'),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a12002', 'vegans-explore', 'VEGANS EXPLORE', 'https://vegansexplore.com', 'People page (house banner)',
   '/directory/[slug]#people', 've-people-house-banner', 'sidebar', '320x400', 'active', 'Become a creator in every People page''s right column.')
on conflict (id) do nothing;

insert into public.ve_links (code, label, destination, initiative_slug, tags, channel, active) values
  ('ve-guide-airport', 'House banner: the Airport Guide', 'https://vegansexplore.com/guides/airport-guide', 've-house-banners', array['house-banner', 'airport-guide'], 'other', true),
  ('ve-guide-dairy', 'House banner: the Vegan Dairy Guide', 'https://vegansexplore.com/guides/vegan-dairy-guide', 've-house-banners', array['house-banner', 'vegan-dairy-guide'], 'other', true),
  ('ve-guide-stadium', 'House banner: the Stadium & Arena Guide', 'https://vegansexplore.com/guides/stadium-arena-guide', 've-house-banners', array['house-banner', 'stadium-arena-guide'], 'other', true),
  ('ve-creator-banner', 'House banner: Become a creator', 'https://vegansexplore.com/gigs/sample#overview', 've-house-banners', array['house-banner', 'creator'], 'other', true)
on conflict (code) do nothing;

insert into public.ad_campaigns (id, campaign_name, sponsor_name, campaign_type, creative_url, click_through_url, start_date, status, notes, sponsor_campaign_id) values
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a13001', 'Vegans Explore - The Airport Guide (house banner)', 'Vegans Explore', 'house', 'https://vegansexplore.com/public/guides/airport-guide.jpg',
   'https://vegansexplore.com/go/ve-guide-airport', '2026-10-31', 'active', 'Animated card, public/ve-promo.js GUIDE_ADS.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001'),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a13002', 'Vegans Explore - The Vegan Dairy Guide (house banner)', 'Vegans Explore', 'house', 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/guides/banners/vegan-dairy-guide.jpg',
   'https://vegansexplore.com/go/ve-guide-dairy', '2026-10-31', 'active', 'Animated card, public/ve-promo.js GUIDE_ADS.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001'),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a13003', 'Vegans Explore - The Stadium & Arena Guide (house banner)', 'Vegans Explore', 'house', 'https://vegansexplore.com/public/guides/stadium-arena-guide.jpg',
   'https://vegansexplore.com/go/ve-guide-stadium', '2026-10-31', 'active', 'Animated card, public/ve-promo.js GUIDE_ADS.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001'),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a13004', 'Vegans Explore - Become a creator (house banner)', 'Vegans Explore', 'house', 'https://vegansexplore.com/gigs/sample/img/post-kitchen.webp',
   'https://vegansexplore.com/go/ve-creator-banner', '2026-10-31', 'active', 'Animated card, public/ve-promo.js creatorCards.', '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001')
on conflict (id) do nothing;

insert into public.ad_campaign_placements (campaign_id, placement_id)
select c, p from (values
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a13001'::uuid, '7b1c4f2e-1a10-4d2e-9a51-0c0de5a12001'::uuid),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a13002'::uuid, '7b1c4f2e-1a10-4d2e-9a51-0c0de5a12001'::uuid),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a13003'::uuid, '7b1c4f2e-1a10-4d2e-9a51-0c0de5a12001'::uuid),
  ('7b1c4f2e-1a10-4d2e-9a51-0c0de5a13004'::uuid, '7b1c4f2e-1a10-4d2e-9a51-0c0de5a12002'::uuid)) v(c, p)
where not exists (select 1 from public.ad_campaign_placements x where x.campaign_id = v.c and x.placement_id = v.p);

-- A view (the banner on screen) or a click, counted for the day like ad-resolve and ad-click do. Only this sponsor campaign's own
-- campaigns, so it cannot touch any other ad's numbers (Humble Cabbage's campaigns are type house too).
create or replace function public.ve_house_ad_count(p_placement uuid, p_campaign uuid, p_kind text)
returns boolean language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'utc')::date;
begin
  if p_kind not in ('view', 'click') then return false; end if;
  if not exists (select 1 from ad_campaigns c join ad_campaign_placements cp on cp.campaign_id = c.id and cp.placement_id = p_placement
                 where c.id = p_campaign and c.sponsor_campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001' and c.status = 'active') then return false; end if;
  update ad_impressions set impressions = impressions + case when p_kind = 'view' then 1 else 0 end,
                            clicks = clicks + case when p_kind = 'click' then 1 else 0 end
   where placement_id = p_placement and campaign_id = p_campaign and log_date = d;
  if not found then
    insert into ad_impressions (placement_id, campaign_id, log_date, impressions, clicks)
    values (p_placement, p_campaign, d, case when p_kind = 'view' then 1 else 0 end, case when p_kind = 'click' then 1 else 0 end);
  end if;
  return true;
end $$;
revoke all on function public.ve_house_ad_count(uuid, uuid, text) from public;
grant execute on function public.ve_house_ad_count(uuid, uuid, text) to anon, authenticated;
