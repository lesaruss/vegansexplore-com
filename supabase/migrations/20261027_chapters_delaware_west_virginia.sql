-- Delaware and West Virginia join as chapters (Sean, 2026-10-27: "We can keep Delaware. We can keep Maryland. And Virginia, of course,
-- West Virginia. Might as well throw West Virginia in there"). Set up like Maryland and Virginia. Same slugs as /public/ve-hubs.js.
-- Each step is safe to run twice.

-- 1. Who can call a chapter home.
alter table public.member_communities drop constraint if exists member_communities_community_slug_check;
alter table public.member_communities add constraint member_communities_community_slug_check check (community_slug = any (array['atlanta','central-florida','north-florida','washington-dc','delaware','maryland','virginia','west-virginia','london','los-angeles','new-york','philadelphia','south-florida']));
alter table public.members drop constraint if exists members_home_community_check;
alter table public.members add constraint members_home_community_check check (home_community is null or home_community = any (array['atlanta','central-florida','north-florida','washington-dc','delaware','maryland','virginia','west-virginia','london','los-angeles','new-york','philadelphia','south-florida']));

-- 2. Each board opens on its pinned How it works posts, copied from Washington, D.C.'s.
insert into public.ve_board_posts (community_slug, member_id, kind, category, title, body, status, pinned)
select c.slug, p.member_id, p.kind, p.category, replace(p.title, 'Washington, D.C.', c.name), replace(p.body, 'Washington, D.C.', c.name), p.status, true
from public.ve_board_posts p
cross join (values ('delaware', 'Delaware'), ('west-virginia', 'West Virginia')) c(slug, name)
where p.community_slug = 'washington-dc' and p.pinned and p.category = 'guide'
  and not exists (select 1 from public.ve_board_posts q where q.community_slug = c.slug and q.kind = p.kind and q.pinned and q.category = 'guide');

-- 3. The local Daily Pulse.
update public.lesaruss_dispatch_settings set value = jsonb_set(value::jsonb, '{communities}',
  '["national","south-florida","central-florida","north-florida","atlanta","washington-dc","delaware","maryland","virginia","west-virginia","new-york","philadelphia","los-angeles","london"]'::jsonb)::text
  where key = 'pulse_auto';

-- 4. Business outreach and the monthly check-ups (off until Sean turns them on).
insert into public.ve_outreach_cities (community_slug, name, kind, brand, program, states, cities, enabled, daily_cap)
values ('delaware', 'Delaware', 'city', 'vegans-explore', 'business-outreach', array['DE'], null, false, 30),
       ('west-virginia', 'West Virginia', 'city', 'vegans-explore', 'business-outreach', array['WV'], null, false, 30)
on conflict (community_slug) do nothing;
update public.ve_outreach_contacts set community_slug = case l.address_state when 'DE' then 'delaware' else 'west-virginia' end
  from public.listings l where l.id = ve_outreach_contacts.listing_id and l.address_state in ('DE', 'WV')
  and ve_outreach_contacts.community_slug is distinct from case l.address_state when 'DE' then 'delaware' else 'west-virginia' end;

-- 5. Each chapter's three ad slots, filled with Humble Cabbage (Sean, 2026-10-27: every slot filled).
insert into public.ad_placements (brand_slug, site_name, site_url, page_name, page_slug, slot_id, slot_position, dimensions, status, estimated_monthly_views, notes)
select 'vegans-explore', 'VEGANS EXPLORE', 'https://vegansexplore.com', 'Community Hub - ' || c.name, '/communities/' || c.slug, 've-' || c.slug || '-hub-' || s.slot,
       'sticky-sidebar', s.dim, 'active', 0, 'Billboard on the shared city hub (communities/hub.html), added 2026-10-27 with the chapter (Sean: Delaware and West Virginia); the landscape pair is also the chapter rail on /directory.'
from (values ('delaware', 'Delaware'), ('west-virginia', 'West Virginia')) c(slug, name)
cross join (values ('skyscraper', '300x600'), ('landscape-1', '300x250'), ('landscape-2', '300x250')) s(slot, dim)
where not exists (select 1 from public.ad_placements p where p.slot_id = 've-' || c.slug || '-hub-' || s.slot);
insert into public.ve_links (code, label, destination, initiative_slug, tags, channel, active)
select v.code, v.label, 'https://humblecabbage.com/products/6abc6a2e5158794d5f0c9c6a', 'humble-cabbage-ads', array['ad','humble-cabbage','vegans-explore', v.tag], 'other', true
from (values ('hc-ve-delaware', 'Humble Cabbage ad · VE Delaware chapter', 'delaware'),
             ('hc-ve-west-virginia', 'Humble Cabbage ad · VE West Virginia chapter', 'west-virginia')) v(code, label, tag)
on conflict (code) do nothing;
with plan(slot_id, asset_label, link) as (values
  ('ve-delaware-hub-skyscraper', 'Dani', 'hc-ve-delaware'), ('ve-delaware-hub-landscape-1', 'Pascal', 'hc-ve-delaware'), ('ve-delaware-hub-landscape-2', 'Maya', 'hc-ve-delaware'),
  ('ve-west-virginia-hub-skyscraper', 'River', 'hc-ve-west-virginia'), ('ve-west-virginia-hub-landscape-1', 'Nori', 'hc-ve-west-virginia'), ('ve-west-virginia-hub-landscape-2', 'June', 'hc-ve-west-virginia')
), picked as (
  select p.id as placement_id, p.page_name, p.slot_id, a.id as asset_id, a.creative_url, pl.link
  from plan pl
  join public.ad_placements p on p.slot_id = pl.slot_id and p.brand_slug = 'vegans-explore' and p.status = 'active'
  join public.ad_assets a on a.sponsor_campaign_id = '2a088365-5de6-4de7-abbc-a5f8bac0eddb' and a.label = pl.asset_label
       and a.dimensions = replace(p.dimensions, ' ', '') and a.status = 'active'
  where not exists (select 1 from public.ad_campaign_placements cp join public.ad_campaigns c on c.id = cp.campaign_id where cp.placement_id = p.id and c.status = 'active')
), made as (
  insert into public.ad_campaigns (campaign_name, sponsor_name, campaign_type, creative_url, click_through_url, start_date, status, notes, sponsor_campaign_id, asset_id)
  select 'Humble Cabbage - VE Tee (' || page_name || ', ' || slot_id || ')', 'Humble Cabbage', 'house', creative_url, 'https://vegansexplore.com/go/' || link, date '2026-10-27', 'active',
         'Sean 2026-10-27: pre-launch test campaign, every empty slot filled. Clicks tracked by /go/' || link || ' (initiative humble-cabbage-ads). Replace as real advertisers come in.',
         '2a088365-5de6-4de7-abbc-a5f8bac0eddb', asset_id
  from picked returning id, campaign_name
)
insert into public.ad_campaign_placements (campaign_id, placement_id)
select m.id, p.placement_id from made m join picked p on m.campaign_name = 'Humble Cabbage - VE Tee (' || p.page_name || ', ' || p.slot_id || ')';
