-- ve-holiday-guide: Soulicious Vegan Kitchen's Thanksgiving menu (Sean sent their Thanksgiving Menu store page as a PDF and its link,
-- 2026-11-10), entered by the team for its listing and live at once, in the Nana's A Vegan format with the flyer's sections. Trays feed
-- up to 6. Order by Thu Nov 19; pickup Wed Nov 25 by 3 PM at Hall's on 5th. Order link: their Thanksgiving collection. Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, price_range, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'Soul food for the ThanksLiving table, by the half tray: entrees, sides, appetizers and extras that feed up to 6.',
  jsonb_build_array(
    jsonb_build_object('section', 'Entrees (half tray)', 'name', 'Brisket Jackfruit', 'price', '$75', 'desc', ''),
    jsonb_build_object('section', 'Entrees (half tray)', 'name', 'Smothered Turkey', 'price', '$75', 'desc', 'Oyster mushrooms.'),
    jsonb_build_object('section', 'Entrees (half tray)', 'name', 'Fried Chick''n', 'price', '$75', 'desc', 'Oyster mushrooms.'),
    jsonb_build_object('section', 'Entrees (half tray)', 'name', 'Jerk Chick''n', 'price', '$75', 'desc', 'Oyster mushrooms.'),
    jsonb_build_object('section', 'Entrees (half tray)', 'name', 'Cajun Pasta', 'price', '$75', 'desc', ''),
    jsonb_build_object('section', 'Sides (half tray)', 'name', 'Macaroni and Cheese', 'price', '$75', 'desc', ''),
    jsonb_build_object('section', 'Sides (half tray)', 'name', 'Collard Greens', 'price', '$75', 'desc', ''),
    jsonb_build_object('section', 'Sides (half tray)', 'name', 'Sweet Potatoes', 'price', '$75', 'desc', ''),
    jsonb_build_object('section', 'Sides (half tray)', 'name', 'Dirty Rice', 'price', '$75', 'desc', ''),
    jsonb_build_object('section', 'Sides (half tray)', 'name', 'Cornbread Dressing', 'price', '$75', 'desc', ''),
    jsonb_build_object('section', 'Appetizers', 'name', 'Crab Cakes', 'price', '$50', 'desc', '8 pieces.'),
    jsonb_build_object('section', 'Appetizers', 'name', 'Brisket Sliders', 'price', '$50', 'desc', '12 sliders.'),
    jsonb_build_object('section', 'Extras', 'name', 'Gravy', 'price', '$12', 'desc', '24 oz.'),
    jsonb_build_object('section', 'Extras', 'name', 'Dinner Rolls', 'price', '$12', 'desc', '')
  ),
  'https://souliciousvegankitchen.com/collections/thanksgiving-menu', date '2026-11-19',
  'Wed Nov 25, by 3 PM (the restaurant closes at 3:30), at Hall''s on 5th, 15 E 5th St, Apopka.',
  '$12 to $75',
  'From Soulicious''s Thanksgiving Menu page and link (Sean sent them, 2026-11-10).',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.id = '7257d0ea-ce61-4efc-9562-865dd35e9a50' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);
