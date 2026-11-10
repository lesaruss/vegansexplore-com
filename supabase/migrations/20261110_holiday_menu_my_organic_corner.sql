-- ve-holiday-guide: My Organic Corner's Thanksgiving menu (Sean sent their ordering page and link, 2026-11-10), entered by the team for
-- its listing and live at once, in the Nana's A Vegan format with sections, no photos (Sean: "Nevermind on the photos"). The cafe is not
-- 100% Vegan, so the menu shows as plant-based (Pre-Vegan). Their own descriptions were cut off on the page; ours end where theirs do.
-- Last day to order Tue Nov 24, pickup by Wed Nov 25, orders non-refundable. Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, price_range, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'A lentil loaf by the plate or the pound, cremini mushroom gravy, green beans, pumpkin bread and a whole raw cake for the ThanksLiving table.',
  jsonb_build_array(
    jsonb_build_object('section', 'Mains', 'name', 'Lentil Meatloaf Dish', 'price', '$17', 'desc', 'Baked loaf of brown lentils, roasted walnuts, oats, celery, carrot, raisins and spices, glazed with a homemade maple ketchup sauce.'),
    jsonb_build_object('section', 'Mains', 'name', 'Lentil Meatloaf by the Pound', 'price', '$23', 'desc', 'Homemade loaf of brown lentils, chopped walnuts, onions, garlic, celery, carrot, raisins, flax seeds and oat flour.'),
    jsonb_build_object('section', 'Gravy', 'name', 'Cremini Mushroom Gravy, 16 oz', 'price', '$11', 'desc', 'Organic cremini mushroom gravy. Serves 6 to 8.'),
    jsonb_build_object('section', 'Gravy', 'name', 'Cremini Mushroom Gravy, 8 oz', 'price', '$6', 'desc', 'Organic cremini mushroom gravy. Serves 3 to 4.'),
    jsonb_build_object('section', 'Sides', 'name', 'Sauteed Green Beans, 1 lb', 'price', '$15', 'desc', 'With avocado olive oil and a garlic sauce. Serves about 3 to 4.'),
    jsonb_build_object('section', 'Desserts', 'name', 'Vegan Pumpkin Bread Loaf', 'price', '$23', 'desc', 'Homemade with organic whole wheat flour, coconut oil, brown sugar, nutmeg and spices. Contains gluten.'),
    jsonb_build_object('section', 'Desserts', 'name', 'Whole 8 inch Raw Cake', 'price', '$90', 'desc', 'Gluten-free, dairy free, refined sugar free and soy free. Order at least 5 days ahead.')
  ),
  'https://myorganiccorner.com/menu#thanksging-menu-ordering', date '2026-11-24',
  'By Wed Nov 25, at 127 Weston Rd, Weston. Orders are non-refundable.',
  '$6 to $90',
  'From My Organic Corner''s ordering page and link (Sean sent them, 2026-11-10).',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.id = 'ec27baec-09c4-4502-8bca-b44441f69996' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);

update ve_holiday_menu_tips set link = 'https://myorganiccorner.com/menu#thanksging-menu-ordering', updated_at = now()
where holiday_slug = 'thanksliving' and place_name = 'My Organic Corner';
