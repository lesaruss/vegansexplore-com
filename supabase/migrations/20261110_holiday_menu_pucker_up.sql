-- ve-holiday-guide: Pucker Up Vegan Eatery's Fall Feast menu (Sean sent the menu, caption and order link, 2026-11-10), entered by the
-- team for its listing and live at once, in the Nana's A Vegan format with the menu's own sections. Order link: their Cake ordering
-- portal (tracking codes left off). Ordering closes Fri Nov 20 or sooner if they fill up. Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, price_range, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'A Fall Feast for one, Vegan turkey and gravy by the pound, sides that serve 8 to 12 and desserts. Order online or in person by Fri Nov 20, or sooner if they fill up.',
  jsonb_build_array(
    jsonb_build_object('section', 'Fall Feast', 'name', 'Fall Feast for 1', 'price', '$26.99', 'desc', 'Roasted turkey, mashed potatoes and gravy with dressing, green beans, cranberry sauce and a buttermilk biscuit.'),
    jsonb_build_object('section', 'Turkey and Gravy', 'name', 'Turkey', 'price', '$8 / $15', 'desc', 'By the half pound or the pound.'),
    jsonb_build_object('section', 'Turkey and Gravy', 'name', 'Gravy', 'price', '$6.99', 'desc', '16 oz.'),
    jsonb_build_object('section', 'Sides (serve 8 to 12)', 'name', 'Yukon Gold Mashed Potatoes', 'price', '$45', 'desc', ''),
    jsonb_build_object('section', 'Sides (serve 8 to 12)', 'name', 'Sweet Potato Casserole', 'price', '$55', 'desc', ''),
    jsonb_build_object('section', 'Sides (serve 8 to 12)', 'name', 'Baked Mac and Cheese', 'price', '$60', 'desc', ''),
    jsonb_build_object('section', 'Sides (serve 8 to 12)', 'name', 'Green Bean Casserole', 'price', '$48', 'desc', ''),
    jsonb_build_object('section', 'Sides (serve 8 to 12)', 'name', 'Southern Style Squash and Onion', 'price', '$40', 'desc', ''),
    jsonb_build_object('section', 'Sides (serve 8 to 12)', 'name', 'Classic Dressing', 'price', '$40', 'desc', ''),
    jsonb_build_object('section', 'Sides (serve 8 to 12)', 'name', 'Dozen Buttermilk Biscuits', 'price', '$38', 'desc', ''),
    jsonb_build_object('section', 'Desserts', 'name', 'Pumpkin Loaf Cake', 'price', '$21', 'desc', ''),
    jsonb_build_object('section', 'Desserts', 'name', 'Apple Pie', 'price', '$29.99', 'desc', '')
  ),
  'https://orders.trycake.com/11511542', date '2026-11-20', '$6.99 to $60',
  'From Pucker Up''s menu, caption and order link (Sean sent them, 2026-11-10). Pickup times not on the post.',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.id = '4f791a78-8cb5-4306-9b9f-7903e252eafb' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);

update ve_holiday_menu_tips set link = 'https://orders.trycake.com/11511542', updated_at = now()
where holiday_slug = 'thanksliving' and place_name = 'Pucker Up Vegan Eatery';
