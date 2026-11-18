-- 2026-11-18: Sean's screenshot folder "Ideas 111826" (Drive, 12 screenshots). What Sean hands over goes live (CLAUDE.md). Safe to run twice.
-- Held for Sean, nothing confirmable online yet: PETA's Albuquerque glue trap ban (IMG_8433), the Florida statewide animal cruelty
-- hotline from the Polk County Bully Project (IMG_8436), the Costa Rica Vegan fitness and yoga retreat, Sept 12 to 18, 2027 (IMG_8428 to 8430).
-- Land & Monkeys Paris (IMG_8436, 8437) starts the Paris chapter (Sean, 2026-11-18: "I want us to launch a Paris chapter"), its own work.
-- The HQ search-terms screenshot (IMG_8427) waits on Sean's word. The Pompano Beach Fruitluck Friendsgiving (Vega Vegan Social Club,
-- Sat Nov 21, 1 to 6 PM, IMG_8431) has no public link (events need one); held for the post's link.

-- 1) Events, approved at once.
select ve_event_intake(jsonb_build_object(
  'title', 'Vegan Haven Pop-Up at The Hound Bar', 'link', 'https://www.instagram.com/veganhavenpopup/',
  'starts_at', '2026-12-12T18:00:00-08:00', 'ends_at', '2026-12-12T22:00:00-08:00', 'timezone', 'America/Los_Angeles', 'time_set', true,
  'category', 'food', 'event_type', 'in_person',
  'location_name', 'The Hound Bar', 'address', '4626 Firestone Blvd', 'city', 'South Gate', 'state', 'CA', 'country', 'US',
  'organizer_name', 'Vegan Haven', 'organizer_url', 'https://www.instagram.com/veganhavenpopup/',
  'description', 'Vegan Haven brings its Vegan pop-up experience to The Hound Bar in South Gate, Southeast LA, with Vegan food vendors and more. Free entry.'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true)
where not exists (select 1 from events where title ilike 'Vegan Haven Pop-Up%' and starts_at::date = '2026-12-12');

select ve_event_intake(jsonb_build_object(
  'title', '8th Annual Vegan Friendsgiving Hosted by Harmony', 'link', 'https://www.facebook.com/share/156VEPTT1q3/',
  'starts_at', '2026-11-21T17:30:00-05:00', 'ends_at', '2026-11-21T22:30:00-05:00', 'timezone', 'America/New_York', 'time_set', true,
  'category', 'social', 'event_type', 'in_person',
  'location_name', 'Sunship Center', 'address', '466 Magnolia Ave', 'city', 'Palm Harbor', 'state', 'FL', 'country', 'US',
  'organizer_name', 'Harmony (Sun Tribe)', 'organizer_url', 'https://www.facebook.com/share/156VEPTT1q3/',
  'description', 'Harmony hosts the 8th Annual Friendsgiving at the Sunship Center in Palm Harbor, a 100% Vegan get-together. Loved ones are welcome.'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true)
where not exists (select 1 from events where title ilike '8th Annual Vegan Friendsgiving%' and starts_at::date = '2026-11-21');

-- 2) WeVegan Cafe, Tampa (IMG_8432): Thanksgiving pre-orders, a Menus We Found tip, live.
insert into ve_holiday_menu_tips (holiday_slug, member_id, listing_id, place_name, city, state, link, note, status, by_team, team_note, reviewed_by, reviewed_at)
select 'thanksliving', '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, (select id from listings where slug = 'wevegan-cafe'),
  'WeVegan Cafe', 'Tampa', 'FL', 'https://www.instagram.com/wevegancafe/',
  'WeVegan Cafe''s Thanksgiving pre-orders: a Thanksgiving individual plate with all the sides ($25, on sale from $30, order Nov 19 to 23) and Thanksgiving pies ($35, on sale from $40, order Nov 18 to 24). Pickup only, Tue Nov 24 or Wed Nov 25, 7 AM to 4 PM.',
  'live', true, 'From Sean''s screenshot ideas 111826 - IMG_8432.', '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, now()
where not exists (select 1 from ve_holiday_menu_tips t where t.holiday_slug = 'thanksliving' and t.link = 'https://www.instagram.com/wevegancafe/' and t.status <> 'declined');
