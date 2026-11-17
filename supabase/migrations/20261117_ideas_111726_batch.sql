-- 2026-11-17: Sean's screenshot folder "Ideas 111726" (Drive). What Sean hands over goes live (CLAUDE.md). Safe to run twice.
-- Left out, nothing confirmable online: Seasoned Green's Thanksgiving catering (no city found), the Austin Vegan Holiday Market
-- (Vegan Social Club; the screenshot has no day of the month), the Healthful Living Ocean Retreat (no official page found).
-- Holiday closures (Sen Saigon Thanksgiving hours, Vegan International Co. closed Nov 25 to 28) have no place on a listing yet.

-- 1) The Green Table's Wesley Chapel location (IMG 951D50AF), a location of The Green Table Restaurant, Palm Harbor.
insert into listings (name, slug, category, specialty, description, status, location, website, instagram, address_street, address_city,
  address_state, business_status, vegan_status, initials, crawl_source, communities, parent_id, logo_url, details, updated_at)
select 'The Green Table Wesley Chapel', 'the-green-table-wesley-chapel', 'Restaurants', '',
  'The Green Table Wesley Chapel is the second location of the Palm Harbor plant-based restaurant, serving Vegan comfort food (gyros, sandwiches, burgers and milkshakes) inside Krate at the Grove.',
  'approved', 'Wesley Chapel, FL', p.website, '@thegreentablewc', '5817 Goldview Pkwy, Unit 105', 'Wesley Chapel', 'FL', 'OPERATIONAL', 'fully_vegan',
  'GT', 'admin', array['central-florida'], p.id, p.logo_url,
  jsonb_build_object('added_by_hand', jsonb_build_object('by', 'Sean', 'at', now()),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Sean', 'kind', 'note', 'text', 'Added from Sean''s screenshots (Ideas 111726) with its game night.'))),
  now()
from listings p where p.slug = 'the-green-table-restaurant' and p.status = 'approved'
  and not exists (select 1 from listings l where l.slug = 'the-green-table-wesley-chapel');

-- 2) Events, approved at once.
select ve_event_intake(jsonb_build_object(
  'title', 'Game Night at The Green Table Wesley Chapel', 'link', 'https://www.instagram.com/thegreentablewc/',
  'starts_at', '2026-11-18T16:00:00-05:00', 'ends_at', '2026-11-18T19:00:00-05:00', 'timezone', 'America/New_York', 'time_set', true,
  'category', 'social', 'event_type', 'in_person',
  'location_name', 'The Green Table Wesley Chapel', 'address', '5817 Goldview Pkwy, Unit 105', 'city', 'Wesley Chapel', 'state', 'FL', 'country', 'US',
  'organizer_name', 'The Green Table Wesley Chapel', 'organizer_url', 'https://www.instagram.com/thegreentablewc/',
  'description', 'The Green Table Wesley Chapel hosts a free game night with UNO, spades, dominoes, Jenga, cornhole and more, plus Vegan food and drink specials.'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true)
where not exists (select 1 from events where title ilike 'Game Night at The Green Table%' and starts_at::date = '2026-11-18');

select ve_event_intake(jsonb_build_object(
  'title', 'ART BASIL at Aguacate Garden of Love', 'link', 'https://www.aguacategardenoflove.com/',
  'starts_at', '2026-12-02T16:00:00-05:00', 'ends_at', '2026-12-02T21:00:00-05:00', 'timezone', 'America/New_York', 'time_set', true,
  'category', 'festival', 'event_type', 'in_person',
  'location_name', 'Aguacate Garden of Love', 'address', '12100 SW 43rd Street', 'city', 'Miami', 'state', 'FL', 'country', 'US',
  'organizer_name', 'Aguacate Garden of Love', 'organizer_url', 'https://www.aguacategardenoflove.com/',
  'description', 'Aguacate Garden of Love hosts ART BASIL, a free Miami Art Week celebration with local artists, live music and DJ sets, and basil-inspired Vegan recipes. It is an independent community event, not affiliated with Art Basel.'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true)
where not exists (select 1 from events where title ilike 'ART BASIL%' and starts_at::date = '2026-12-02');

select ve_event_intake(jsonb_build_object(
  'title', 'Brunch @ Night by My Hungry Vegan', 'link', 'https://www.instagram.com/my_hungry_vegan/',
  'starts_at', '2027-01-23T18:00:00-05:00', 'ends_at', '2027-01-23T22:00:00-05:00', 'timezone', 'America/New_York', 'time_set', true,
  'category', 'food', 'event_type', 'in_person',
  'address', '1540 N. Franklin St', 'city', 'Tampa', 'state', 'FL', 'country', 'US',
  'organizer_name', 'My Hungry Vegan', 'organizer_url', 'https://www.instagram.com/my_hungry_vegan/',
  'description', 'My Hungry Vegan presents Brunch @ Night, a full Vegan brunch buffet with special performances, small business vendors and a live DJ. Tickets are limited.'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true)
where not exists (select 1 from events where title ilike 'Brunch @ Night%' and starts_at::date = '2027-01-23');

-- 3) Wesley Chapel's own hours (HappyCow listing), so it does not show Palm Harbor's.
update listings set google_hours_json = '{"Monday":"12 to 6 PM","Tuesday":"12 to 6 PM","Wednesday":"12 to 6 PM","Thursday":"12 to 6 PM","Friday":"12 to 8 PM","Saturday":"12 to 8 PM","Sunday":"12 to 4 PM"}'::jsonb
where slug = 'the-green-table-wesley-chapel' and google_hours_json is null;
