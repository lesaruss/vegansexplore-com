-- ve-holiday-guide: Vegetarian Delight Juice Bar's holiday catering (Sean sent their Holiday Catering store page as a PDF, their caption
-- and the order link, 2026-11-10), entered by the team for its listing (Miramar, 6060 Miramar Pkwy, the store page's address) and live at
-- once, in the Nana's A Vegan format with sections. The store page lists names and prices only. Pre-ordering is required; no order-by
-- date or pickup time was given. Their pastry and holiday beverage menus are separate store pages, not included. Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, pickup, price_range, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'Vegetarian Delight is back for the holidays with its Caribbean catering favorites: oxtail, griot, escovitch and brown stew, with mac and cheeze, rice and peas and more. Pre-order only, for Thanksgiving and Christmas.',
  jsonb_build_array(
    jsonb_build_object('section', 'Mains', 'name', 'Vegan OXTL', 'price', '$115', 'desc', ''),
    jsonb_build_object('section', 'Mains', 'name', 'Vegan BBQ Ribs', 'price', '$115', 'desc', ''),
    jsonb_build_object('section', 'Mains', 'name', 'Vegan Pepper STK', 'price', '$115', 'desc', ''),
    jsonb_build_object('section', 'Mains', 'name', 'Vegan Griot', 'price', '$185', 'desc', ''),
    jsonb_build_object('section', 'Mains', 'name', 'Vegan Sliced Fish', 'price', '$115', 'desc', ''),
    jsonb_build_object('section', 'Mains', 'name', 'Vegan Shrimp', 'price', '$185', 'desc', ''),
    jsonb_build_object('section', 'Mains', 'name', 'Escovitch Tofu', 'price', '$115', 'desc', ''),
    jsonb_build_object('section', 'Mains', 'name', 'Brownstew Tofu', 'price', '$115', 'desc', ''),
    jsonb_build_object('section', 'Mains', 'name', 'Curry Chickpeas', 'price', '$80', 'desc', ''),
    jsonb_build_object('section', 'Mains', 'name', 'Ackee Pasta', 'price', '$90', 'desc', ''),
    jsonb_build_object('section', 'Mains', 'name', 'Ital Stew', 'price', '$60', 'desc', ''),
    jsonb_build_object('section', 'Sides', 'name', 'Mac and Cheeze', 'price', '$95', 'desc', ''),
    jsonb_build_object('section', 'Sides', 'name', 'Rice and Peas', 'price', '$60', 'desc', ''),
    jsonb_build_object('section', 'Sides', 'name', 'Quinoa', 'price', '$65', 'desc', ''),
    jsonb_build_object('section', 'Sides', 'name', 'Steamed Greens', 'price', '$60', 'desc', ''),
    jsonb_build_object('section', 'Sides', 'name', 'Delight Cornbread Bowl', 'price', '$35', 'desc', ''),
    jsonb_build_object('section', 'Make It Yours', 'name', 'Personalized Half Pan', 'price', '$50', 'desc', '')
  ),
  'https://vegantraphouse.com/Holiday-Catering-c209104751',
  'Pre-order required. Pick up at 6060 Miramar Pkwy, Miramar. Questions: text (914) 227-5047, email delightjuicebar@gmail.com or message them on Instagram.',
  '$35 to $185',
  'From Vegetarian Delight''s Holiday Catering store page, caption and order link (Sean sent them, 2026-11-10).',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.id = '3adda089-3e3e-4871-b48e-a214a767ad54' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);

update ve_holiday_menu_tips set link = 'https://vegantraphouse.com/Holiday-Catering-c209104751', updated_at = now()
where holiday_slug = 'thanksliving' and place_name = 'Vegetarian Delight Juice Bar';
