-- The DMV becomes three chapters, Washington, D.C., Maryland and Virginia, and North Florida joins (Sean, 2026-10-27: "separate the
-- DMV to be the individual major hubs... set up just like Philadelphia... and then we could do North Florida as well... closing out
-- the state of Florida"). Same slugs as /public/ve-hubs.js. Each step is safe to run twice.

-- 1. Who can call a chapter home.
alter table public.members drop constraint if exists members_home_community_check;
alter table public.member_communities drop constraint if exists member_communities_community_slug_check;
update public.member_communities set community_slug = 'washington-dc' where community_slug = 'dmv'
  and not exists (select 1 from public.member_communities m2 where m2.member_id = member_communities.member_id and m2.community_slug = 'washington-dc');
delete from public.member_communities where community_slug = 'dmv';
alter table public.member_communities add constraint member_communities_community_slug_check check (community_slug = any (array['atlanta','central-florida','north-florida','washington-dc','maryland','virginia','london','los-angeles','new-york','philadelphia','south-florida']));
update public.members set home_community = 'washington-dc' where home_community = 'dmv';
alter table public.members add constraint members_home_community_check check (home_community is null or home_community = any (array['atlanta','central-florida','north-florida','washington-dc','maryland','virginia','london','los-angeles','new-york','philadelphia','south-florida']));

-- 2. The DMV's rows go to Washington, D.C. (its board, feeds, sources and roles were D.C.'s in practice).
update public.ve_board_posts set title = replace(title, 'DMV', 'Washington, D.C.'), body = replace(body, 'DMV', 'Washington, D.C.')
  where community_slug = 'dmv' and pinned and category = 'guide';
update public.ve_board_posts set community_slug = 'washington-dc' where community_slug = 'dmv';
update public.ve_event_sources set city_slug = 'washington-dc' where city_slug = 'dmv';
update public.ve_news_feeds set city_slug = 'washington-dc' where city_slug = 'dmv';
update public.opportunities set city_slug = 'washington-dc' where city_slug = 'dmv';
update public.listings set communities = array_replace(communities, 'dmv', 'washington-dc') where communities @> array['dmv'];

-- 3. Every new chapter's board opens on its pinned How it works posts, copied from Washington, D.C.'s.
insert into public.ve_board_posts (community_slug, member_id, kind, category, title, body, status, pinned)
select c.slug, p.member_id, p.kind, p.category, replace(p.title, 'Washington, D.C.', c.name), replace(p.body, 'Washington, D.C.', c.name), p.status, true
from public.ve_board_posts p
cross join (values ('maryland', 'Maryland'), ('virginia', 'Virginia'), ('north-florida', 'North Florida')) c(slug, name)
where p.community_slug = 'washington-dc' and p.pinned and p.category = 'guide'
  and not exists (select 1 from public.ve_board_posts q where q.community_slug = c.slug and q.kind = p.kind and q.pinned and q.category = 'guide');

-- 4. The local Daily Pulse in every chapter.
update public.lesaruss_dispatch_settings set value = jsonb_set(value::jsonb, '{communities}',
  '["national","south-florida","central-florida","north-florida","atlanta","washington-dc","maryland","virginia","new-york","philadelphia","los-angeles","london"]'::jsonb)::text
  where key = 'pulse_auto';

-- 5. Business outreach and the monthly check-ups, city by city (every city off until Sean turns it on).
insert into public.ve_outreach_cities (community_slug, name, kind, brand, program, states, cities, enabled, daily_cap)
values ('washington-dc', 'Washington, D.C.', 'city', 'vegans-explore', 'business-outreach', array['DC'], null, false, 30),
       ('maryland', 'Maryland', 'city', 'vegans-explore', 'business-outreach', array['MD'], null, false, 30),
       ('virginia', 'Virginia', 'city', 'vegans-explore', 'business-outreach', array['VA'], null, false, 30),
       ('north-florida', 'North Florida', 'city', 'vegans-explore', 'business-outreach', array['FL'], array['Jacksonville','Jacksonville Beach','Atlantic Beach','Neptune Beach','Ponte Vedra','Ponte Vedra Beach','St. Augustine','Saint Augustine','St. Augustine Beach','Fernandina Beach','Amelia Island','Yulee','Orange Park','Fleming Island','Middleburg','Palm Coast','Flagler Beach','Gainesville','Alachua','Newberry','High Springs','Micanopy','Lake City','Live Oak','Tallahassee','Quincy','Pensacola','Pensacola Beach','Gulf Breeze','Navarre','Milton','Pace','Fort Walton Beach','Destin','Niceville','Crestview','Santa Rosa Beach','Miramar Beach','Panama City','Panama City Beach','Lynn Haven','Port St. Joe','Apalachicola']::text[], false, 30)
on conflict (community_slug) do nothing;
update public.ve_outreach_contacts set community_slug = case when l.address_state = 'MD' then 'maryland' when l.address_state = 'VA' then 'virginia' else 'washington-dc' end
  from public.listings l where l.id = ve_outreach_contacts.listing_id and ve_outreach_contacts.community_slug = 'dmv';
update public.ve_outreach_contacts set community_slug = 'washington-dc' where community_slug = 'dmv';
update public.ve_outreach_batches set community_slug = 'washington-dc' where community_slug = 'dmv';
delete from public.ve_outreach_cities where community_slug = 'dmv';
-- Florida closed out: South Florida takes the Treasure Coast and the Keys, Central Florida Tampa Bay, the Space Coast and the Gulf.
update public.ve_outreach_cities set cities = array['Miami','Miami Beach','North Miami','North Miami Beach','Aventura','Bal Harbour','Sunny Isles Beach','Surfside','Doral','Hialeah','Miami Gardens','Miami Lakes','Miami Springs','Coral Gables','South Miami','Key Biscayne','Pinecrest','Palmetto Bay','Cutler Bay','Homestead','Florida City','Fort Lauderdale','Hollywood','Sunrise','Pompano Beach','Coral Springs','Margate','Miramar','Pembroke Pines','Weston','Davie','Cooper City','Plantation','Lauderhill','Lauderdale Lakes','North Lauderdale','Tamarac','Oakland Park','Wilton Manors','Dania Beach','Hallandale','Hallandale Beach','Deerfield Beach','Lighthouse Point','Coconut Creek','Parkland','Lauderdale-by-the-Sea','Southwest Ranches','West Palm Beach','Boca Raton','Delray Beach','Boynton Beach','Palm Beach Gardens','Jupiter','Lake Worth','Lake Worth Beach','Tequesta','Loxahatchee','Riviera Beach','Royal Palm Beach','Wellington','North Palm Beach','Palm Beach','Greenacres','Lantana','Lake Park','Juno Beach','Palm Springs','Highland Beach','Belle Glade','Port St. Lucie','Port Saint Lucie','Stuart','Palm City','Jensen Beach','Hobe Sound','Fort Pierce','Vero Beach','Sebastian','Loxahatchee Groves','South Florida','Key West','Key Largo','Marathon','Islamorada']::text[] where community_slug = 'south-florida';
update public.ve_outreach_cities set cities = array['Orlando','Altamonte Springs','Apopka','Lakeland','The Villages','Winter Haven','Ocala','Sanford','Oviedo','Winter Park','Winter Garden','Kissimmee','Celebration','Clermont','Maitland','Longwood','Casselberry','Lake Mary','Windermere','Ocoee','Leesburg','Mount Dora','Eustis','Haines City','Bartow','Davenport','Sebring','Tampa','St. Petersburg','Saint Petersburg','Clearwater','Clearwater Beach','Largo','Dunedin','Palm Harbor','Tarpon Springs','Brandon','Riverview','Wesley Chapel','Land O'' Lakes','Lutz','Plant City','Temple Terrace','New Port Richey','Bradenton','Sarasota','Venice','North Port','Myakka City','Duette','Punta Gorda','Port Charlotte','Fort Myers','Cape Coral','Naples','Bonita Springs','Estero','Daytona Beach','Ormond Beach','Port Orange','New Smyrna Beach','DeLand','Deltona','Melbourne','Titusville','Cocoa','Cocoa Beach','Palm Bay']::text[] where community_slug = 'central-florida';

-- 6. Each chapter's three ad slots. The DMV's become Washington, D.C.'s (their Humble Cabbage ads stay on them).
update public.ad_placements set slot_id = replace(slot_id, 've-dmv-hub', 've-washington-dc-hub'), page_slug = '/communities/washington-dc',
  page_name = 'Community Hub - Washington, D.C.' where slot_id like 've-dmv-hub-%';
insert into public.ad_placements (brand_slug, site_name, site_url, page_name, page_slug, slot_id, slot_position, dimensions, status, estimated_monthly_views, notes)
select 'vegans-explore', 'VEGANS EXPLORE', 'https://vegansexplore.com', 'Community Hub - ' || c.name, '/communities/' || c.slug, 've-' || c.slug || '-hub-' || s.slot,
       'sticky-sidebar', s.dim, 'active', 0, 'Billboard on the shared city hub (communities/hub.html), added 2026-10-27 with the chapter (Sean: the DMV split, North Florida); the landscape pair is also the chapter rail on /directory.'
from (values ('maryland', 'Maryland'), ('virginia', 'Virginia'), ('north-florida', 'North Florida')) c(slug, name)
cross join (values ('skyscraper', '300x600'), ('landscape-1', '300x250'), ('landscape-2', '300x250')) s(slot, dim)
where not exists (select 1 from public.ad_placements p where p.slot_id = 've-' || c.slug || '-hub-' || s.slot);
-- Every slot filled (Sean, 2026-10-27): Humble Cabbage, one tracked link per chapter, as in 20261027_humble_cabbage_test_campaign.sql.
insert into public.ve_links (code, label, destination, initiative_slug, tags, channel, active)
select v.code, v.label, 'https://humblecabbage.com/products/6abc6a2e5158794d5f0c9c6a', 'humble-cabbage-ads', array['ad','humble-cabbage','vegans-explore', v.tag], 'other', true
from (values ('hc-ve-washington-dc', 'Humble Cabbage ad · VE Washington, D.C. chapter', 'washington-dc'),
             ('hc-ve-maryland', 'Humble Cabbage ad · VE Maryland chapter', 'maryland'),
             ('hc-ve-virginia', 'Humble Cabbage ad · VE Virginia chapter', 'virginia'),
             ('hc-ve-north-florida', 'Humble Cabbage ad · VE North Florida chapter', 'north-florida')) v(code, label, tag)
on conflict (code) do nothing;
with plan(slot_id, asset_label, link) as (values
  ('ve-maryland-hub-skyscraper', 'River', 'hc-ve-maryland'), ('ve-maryland-hub-landscape-1', 'June', 'hc-ve-maryland'), ('ve-maryland-hub-landscape-2', 'Pascal', 'hc-ve-maryland'),
  ('ve-virginia-hub-skyscraper', 'Dani', 'hc-ve-virginia'), ('ve-virginia-hub-landscape-1', 'Maya', 'hc-ve-virginia'), ('ve-virginia-hub-landscape-2', 'River', 'hc-ve-virginia'),
  ('ve-north-florida-hub-skyscraper', 'Maya and Nori in Black', 'hc-ve-north-florida'), ('ve-north-florida-hub-landscape-1', 'Dani', 'hc-ve-north-florida'), ('ve-north-florida-hub-landscape-2', 'Nori', 'hc-ve-north-florida')
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

-- 7. Reach (Sean, 2026-10-27: "Florida Animal Rescue Alliance... operates the entirety of Florida"; "the Humane League, there's some
-- that activate in multiple places"). Organizations that work statewide or nationally read like brands, not by their headquarters.
update public.listings set communities = array['south-florida','central-florida','north-florida']
  where status = 'approved' and slug in ('florida-animal-rescue-alliance', 'the-muscovy-sanctuary-of-florida');
update public.listings set communities = array['all']
  where status = 'approved' and slug in ('animal-welfare-institute', 'defenders-of-wildlife', 'international-fund-for-animal-welfare', 'ifaw',
    'farm-animal-rights-movement', 'world-animal-protection', 'spca-international', 'animal-equality', 'animal-defenders-international',
    'animal-defenders-international-inc', 'american-vegan-society', 'north-american-vegetarian-soc', 'american-anti-vivisection-society',
    'cruelty-free-international', 'american-society-for-the-prevention-of-cruelty-to-animals', 'national-coalition-on-violence-against-animals')
  and not (communities @> array['all']);
