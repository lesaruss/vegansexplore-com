-- ve-holiday-guide: Dina's Vegan Deli & Desserts' Thanksgiving platter (Sean pasted their post and Toast order link, 2026-11-10), entered by
-- the team for its listing and live at once, in the Nana's A Vegan format. The order-by date (Sun Nov 22) is from Sean's earlier screenshot
-- of their flyer (IMG_8132). Order link: their Toast page. Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, price_range, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'A complete ThanksLiving platter: harvest seitan with brown gravy and all the classic sides, made at their Riviera Beach deli.',
  jsonb_build_array(
    jsonb_build_object('section', 'Thanksgiving Platter', 'name', 'Complete Thanksgiving Feast', 'price', '$29.95', 'desc', 'Harvest Seitan with Savory Brown Gravy, Creamy Mashed Potatoes, Garlic Green Beans, Homemade Mac and Cheese and Fresh Cranberry Sauce.')
  ),
  'https://order.toasttab.com/online/dinas-vegan-deli-desserts-1880-w-10th-st', date '2026-11-22',
  'Wed Nov 25, 12:30 to 5:30 PM only, at 1880 W 10th St, Riviera Beach.',
  '$29.95',
  'From Dina''s post and Toast order link (Sean pasted them, 2026-11-10); order-by date from IMG_8132.',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.id = '76a76ea5-1746-4b09-a832-19d5d14a40b0' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);

update ve_holiday_menu_tips set link = 'https://order.toasttab.com/online/dinas-vegan-deli-desserts-1880-w-10th-st', updated_at = now()
where holiday_slug = 'thanksliving' and place_name = 'Dina''s Vegan Deli & Desserts';
