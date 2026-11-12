-- ve-holiday-guide: The Plantisserie's Thanksgiving Menu 2026 (Sean sent the family size menu, caption and order link, 2026-11-10),
-- entered by the team for its listing and live at once, in the Nana's A Vegan format with sections. The per person plate is from Sean's
-- earlier screenshot of their per person flyer (IMG_8161: $40, a main, a side and a slice of dessert). Order by Mon Nov 23 before 4 PM.
-- Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, price_range, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'A plant-based, organic ThanksLiving feast: a plate per person, or family size sides, mains by the tray and whole cakes.',
  jsonb_build_array(
    jsonb_build_object('section', 'Per Person', 'name', 'ThanksLiving Plate', 'price', '$40', 'desc', 'A main, a side and a slice of dessert.'),
    jsonb_build_object('section', 'Sides (small or large)', 'name', 'Holiday Roasted Veggies', 'price', '$10 / $18', 'desc', ''),
    jsonb_build_object('section', 'Sides (small or large)', 'name', 'Mushroom Gravy', 'price', '$10 / $18', 'desc', ''),
    jsonb_build_object('section', 'Sides (small or large)', 'name', 'Blood Orange and Apple Cranberry Relish', 'price', '$10 / $18', 'desc', ''),
    jsonb_build_object('section', 'Sides (small or large)', 'name', 'Mashed Potatoes', 'price', '$10 / $18', 'desc', ''),
    jsonb_build_object('section', 'Sides (small or large)', 'name', 'Sweet Potato Purée', 'price', '$10 / $18', 'desc', ''),
    jsonb_build_object('section', 'Sides (small or large)', 'name', 'Tomato and Herbs Confit', 'price', '$10 / $18', 'desc', ''),
    jsonb_build_object('section', 'Mains (by the tray)', 'name', 'Meatless Loaf', 'price', '$98', 'desc', 'With mushroom gravy and glazed green beans. Serves 4 to 6. Gluten-free.'),
    jsonb_build_object('section', 'Mains (by the tray)', 'name', 'Provenzal and Lemon Oyster Churrasco', 'price', '$110', 'desc', 'With mashed potato and Grateful Kale Salad. Serves 4 to 6. Gluten-free.'),
    jsonb_build_object('section', 'Mains (by the tray)', 'name', 'Wild Rice Stuffed Squash', 'price', '$90', 'desc', 'With Grateful Kale Salad. Serves 4. Gluten-free.'),
    jsonb_build_object('section', 'Mains (by the tray)', 'name', 'Wellington', 'price', '$108', 'desc', 'With caramelized Brussels sprouts and pomegranate. Serves 4 to 6.'),
    jsonb_build_object('section', 'Desserts (whole cake)', 'name', 'Chocolate Orange Cake', 'price', '$95', 'desc', 'Gluten-free.'),
    jsonb_build_object('section', 'Desserts (whole cake)', 'name', 'Blueberry and Lemon Cake', 'price', '$90', 'desc', 'Gluten-free.'),
    jsonb_build_object('section', 'Desserts (whole cake)', 'name', 'Pumpkin Pie', 'price', '$85', 'desc', 'Gluten-free.'),
    jsonb_build_object('section', 'Desserts (whole cake)', 'name', 'Cinnamon Roll', 'price', '$90', 'desc', 'Gluten-free.')
  ),
  'https://www.theplantisserie.com/#reserve', date '2026-11-23',
  'Wed Nov 25, 12 to 9 PM, at 7316 NE 2nd Ave, Little River. Order by Mon Nov 23 before 4 PM. Questions: (786) 502-3363 or store@theplantisserie.com.',
  '$10 to $110',
  'From The Plantisserie''s family size menu, caption and order link (Sean sent them, 2026-11-10); per person plate from IMG_8161.',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.id = '64b40f4e-0e39-412f-bb6e-9de431eb15e4' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);

update ve_holiday_menu_tips set link = 'https://www.theplantisserie.com/#reserve', updated_at = now()
where holiday_slug = 'thanksliving' and place_name = 'The Plantisserie';
