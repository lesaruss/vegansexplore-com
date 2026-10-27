-- Humble Cabbage pre-launch test campaign (Sean, 2026-10-27: "Let's just imagine Humble Cabbage wasn't one of our brands, and
-- they were a brand that wanted to test out what they could do, how many impressions, how many clicks... so that way every
-- section is filled, and we can slowly systematically update the real estate later on").
-- Every ad slot the site draws that had no ad gets a Humble Cabbage ad of its size, under the existing sponsor campaign
-- (ad_sponsor_campaigns humble-cabbage), one tracked /go/ link per page so clicks read by page. Characters are spread so no
-- page repeats its neighbour. The "$5 to the LESARUSS Foundation" art is left out (paused 2026-10-06, the charity claim).
-- Safe to run twice: links on conflict do nothing, campaigns only where the slot has no active campaign.

-- 1. One tracked link per page, the same tee as every Humble Cabbage ad.
insert into ve_links (code, label, destination, initiative_slug, tags, channel, active)
select v.code, v.label, 'https://humblecabbage.com/products/6abc6a2e5158794d5f0c9c6a', 'humble-cabbage-ads',
       array['ad','humble-cabbage','vegans-explore', v.tag], 'other', true
from (values
  ('hc-ve-events',          'Humble Cabbage ad · VE Events',                 'events'),
  ('hc-ve-all-cities',      'Humble Cabbage ad · VE Directory and Media, all cities', 'all-cities'),
  ('hc-ve-central-florida', 'Humble Cabbage ad · VE Central Florida chapter', 'central-florida'),
  ('hc-ve-atlanta',         'Humble Cabbage ad · VE Atlanta chapter',         'atlanta'),
  ('hc-ve-dmv',             'Humble Cabbage ad · VE DMV chapter',             'dmv'),
  ('hc-ve-new-york',        'Humble Cabbage ad · VE New York chapter',        'new-york'),
  ('hc-ve-philadelphia',    'Humble Cabbage ad · VE Philadelphia chapter',    'philadelphia'),
  ('hc-ve-los-angeles',     'Humble Cabbage ad · VE Los Angeles chapter',     'los-angeles'),
  ('hc-ve-london',          'Humble Cabbage ad · VE London chapter',          'london')
) v(code, label, tag)
on conflict (code) do nothing;

-- 2. The slot, the art (ad_assets label and size) and the link for each empty slot.
with plan(slot_id, asset_label, link) as (values
  ('ve-events-skyscraper',               'River',                      'hc-ve-events'),
  ('ve-directory-landscape-1',           'Maya',                       'hc-ve-all-cities'),
  ('ve-directory-landscape-2',           'River',                      'hc-ve-all-cities'),
  ('ve-sofl-hub-landscape-2',            'Nori',                       'hc-ve-sofl'),
  ('ve-central-florida-hub-skyscraper',  'Maya',                       'hc-ve-central-florida'),
  ('ve-central-florida-hub-landscape-1', 'River',                      'hc-ve-central-florida'),
  ('ve-central-florida-hub-landscape-2', 'Dani',                       'hc-ve-central-florida'),
  ('ve-atlanta-hub-skyscraper',          'Nori',                       'hc-ve-atlanta'),
  ('ve-atlanta-hub-landscape-1',         'June',                       'hc-ve-atlanta'),
  ('ve-atlanta-hub-landscape-2',         'Maya',                       'hc-ve-atlanta'),
  ('ve-dmv-hub-skyscraper',              'Pascal',                     'hc-ve-dmv'),
  ('ve-dmv-hub-landscape-1',             'Nori',                       'hc-ve-dmv'),
  ('ve-dmv-hub-landscape-2',             'Pascal and June in Natural', 'hc-ve-dmv'),
  ('ve-new-york-hub-skyscraper',         'Maya and Nori in Black',     'hc-ve-new-york'),
  ('ve-new-york-hub-landscape-1',        'Pascal',                     'hc-ve-new-york'),
  ('ve-new-york-hub-landscape-2',        'River',                      'hc-ve-new-york'),
  ('ve-philadelphia-hub-skyscraper',     'Dani',                       'hc-ve-philadelphia'),
  ('ve-philadelphia-hub-landscape-1',    'Maya',                       'hc-ve-philadelphia'),
  ('ve-philadelphia-hub-landscape-2',    'June',                       'hc-ve-philadelphia'),
  ('ve-los-angeles-hub-skyscraper',      'Pascal and June in Natural', 'hc-ve-los-angeles'),
  ('ve-los-angeles-hub-landscape-1',     'Dani',                       'hc-ve-los-angeles'),
  ('ve-los-angeles-hub-landscape-2',     'Maya and Nori in Black',     'hc-ve-los-angeles'),
  ('ve-london-hub-skyscraper',           'River',                      'hc-ve-london'),
  ('ve-london-hub-landscape-1',          'Pascal and June in Natural', 'hc-ve-london'),
  ('ve-london-hub-landscape-2',          'Nori',                       'hc-ve-london')
),
picked as (
  select p.id as placement_id, p.page_name, p.slot_id, a.id as asset_id, a.creative_url, pl.link
  from plan pl
  join ad_placements p on p.slot_id = pl.slot_id and p.brand_slug = 'vegans-explore' and p.status = 'active'
  join ad_assets a on a.sponsor_campaign_id = '2a088365-5de6-4de7-abbc-a5f8bac0eddb' and a.label = pl.asset_label
       and a.dimensions = replace(p.dimensions, ' ', '') and a.status = 'active'
  where not exists (select 1 from ad_campaign_placements cp join ad_campaigns c on c.id = cp.campaign_id
                    where cp.placement_id = p.id and c.status = 'active')
),
made as (
  insert into ad_campaigns (campaign_name, sponsor_name, campaign_type, creative_url, click_through_url, start_date, status, notes, sponsor_campaign_id, asset_id)
  select 'Humble Cabbage - VE Tee (' || page_name || ', ' || slot_id || ')', 'Humble Cabbage', 'house', creative_url,
         'https://vegansexplore.com/go/' || link, date '2026-10-27', 'active',
         'Sean 2026-10-27: pre-launch test campaign, every empty slot filled as if Humble Cabbage were an outside brand testing '
         || 'impressions and clicks. Clicks tracked by /go/' || link || ' (initiative humble-cabbage-ads). Replace slot by slot as real '
         || 'advertisers come in. Destination: humblecabbage.com VE Stacked Logo Tee.',
         '2a088365-5de6-4de7-abbc-a5f8bac0eddb', asset_id
  from picked
  returning id, campaign_name
)
insert into ad_campaign_placements (campaign_id, placement_id)
select m.id, p.placement_id from made m join picked p on m.campaign_name = 'Humble Cabbage - VE Tee (' || p.page_name || ', ' || p.slot_id || ')';
