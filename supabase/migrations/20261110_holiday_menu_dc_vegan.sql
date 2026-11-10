-- ve-holiday-guide: DC Vegan's Thanksgiving catering menu (Sean sent their Instagram menu, 2026-11-10), entered by the team for its
-- listing and live at once, in the Nana's A Vegan format. Allergen marks spelled out (GF gluten-free, N contains nuts, SF soy-free).
-- The order link is their own site until Sean sends the direct order page. Also fixes the site address used on 2026-11-10 for their
-- found-menu entry and their dinner event: it is dc-vegan.com (the listing's website and their sales@dc-vegan.com), not dcvegan.com.
-- Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, price_range, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'A ThanksLiving catering menu to take home: the full Thanksgiving Table or mains, sides and pies on their own. Small serves 4 to 6, large serves 8 to 10.',
  jsonb_build_array(
    jsonb_build_object('name', 'Thanksgiving Table', 'price', '$339 / $529', 'desc', 'Small or large. One of each main and one of each side, with one Wellington per order. Dessert not included.'),
    jsonb_build_object('name', 'Holiday Harvest Wellington', 'price', '$70', 'desc', 'Flaky puff pastry stuffed with butternut squash, kale, wild mushrooms, caramelized onions and dried cranberries. Serves 4 to 6. Soy-free.'),
    jsonb_build_object('name', 'Thanksgiving Turkey and Gravy', 'price', '$55 / $87', 'desc', 'Sliced Prime Roots turkey with housemade gravy, small or large. The turkey is gluten-free and soy-free; the gravy on the side contains gluten.'),
    jsonb_build_object('name', 'Apple Sage Stuffing', 'price', '$48 / $82', 'desc', 'Ripped French bread, golden apples and pecans. Soy-free; contains nuts.'),
    jsonb_build_object('name', 'Mac and Cheese', 'price', '$48 / $82', 'desc', 'Classic and creamy. Soy-free.'),
    jsonb_build_object('name', 'Green Bean Casserole', 'price', '$48 / $82', 'desc', 'Topped with house made French fried onions. Gluten-free and soy-free.'),
    jsonb_build_object('name', 'Whipped Potatoes', 'price', '$48 / $82', 'desc', 'Fluffy and delicious. Gluten-free and soy-free.'),
    jsonb_build_object('name', 'Mushroom Shallot Gravy', 'price', '$10 / $20', 'desc', 'Roasted shallot and mushroom gravy. Soy-free.'),
    jsonb_build_object('name', 'Cranberry Citrus Relish', 'price', '$10 / $20', 'desc', 'The chef''s cranberry relish with notes of citrus. Gluten-free and soy-free.'),
    jsonb_build_object('name', 'Pies', 'price', '$45', 'desc', '9 inch, serves 8 to 10: Pumpkin, Apple Crumble, Chocolate Pecan or Classic Pecan. Order pies by Tue Nov 17 at 5 PM.'),
    jsonb_build_object('name', 'Whipped Cream', 'price', '$10 / $20', 'desc', 'Whipped cream topping, small or large. Gluten-free.')
  ),
  'https://www.dc-vegan.com/', date '2026-11-20',
  'Wed Nov 25, 10 AM to 5 PM, at DC Vegan Deli, 1633 P St NW. Pies must be ordered by Tue Nov 17 at 5 PM; everything else by Fri Nov 20 at 5 PM. It comes refrigerated, with heating instructions. Questions: sales@dc-vegan.com.',
  '$10 to $529',
  'From DC Vegan''s Instagram menu (Sean sent it, 2026-11-10). Order link is their site until Sean sends the direct order page.',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.id = 'b18026b9-01b7-45c5-a84e-b6cb84c561cf' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);

update ve_holiday_menu_tips set link = 'https://www.dc-vegan.com/', updated_at = now()
where holiday_slug = 'thanksliving' and place_name = 'DC Vegan' and link = 'https://dcvegan.com';

update events set ticket_url = 'https://www.dc-vegan.com/', source_url = 'https://www.dc-vegan.com/', organizer_url = 'https://www.dc-vegan.com/', updated_at = now()
where id = '5e0cab7f-fd90-406e-a444-d6a41e8d92bd' and ticket_url = 'https://dcvegan.com';

-- Their direct order page (Sean, 2026-11-10), tracking codes left off.
update ve_holiday_menus set order_url = 'https://www.dc-vegan.com/catering-homepage', updated_at = now()
where listing_id = 'b18026b9-01b7-45c5-a84e-b6cb84c561cf' and holiday_slug = 'thanksliving';
update ve_holiday_menu_tips set link = 'https://www.dc-vegan.com/catering-homepage', updated_at = now()
where place_name = 'DC Vegan' and holiday_slug = 'thanksliving';
