-- 2026-11-19: Sean's screenshot folder "Ideas 111926" (Drive, 13 screenshots). What Sean hands over goes live (CLAUDE.md). Safe to run twice.
-- Held for Sean: WildKind Packaging (IMG_8446, a sponsored ad, no ask attached) and the Clermont primary care search (IMG_8449, reads as personal).

-- 1) Events, approved at once.
-- IMG_8441 to 8443: Revolutionary Healing Friendsgiving Festival, Miami.
select ve_event_intake(jsonb_build_object(
  'title', '3rd Annual Revolutionary Healing Friendsgiving Festival', 'link', 'https://therevolutionaryhealing.com',
  'starts_at', '2026-11-22T09:00:00-05:00', 'ends_at', '2026-11-22T17:00:00-05:00', 'timezone', 'America/New_York', 'time_set', true,
  'category', 'festival', 'event_type', 'in_person',
  'location_name', 'The Green Haven Project', 'address', '1160 NW 2nd Ave', 'city', 'Miami', 'state', 'FL', 'country', 'US',
  'organizer_name', 'Revolutionary Healing & Wellness Inc.', 'organizer_url', 'https://therevolutionaryhealing.com',
  'description', 'Revolutionary Healing & Wellness hosts its 3rd Annual Friendsgiving Festival at The Green Haven Project: community food distribution from 9 to 11 AM, then healing sessions, live performances and cultural connection from noon to 5 PM. Partners include PETA and One World One Heart.'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true)
where not exists (select 1 from events where title ilike '%Revolutionary Healing%' and starts_at::date = '2026-11-22');

-- IMG_8444: Vegans of LA free farmers market, Long Beach.
select ve_event_intake(jsonb_build_object(
  'title', 'Free Farmers Market & Plant-Based Food Tastings by Vegans of LA', 'link', 'https://www.instagram.com/vegansoflosangeles_/',
  'starts_at', '2026-11-21T12:00:00-08:00', 'ends_at', '2026-11-21T14:00:00-08:00', 'timezone', 'America/Los_Angeles', 'time_set', true,
  'category', 'food', 'event_type', 'in_person',
  'location_name', 'Michelle Obama Library', 'address', '5870 Atlantic Ave', 'city', 'Long Beach', 'state', 'CA', 'country', 'US',
  'organizer_name', 'Vegans of LA', 'organizer_url', 'https://www.instagram.com/vegansoflosangeles_/',
  'description', 'Vegans of LA hosts a community food outreach day: free farmers market produce for the first 100 people, hot plant-based samples from Hodo Foods and Vegan cheese tastings. Bring a large reusable bag. Volunteers welcome.'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true)
where not exists (select 1 from events where title ilike 'Free Farmers Market%' and starts_at::date = '2026-11-21');

-- IMG_8445: Sensibly Sprouted's Mikel Bryant at Whatcom Women in Business, Bellingham.
select ve_event_intake(jsonb_build_object(
  'title', 'Growth Hour: Booked, Busy and Under-fueled with Mikel Bryant of Sensibly Sprouted', 'link', 'https://wwib.org',
  'starts_at', '2026-12-17T10:00:00-08:00', 'ends_at', '2026-12-17T11:00:00-08:00', 'timezone', 'America/Los_Angeles', 'time_set', true,
  'category', 'health', 'event_type', 'in_person',
  'location_name', 'Dorothy Haggen Conference Room', 'address', '2211 Rimland Drive Suite 106', 'city', 'Bellingham', 'state', 'WA', 'country', 'US',
  'organizer_name', 'Whatcom Women in Business', 'organizer_url', 'https://wwib.org',
  'description', 'Mikel Bryant, MS, RDN, CD, CSOWM, of Sensibly Sprouted shares practical, evidence-based nutrition strategies for more energy, better performance and long-term health. Registration $10, RSVP by Mon Dec 14. Coffee and pastries provided.'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true)
where not exists (select 1 from events where title ilike 'Growth Hour%' and starts_at::date = '2026-12-17');

-- IMG_8447, 8448: March for Animals at FIU, Miami.
select ve_event_intake(jsonb_build_object(
  'title', 'March for Animals at FIU: Cruelty Free Campus', 'link', 'https://docs.google.com/forms/d/e/1FAIpQLSd8p_pPeXucSAhDNxkMcS97zQxFxf9Ravt0yWTT2pp7JliBEw/viewform',
  'starts_at', '2026-12-03T11:00:00-05:00', 'ends_at', '2026-12-03T15:00:00-05:00', 'timezone', 'America/New_York', 'time_set', true,
  'category', 'activism', 'event_type', 'in_person',
  'location_name', 'Florida International University, Graham Center', 'address', '11200 SW 8th St', 'city', 'Miami', 'state', 'FL', 'country', 'US',
  'organizer_name', 'March for Animals', 'organizer_url', 'https://marchforanimals.org',
  'description', 'Part of a nationwide day of action calling on universities to end animal testing and invest in non-animal research methods. Meet at the field behind the Graham Center, in front of Panera: peaceful protest at 11 AM, march from 12:30 to 1:30 PM, then the protest continues until 3 PM. Open to everyone, not just students.'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true)
where not exists (select 1 from events where title ilike 'March for Animals at FIU%' and starts_at::date = '2026-12-03');

-- 2) IMG_8450: Lotus Vegan Restaurant, Pinellas Park, Thanksgiving weekend hours (reopens Mon Nov 30, 11 AM to 9 PM, its regular hours).
insert into ve_holiday_hours (listing_id, holiday_slug, status, hours, days, set_by, set_by_team)
select l.id, 'thanksliving', 'special',
  'Thu, Nov 26: 11 AM to 7 PM. Fri, Nov 27: Closed. Sat, Nov 28: Closed. Sun, Nov 29: Closed.',
  '[{"date":"2026-11-26","hours":"11 AM to 7 PM"},{"date":"2026-11-27","hours":"Closed"},{"date":"2026-11-28","hours":"Closed"},{"date":"2026-11-29","hours":"Closed"}]'::jsonb,
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true
from listings l where l.slug = 'lotus-vegan-restaurant-nh-h-ng-chay-hoa-sen'
  and not exists (select 1 from ve_holiday_hours h where h.listing_id = l.id and h.holiday_slug = 'thanksliving');

-- 3) IMG_8438: Madrina Vegana, Queens, holiday catering menu, a Menus We Found tip on Christmas (ThanksLiving tips closed Nov 19).
insert into ve_holiday_menu_tips (holiday_slug, member_id, listing_id, place_name, city, state, link, note, status, by_team, team_note, reviewed_by, reviewed_at)
select 'christmas', '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, (select id from listings where slug = 'madrina-vegana'),
  'Madrina Vegana', 'Queens', 'NY', 'https://www.instagram.com/madrinavegananyc/',
  'Madrina Vegana''s holiday catering: the Holiday Feast, $50 per person, two mains and two sides. Mains: barbacoa tacos, poblano and queso quesadillas, barbacoa quesadillas, tamales (poblano and queso, or jackfruit chicken tinga) and enchilada casserole. Sides: Mexican rice and refried beans, creamy baked mac and cheese, garlic mashed potatoes, street corn cups (elote) and a crisp salad. Churro bites sold separately ($7 per person, family tray $35 for 5 to 6). Larger orders: call or email for pricing.',
  'live', true, 'From Sean''s screenshot ideas 111926 - IMG_8438.', '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, now()
where not exists (select 1 from ve_holiday_menu_tips t where t.place_name = 'Madrina Vegana' and t.holiday_slug = 'christmas' and t.status <> 'declined');
