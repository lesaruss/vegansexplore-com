-- Vegan Squad Retreat as a partnered event (Sean, 2026-11-19: "Let's treat this like a partnered event and run some ads as well.
-- That's $250 for us if they sign up, so it's worth putting it in some spots. Let's also mention them in our next Vegans Explore Podcast.")
--
-- Facts (vegansquadcoaching.com/retreat and /retreatinfluencer, read through ve-web-reader 2026-11-19): $2,000 ticket, ambassadors earn
-- $500 a ticket; our code VEGANSEXPLORE gives the buyer $250 off and leaves $250 to Vegans Explore. Check-out Monday Feb 1 by 11 AM Eastern.
--
-- 1. The event: checkout time 11 AM Eastern (was noon), the venue picture (Vegan Squad's own, their approved media folder), featured.
-- 2. A sponsor campaign `vegan-squad-retreat` with one HTML5 ad (/ads/partners/vegan-squad-retreat.html, a copy of the kit-template
--    sponsor ad /ads/humble-cabbage/ve-tee.html) in the four tall slots nearest the buyers: /events and the South, Central and North
--    Florida hubs. ad-resolve serves the newest active campaign in a slot, so these take the slot until end_date 2027-01-28, then the
--    Guide campaigns underneath come back by themselves. Each slot clicks through its own tracked /go/ link to our event page (the code
--    and the commission line are there), initiative `vegan-squad-retreat`.
-- Safe to run twice.

update events
   set ends_at = '2027-02-01 16:00:00+00',
       image_url = 'https://vegansexplore.com/public/events/vegan-squad-retreat/lake.jpg',
       image_alt_text = 'Orange Springs Retreat Center from above: the spring-fed lake, the lodge and the grounds',
       is_featured = true,
       updated_at = now()
 where id = 'c80c68ab-8ad8-4218-bd96-5f474da4e64c';

insert into ad_sponsor_campaigns (slug, name, sponsor_name, status, paid, start_date, end_date, goal, notes, default_link, link_initiative)
values ('vegan-squad-retreat', 'Vegan Squad Retreat 2027 (partner event)', 'Vegan Squad', 'active', false, '2026-11-19', '2027-01-28',
        'Retreat tickets bought with code VEGANSEXPLORE ($250 to Vegans Explore each)',
        'Partnered event, not a paid buy: Vegans Explore earns $250 per ticket bought with its code. Sean, 2026-11-19.',
        'https://vegansexplore.com/events?event=c80c68ab-8ad8-4218-bd96-5f474da4e64c', 'vegan-squad-retreat')
on conflict (slug) do nothing;

insert into ve_links (code, label, destination, initiative_slug, tags, channel, active)
select v.code, v.label, 'https://vegansexplore.com/events?event=c80c68ab-8ad8-4218-bd96-5f474da4e64c', 'vegan-squad-retreat',
       array['partner-event', 'vegan-squad', 'ad-rail', v.tag], 'other', true
  from (values ('vsr-ve-events', 'Vegan Squad Retreat ad: /events', 'events'),
               ('vsr-ve-sofl', 'Vegan Squad Retreat ad: South Florida hub', 'south-florida'),
               ('vsr-ve-central-florida', 'Vegan Squad Retreat ad: Central Florida hub', 'central-florida'),
               ('vsr-ve-north-florida', 'Vegan Squad Retreat ad: North Florida hub', 'north-florida')) v(code, label, tag)
 where not exists (select 1 from ve_links l where l.code = v.code);

with plan(placement, slot, code, opener) as (values
  ('76198eb5-7c3c-405b-9ac0-a7a20b885de9'::uuid, '/events skyscraper',        'vsr-ve-events',          'lake'),
  ('9df03d44-e416-45e1-8fc2-272df1334afc'::uuid, 'South Florida skyscraper',  'vsr-ve-sofl',            'yoga'),
  ('915a29a3-aa58-4082-9c21-22cb934e7d24'::uuid, 'Central Florida skyscraper','vsr-ve-central-florida', 'lake'),
  ('f856f3b5-69fc-4d68-a783-c4ac54f68245'::uuid, 'North Florida skyscraper',  'vsr-ve-north-florida',   'bowls')
), made as (
  insert into ad_campaigns (campaign_name, sponsor_name, campaign_type, creative_url, click_through_url, start_date, end_date, status, notes, sponsor_campaign_id)
  select 'Vegan Squad Retreat (' || p.slot || ')', 'Vegan Squad', 'sponsor',
         'https://vegansexplore.com/ads/partners/vegan-squad-retreat.html?c=' || p.opener,
         'https://vegansexplore.com/go/' || p.code, '2026-11-19', '2027-01-28', 'active',
         'Partner event ad (Sean, 2026-11-19). Takes the slot until 2027-01-28; the Guide campaign underneath returns after.',
         (select id from ad_sponsor_campaigns where slug = 'vegan-squad-retreat')
    from plan p
   where not exists (select 1 from ad_campaigns c where c.campaign_name = 'Vegan Squad Retreat (' || p.slot || ')')
  returning id, campaign_name
)
insert into ad_campaign_placements (campaign_id, placement_id)
select m.id, p.placement from made m join plan p on m.campaign_name = 'Vegan Squad Retreat (' || p.slot || ')';

-- Check (read only):
-- select c.campaign_name, c.creative_url, c.click_through_url, pl.slot_id from ad_campaigns c
--   join ad_campaign_placements cp on cp.campaign_id = c.id join ad_placements pl on pl.id = cp.placement_id
--  where c.sponsor_name = 'Vegan Squad';
