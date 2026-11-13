-- Veggie Grill (Next Level Veggie Grill), Carrie Davis's email to Sean, 2026-11-13.
-- 1) "Our UCLA location name needs to be updated to Next Level Veggie Grill": rename, keep the UCLA label,
--    and place it with the chain's other locations (handoff 2026-11-12 item 6: UCLA stays a location).
update listings
   set name = 'Next Level Veggie Grill',
       location_label = 'UCLA',
       parent_id = (select id from listings where slug = 'next-level-veggie-grill-long-beach-b4fc'),
       updated_at = now()
 where slug = 'veggie-grill' and name <> 'Next Level Veggie Grill';

-- 2) Their five ThanksLiving menus (sent 3:00 to 3:19 PM Eastern, pickup began Nov 13): the summary is rewritten
--    in the third person (CLAUDE.md Writing) and the menus approved. No approval emails: Sean answers Carrie himself.
update ve_holiday_menus h
   set summary = 'Next Level Veggie Grill''s 2026 Holiday Feast brings comfort, joy and deliciousness to the table. This year''s Feast is nearly 50% larger, with double the mashed potatoes and gravy and more than double the stuffing and mac & cheese. Each Feast now serves 6 to 8 guests, ordered as a full Feast, gluten free, with dessert added, or a la carte.',
       status = 'live', reviewed_at = now(), updated_at = now(), decline_note = null,
       team_note = 'Approved 2026-11-13 by Logan; summary rewritten in the third person.'
 where h.member_id = 'bb861387-f0bd-475f-8e8b-fdbaa2aa4c76'
   and h.holiday_slug = 'thanksliving'
   and h.status = 'pending';
