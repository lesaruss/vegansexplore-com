-- ve-holiday-guide: Vegetarian Delight Juice Bar's holiday catering on the Christmas menus too (Sean, 2026-11-10: "add Vegetarian Delight
-- to the Christmas menus too"; their caption opens Thanksgiving and Christmas pre-orders). The same dishes, prices and order link as their
-- ThanksLiving menu (20261110_holiday_menu_vegetarian_delight.sql), with a Christmas line. Their listing page shows the ThanksLiving menu
-- until it passes, then this one. Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, pickup, price_range, team_note, reviewed_by, reviewed_at)
select 'christmas', t.listing_id, t.member_id, 'live',
  'Vegetarian Delight is back for the holidays with its Caribbean catering favorites for your Christmas table: oxtail, griot, escovitch and brown stew, with mac and cheeze, rice and peas and more. Pre-order only.',
  t.items, t.order_url, t.pickup, t.price_range,
  'Copied from their ThanksLiving menu; their caption opens Christmas pre-orders too (Sean, 2026-11-10).',
  t.reviewed_by, now()
from ve_holiday_menus t
where t.holiday_slug = 'thanksliving' and t.listing_id = '3adda089-3e3e-4871-b48e-a214a767ad54'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'christmas' and m.listing_id = t.listing_id);
