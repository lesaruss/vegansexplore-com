-- Portland joins as a chapter (Sean, 2026-11-14: "open the next Vegans Explore chapters with the Seattle recipe, Portland first";
-- Next Level Veggie Grill is there: Downtown Portland and Hawthorne). Copied from 20261113_chapter_seattle.sql. Slug portland,
-- all of Oregon (OR), as in /public/ve-hubs.js. Steps 1 to 4 run before the opening, each safe to run twice; step 5 waits for
-- Sean's "open".

-- 1. Who can call a chapter home.
alter table public.member_communities drop constraint if exists member_communities_community_slug_check;
alter table public.member_communities add constraint member_communities_community_slug_check check (community_slug = any (array['atlanta','central-florida','north-florida','washington-dc','delaware','maryland','virginia','west-virginia','london','los-angeles','new-york','philadelphia','south-florida','seattle','portland']));
alter table public.members drop constraint if exists members_home_community_check;
alter table public.members add constraint members_home_community_check check (home_community is null or home_community = any (array['atlanta','central-florida','north-florida','washington-dc','delaware','maryland','virginia','west-virginia','london','los-angeles','new-york','philadelphia','south-florida','seattle','portland']));

-- 2. The board opens on its pinned How it works posts, copied from Washington, D.C.'s.
insert into public.ve_board_posts (community_slug, member_id, kind, category, title, body, status, pinned)
select 'portland', p.member_id, p.kind, p.category, replace(p.title, 'Washington, D.C.', 'Portland'), replace(p.body, 'Washington, D.C.', 'Portland'), p.status, true
from public.ve_board_posts p
where p.community_slug = 'washington-dc' and p.pinned and p.category = 'guide'
  and not exists (select 1 from public.ve_board_posts q where q.community_slug = 'portland' and q.kind = p.kind and q.pinned and q.category = 'guide');

-- 3. Business outreach and the monthly check-ups (off until Sean turns them on).
insert into public.ve_outreach_cities (community_slug, name, kind, brand, program, states, cities, enabled, daily_cap)
values ('portland', 'Portland', 'city', 'vegans-explore', 'business-outreach', array['OR'], null, false, 30)
on conflict (community_slug) do nothing;
update public.ve_outreach_contacts set community_slug = 'portland'
  from public.listings l where l.id = ve_outreach_contacts.listing_id and l.address_state = 'OR'
  and ve_outreach_contacts.community_slug is distinct from 'portland';

-- 4. The three ad slots, filled the way Los Angeles is today: the house Guide ads on the skyscraper and the first landscape,
--    Humble Cabbage's Vegans Explore Tee on the second (its own tracked link, /go/hc-ve-portland).
insert into public.ad_placements (brand_slug, site_name, site_url, page_name, page_slug, slot_id, slot_position, dimensions, status, estimated_monthly_views, notes)
select 'vegans-explore', 'VEGANS EXPLORE', 'https://vegansexplore.com', 'Community Hub - Portland', '/communities/portland', 've-portland-hub-' || s.slot,
       'sticky-sidebar', s.dim, 'active', 0, 'Billboard on the shared city hub (communities/hub.html), added 2026-11-14 with the chapter (Sean: Portland); the landscape pair is also the chapter rail on /directory.'
from (values ('skyscraper', '300x600'), ('landscape-1', '300x250'), ('landscape-2', '300x250')) s(slot, dim)
where not exists (select 1 from public.ad_placements p where p.slot_id = 've-portland-hub-' || s.slot);
insert into public.ve_links (code, label, destination, initiative_slug, tags, channel, active)
values ('hc-ve-portland', 'Humble Cabbage ad · VE Portland chapter', 'https://humblecabbage.com/products/6abc6a2e5158794d5f0c9c6a', 'humble-cabbage-ads', array['ad','humble-cabbage','vegans-explore','portland'], 'other', true)
on conflict (code) do nothing;
-- The house Guide campaigns already run on many rails: Portland's slots join the same ones as Los Angeles's.
insert into public.ad_campaign_placements (campaign_id, placement_id)
select cp.campaign_id, sp.id
from public.ad_placements lp
join public.ad_campaign_placements cp on cp.placement_id = lp.id
join public.ad_campaigns c on c.id = cp.campaign_id and c.status = 'active' and c.sponsor_campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a11001'
join public.ad_placements sp on sp.slot_id = replace(lp.slot_id, 've-los-angeles-hub-', 've-portland-hub-')
where lp.slot_id like 've-los-angeles-hub-%'
  and not exists (select 1 from public.ad_campaign_placements x where x.placement_id = sp.id and x.campaign_id = cp.campaign_id);
with src as (
  select c.* from public.ad_campaigns c join public.ad_campaign_placements cp on cp.campaign_id = c.id
  join public.ad_placements p on p.id = cp.placement_id and p.slot_id = 've-los-angeles-hub-landscape-2' where c.status = 'active' limit 1
), tgt as (select id from public.ad_placements where slot_id = 've-portland-hub-landscape-2'),
made as (
  insert into public.ad_campaigns (campaign_name, sponsor_name, campaign_type, creative_url, click_through_url, start_date, status, notes, sponsor_campaign_id, asset_id)
  select 'Humble Cabbage - VE Tee (Community Hub - Portland, ve-portland-hub-landscape-2)', s.sponsor_name, s.campaign_type,
         replace(s.creative_url, 'c=maya', 'c=nori'), 'https://vegansexplore.com/go/hc-ve-portland', date '2026-11-14', 'active',
         'Copied from Los Angeles landscape-2 when Portland opened (2026-11-14). Clicks tracked by /go/hc-ve-portland.', s.sponsor_campaign_id, s.asset_id
  from src s
  where not exists (select 1 from public.ad_campaign_placements cp join public.ad_campaigns c on c.id = cp.campaign_id join tgt on tgt.id = cp.placement_id
                    where c.status = 'active' and c.sponsor_campaign_id = '2a088365-5de6-4de7-abbc-a5f8bac0eddb')
  returning id
)
insert into public.ad_campaign_placements (campaign_id, placement_id) select made.id, tgt.id from made, tgt;

-- 5. At the opening (on Sean's "open"; not run until then): the local Daily Pulse, the next-chapter board, and the three
--    database functions that list chapters by hand.
update public.lesaruss_dispatch_settings set value = jsonb_set(value::jsonb, '{communities}', (value::jsonb->'communities') || '["portland"]'::jsonb)::text
  where key = 'pulse_auto' and not (value::jsonb->'communities') ? 'portland';
update public.ve_next_chapters set status = 'opened', opened_hub = 'portland' where slug = 'oregon' and status <> 'opened';
do $$
declare d text;
begin
  d := pg_get_functiondef('public.ve_chapter_stats'::regproc);
  if position('''portland''' in d) = 0 then execute replace(d, '''seattle'',''london'']', '''seattle'',''portland'',''london'']'); end if;
  d := pg_get_functiondef('public.ve_pulse_auto_queue'::regproc);
  if position('"portland"' in d) = 0 then execute replace(d, '"seattle":"Seattle Pulse",', '"seattle":"Seattle Pulse","portland":"Portland Pulse",'); end if;
  d := pg_get_functiondef('public.ve_creator_application_link'::regproc);
  if position('''portland''' in d) = 0 then execute replace(d, 'when ''seattle'' then ''WA''', 'when ''seattle'' then ''WA'' when ''portland'' then ''OR'''); end if;
end $$;
