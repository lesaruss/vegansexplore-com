-- New Year's Eve joins the Holiday Guide (Sean, 2026-11-16: "I think we should actually create a New Year's Eve menu... yes, lock it in
-- and start wave 1"; playbook ve-holiday-guide). Wave 1: menus and events. Menus are taken until midnight Eastern, December 24.
-- First menus: Next Level Veggie Grill's Holiday Feast at every location that has its Christmas menu (Carrie Davis, Director of
-- Marketing, asked by email 2026-11-16), with their New Year's pickup dates. Safe to run twice.
insert into ve_holidays (slug, name, holiday_on, submit_close, promo_from, promo_to, sort) values
  ('new-years-eve', 'New Year''s Eve', '2026-12-31', '2026-12-24 05:00+00', '2026-11-07', '2027-01-01', 50)
on conflict (slug) do nothing;

insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, price_range,
  holiday_hours, contact_note, team_note, submitted_at, reviewed_at)
select 'new-years-eve', m.listing_id, m.member_id, 'live', m.summary, m.items, m.order_url, m.order_by,
  'Pickup on December 26, December 27, December 31 and January 1.', m.price_range,
  'Open regular business hours.', null,
  '[2026-11-16 Carrie Davis email: the Holiday Feast for New Year''s Eve, same menu as Christmas, pickup Dec 26, 27, 31 and Jan 1.]',
  now(), now()
from ve_holiday_menus m join listings l on l.id = m.listing_id
where m.holiday_slug = 'christmas' and m.status = 'live' and l.name ilike 'next level%'
on conflict (holiday_slug, listing_id) do nothing;
