-- ve-community-directory (Logan, 2026-11-07): the 15 events waiting, two Central Florida cities, the Vegan Squad Retreat's code line.
-- 1. Events waiting (Vegans Explore tenant): each official page read through pg_net. 12 approved (date, time and place match, not cancelled);
--    3 turned down: Joy Cafe (Nov 4) and Zoom Vegan Support Group (Nov 5) already over, VegfestUK Brighton over today and its page returned 520.
update events set status='rejected', reviewed_at=now(), updated_at=now(),
 rejection_reason = case left(id::text,8)
  when '2a666364' then 'Already over (Nov 4); its Partiful page matches. Checked 2026-11-07.'
  when '23f5dbaf' then 'Already over (Nov 5); its Meetup page matches. Checked 2026-11-07.'
  else 'Over today (it ends this afternoon) and its official page (vegfest.co.uk) would not load for us to check, error 520. Checked 2026-11-07.' end
where status='pending' and tenant_id='00000000-0000-4000-a000-000000000002' and left(id::text,8) in ('2a666364','23f5dbaf','c79715d2');
update events set status='approved', reviewed_at=now(), updated_at=now(), link_status='ok', link_checked_at=now(), link_note='Official page read 2026-11-07: date, time and place match, not cancelled.'
where status='pending' and tenant_id='00000000-0000-4000-a000-000000000002' and left(id::text,8) in ('e9db8afd','4b286aee','5cf25693','bdbe030d','a29d1fa8','25fd43cb','47f365f3','87e6ebf3','fbb643fb','6f998d9d','8d2caa33','8c2a6f59');
-- 2. Port Richey and Orange Springs join Central Florida's city list (also public/ve-hubs.js, directory/listing.html, ve-claims HUBS).
update ve_outreach_cities set cities = cities || array['Port Richey','Orange Springs']::text[], updated_at=now()
where community_slug='central-florida' and not ('Port Richey' = any(cities));
-- 3. Vegan Squad Retreat: Sean's wording, $250 off the ticket with the exclusive code, a short disclosure (no amount).
update events set description = description || E'\n\nSave $250 off your ticket with the exclusive Vegans Explore code VEGANSEXPLORE at checkout. Vegans Explore earns a commission on tickets bought with this code.', updated_at=now()
where id='c80c68ab-8ad8-4218-bd96-5f474da4e64c' and description not like '%VEGANSEXPLORE%';
