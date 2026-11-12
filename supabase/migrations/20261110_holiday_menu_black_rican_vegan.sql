-- ve-holiday-guide: Black Rican Vegan's ThanksLiving menu (Sean pasted their post and order link, 2026-11-10), entered by the team
-- for its listing and live at once, in the Nana's A Vegan format. Order link: their catering page. Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, pickup, price_range, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'Afro-Boricua holiday comfort food, scratch-made: a single ThanksLiving plate or a family package for 4 to 6, plus pasteles and Vegan coquito.',
  jsonb_build_array(
    jsonb_build_object('name', 'Single Thanksgiving Meal', 'price', '$45', 'desc', '1 protein, 2 sides, 1 empanada and 1 dessert.'),
    jsonb_build_object('name', 'Holiday Family Package', 'price', '$240', 'desc', 'Feeds 4 to 6. 1 protein, 2 sides, 6 empanadas and 1 dessert.'),
    jsonb_build_object('name', 'Proteins', 'price', '', 'desc', 'Jackfruit Chicharrón, Jackfruit Pernil, Fried Oyster Mushrooms and their signature Moxtails.'),
    jsonb_build_object('name', 'Sides', 'price', '', 'desc', 'Mac N Chzzz, Sweet Yams, Arroz con Gandules, Collard Greens and Potato Salad.'),
    jsonb_build_object('name', 'Empanadas', 'price', '', 'desc', 'Guava and Vegan Cheese, Impossible Beef, and Curry Chickpea.'),
    jsonb_build_object('name', 'Desserts', 'price', '', 'desc', 'Flancocho and Coquito Tres Leches.'),
    jsonb_build_object('name', 'Pasteles', 'price', '$40', 'desc', 'A holiday extra, by the half dozen.'),
    jsonb_build_object('name', 'Vegan Coquito', 'price', '$35', 'desc', 'A holiday extra, 750 ml.')
  ),
  'https://www.blackricanvegan.com/catering',
  'Tue Nov 24 or Wed Nov 25, in Harlem.',
  '$35 to $240',
  'From Black Rican Vegan''s post and order link (Sean pasted them, 2026-11-10).',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.id = '332e634d-bf12-4837-8363-ec8a4fe68a44' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);

update ve_holiday_menu_tips set link = 'https://www.blackricanvegan.com/catering', updated_at = now()
where holiday_slug = 'thanksliving' and place_name = 'Black Rican Vegan' and link = 'https://www.instagram.com/blackricanvegan/';
