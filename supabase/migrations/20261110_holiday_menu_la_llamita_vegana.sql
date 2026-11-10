-- ve-holiday-guide: La Llamita Vegana's 2026 holiday pre-order menu (Sean sent the menu, caption and order link, 2026-11-10), entered by
-- the team for its listing and live at once, in the Nana's A Vegan format, with the menu's own sections (items carry `section`, which
-- /public/ve-holiday-menu.js shows as headings). No prices on the menu. Order link: their Hotplate page. Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'Peruvian holiday food made from plants: starters, mains and sweets, celiac safe and as organic and local as they can. They also match sponsored meals with anyone in need.',
  jsonb_build_array(
    jsonb_build_object('section', 'Starters', 'name', 'Roasted Honeynut Squash Soup', 'price', '', 'desc', 'Herb aioli and roasted honeynut seeds.'),
    jsonb_build_object('section', 'Starters', 'name', 'Gobbler Empanada', 'price', '', 'desc', 'Seasonal veggies, sage, thyme, cranberry sauce and gravy.'),
    jsonb_build_object('section', 'Starters', 'name', 'Artichoke Heart Quiche', 'price', '', 'desc', 'Farm fresh tofu, kale and kalamata, with salsa criolla.'),
    jsonb_build_object('section', 'Mains', 'name', 'Butternut Squash Fettuccine', 'price', '', 'desc', 'With tofu ricotta.'),
    jsonb_build_object('section', 'Mains', 'name', 'Mac and Queso', 'price', '', 'desc', 'Cashew based cheese.'),
    jsonb_build_object('section', 'Mains', 'name', 'Llama Shepherds Pie', 'price', '', 'desc', 'Soy ground beef, olives, raisins, mashed potatoes and salsa verde.'),
    jsonb_build_object('section', 'Mains', 'name', 'Stuffed Acorn Squash', 'price', '', 'desc', 'Savory lentils, sage and aji amarillo tahini slaw.'),
    jsonb_build_object('section', 'Sweets', 'name', 'Mazamorra Morada', 'price', '', 'desc', 'Purple corn pudding.'),
    jsonb_build_object('section', 'Sweets', 'name', 'Picarones', 'price', '', 'desc', 'Honeynut squash and sweet potato donuts with a fruit based syrup.'),
    jsonb_build_object('section', 'Sweets', 'name', 'Pumpkin Chocolate Chip Cookies', 'price', '', 'desc', ''),
    jsonb_build_object('section', 'Sweets', 'name', 'Chocolate Pudding Pie', 'price', '', 'desc', ''),
    jsonb_build_object('section', 'Sweets', 'name', 'Pumpkin Pie', 'price', '', 'desc', ''),
    jsonb_build_object('section', 'Give a Meal', 'name', 'Sponsor a Meal', 'price', '', 'desc', 'Add a sponsored meal to your order and they match it with someone who needs one. Need a meal this Thanksgiving? Email Alex@LaLlamitaVegana.com.')
  ),
  'https://www.hotplate.com/lallamitavegana', date '2026-11-19',
  'Tue Nov 24, 4 to 6 PM, at Weavers Way Henry Got Crops (7095 Henry Ave); Wed Nov 25, 4 to 7 PM, or Thu Nov 26, 10 AM to noon, at Globe Dye Works; or citywide delivery, chosen on the menu. Orders close at midnight on Thu Nov 19.',
  'From La Llamita Vegana''s menu, caption and order link (Sean sent them, 2026-11-10).',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.id = '7dd90db9-9080-4416-b46a-06bb24cb074e' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);

update ve_holiday_menu_tips set link = 'https://www.hotplate.com/lallamitavegana', updated_at = now()
where holiday_slug = 'thanksliving' and place_name = 'La Llamita Vegana';
