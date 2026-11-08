-- ve-daily-pulse (and ve-holiday-guide): the Pulse's From Vegans Explore goes visual, and the Holiday Guide takes the Nonprofit Guide's ad slots (Sean, 2026-11-08).
-- Applied live through the connector 2026-11-08.

-- 1. ve_pulse_house keeps up to 12 new places, logos first (the page draws them as a sliding row of Directory cards with Vote).
--    Applied as a text replace of the function body:
--      x gains l.logo_url; "order by listed_at desc ... limit 5" became "order by (logo_url is null), listed_at desc ... limit 12".

-- 2. The Holiday Guide ad (ads/guides/guide.html?g=holiday-guide) replaces the Nonprofit Guide in its three slots.
insert into ve_links (code, tags, label, active, channel, destination, initiative_slug)
values ('ve-guide-holiday', array['house-banner','holiday-guide'], 'House banner: the Holiday Guide', true, 'other', 'https://vegansexplore.com/guides/holiday-guide', 've-house-banners')
on conflict (code) do nothing;
insert into ad_campaigns (id, campaign_name, sponsor_name, campaign_type, creative_url, click_through_url, start_date, status, notes, sponsor_campaign_id)
select '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14008', 'Vegans Explore - The Holiday Guide (ad rails)', sponsor_name, 'house', 'https://vegansexplore.com/ads/guides/guide.html?g=holiday-guide',
 'https://vegansexplore.com/go/ve-guide-holiday', '2026-11-08', 'active', 'Sean, 2026-11-08: replaces the Nonprofit Guide in its slots (a door Guide for direct outreach).', sponsor_campaign_id
from ad_campaigns where id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14005'
on conflict (id) do nothing;
update ad_campaign_placements set campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14008' where campaign_id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14005';
update ad_campaigns set status = 'paused' where id = '7b1c4f2e-1a10-4d2e-9a51-0c0de5a14005';
-- Slots now on the Holiday Guide: pulse:skyscraper, washington-dc hub skyscraper, maryland hub landscape-1.
