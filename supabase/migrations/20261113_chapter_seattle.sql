-- Seattle joins as a chapter (Sean, 2026-11-13: "start the Seattle city page"; the first of the cities opened because Next Level
-- Veggie Grill is there). Copied from 20261027_chapters_delaware_west_virginia.sql. Slug seattle, Washington state (WA), as in
-- /public/ve-hubs.js. Each step is safe to run twice. The local Daily Pulse (step 3 there) waits for the public opening.

-- 1. Who can call a chapter home.
alter table public.member_communities drop constraint if exists member_communities_community_slug_check;
alter table public.member_communities add constraint member_communities_community_slug_check check (community_slug = any (array['atlanta','central-florida','north-florida','washington-dc','delaware','maryland','virginia','west-virginia','london','los-angeles','new-york','philadelphia','south-florida','seattle']));
alter table public.members drop constraint if exists members_home_community_check;
alter table public.members add constraint members_home_community_check check (home_community is null or home_community = any (array['atlanta','central-florida','north-florida','washington-dc','delaware','maryland','virginia','west-virginia','london','los-angeles','new-york','philadelphia','south-florida','seattle']));

-- 2. The board opens on its pinned How it works posts, copied from Washington, D.C.'s.
insert into public.ve_board_posts (community_slug, member_id, kind, category, title, body, status, pinned)
select 'seattle', p.member_id, p.kind, p.category, replace(p.title, 'Washington, D.C.', 'Seattle'), replace(p.body, 'Washington, D.C.', 'Seattle'), p.status, true
from public.ve_board_posts p
where p.community_slug = 'washington-dc' and p.pinned and p.category = 'guide'
  and not exists (select 1 from public.ve_board_posts q where q.community_slug = 'seattle' and q.kind = p.kind and q.pinned and q.category = 'guide');

-- 3. Business outreach and the monthly check-ups (off until Sean turns them on).
insert into public.ve_outreach_cities (community_slug, name, kind, brand, program, states, cities, enabled, daily_cap)
values ('seattle', 'Seattle', 'city', 'vegans-explore', 'business-outreach', array['WA'], null, false, 30)
on conflict (community_slug) do nothing;
update public.ve_outreach_contacts set community_slug = 'seattle'
  from public.listings l where l.id = ve_outreach_contacts.listing_id and l.address_state = 'WA'
  and ve_outreach_contacts.community_slug is distinct from 'seattle';

-- 4. The three ad slots, filled the way Los Angeles is today: the house Guide ads on the skyscraper and the first landscape,
--    Humble Cabbage's Vegans Explore Tee on the second (its own tracked link, /go/hc-ve-seattle).
insert into public.ad_placements (brand_slug, site_name, site_url, page_name, page_slug, slot_id, slot_position, dimensions, status, estimated_monthly_views, notes)
select 'vegans-explore', 'VEGANS EXPLORE', 'https://vegansexplore.com', 'Community Hub - Seattle', '/communities/seattle', 've-seattle-hub-' || s.slot,
       'sticky-sidebar', s.dim, 'active', 0, 'Billboard on the shared city hub (communities/hub.html), added 2026-11-13 with the chapter (Sean: Seattle); the landscape pair is also the chapter rail on /directory.'
from (values ('skyscraper', '300x600'), ('landscape-1', '300x250'), ('landscape-2', '300x250')) s(slot, dim)
where not exists (select 1 from public.ad_placements p where p.slot_id = 've-seattle-hub-' || s.slot);
insert into public.ve_links (code, label, destination, initiative_slug, tags, channel, active)
values ('hc-ve-seattle', 'Humble Cabbage ad · VE Seattle chapter', 'https://humblecabbage.com/products/6abc6a2e5158794d5f0c9c6a', 'humble-cabbage-ads', array['ad','humble-cabbage','vegans-explore','seattle'], 'other', true)
on conflict (code) do nothing;
-- The house Guide campaigns already run on many rails: Seattle's slots join the same ones as Los Angeles's.
insert into public.ad_campaign_placements (campaign_id, placement_id)
select cp.campaign_id, sp.id
from public.ad_placements lp
join public.ad_campaign_placements cp on cp.placement_id = lp.id
join public.ad_campaigns c on c.id = cp.campaign_id and c.status = 'active' and c.sponsor_campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001'
join public.ad_placements sp on sp.slot_id = replace(lp.slot_id, 've-los-angeles-hub-', 've-seattle-hub-')
where lp.slot_id like 've-los-angeles-hub-%'
  and not exists (select 1 from public.ad_campaign_placements x where x.placement_id = sp.id and x.campaign_id = cp.campaign_id);
with src as (
  select c.* from public.ad_campaigns c join public.ad_campaign_placements cp on cp.campaign_id = c.id
  join public.ad_placements p on p.id = cp.placement_id and p.slot_id = 've-los-angeles-hub-landscape-2' where c.status = 'active' limit 1
), tgt as (select id from public.ad_placements where slot_id = 've-seattle-hub-landscape-2'),
made as (
  insert into public.ad_campaigns (campaign_name, sponsor_name, campaign_type, creative_url, click_through_url, start_date, status, notes, sponsor_campaign_id, asset_id)
  select 'Humble Cabbage - VE Tee (Community Hub - Seattle, ve-seattle-hub-landscape-2)', s.sponsor_name, s.campaign_type,
         replace(s.creative_url, 'c=maya', 'c=nori'), 'https://vegansexplore.com/go/hc-ve-seattle', date '2026-11-13', 'active',
         'Copied from Los Angeles landscape-2 when Seattle opened (2026-11-13). Clicks tracked by /go/hc-ve-seattle.', s.sponsor_campaign_id, s.asset_id
  from src s
  where not exists (select 1 from public.ad_campaign_placements cp join public.ad_campaigns c on c.id = cp.campaign_id join tgt on tgt.id = cp.placement_id
                    where c.status = 'active' and c.sponsor_campaign_id = '2a088365-5de6-4de7-abbc-a5f8bac0eddb')
  returning id
)
insert into public.ad_campaign_placements (campaign_id, placement_id) select made.id, tgt.id from made, tgt;
