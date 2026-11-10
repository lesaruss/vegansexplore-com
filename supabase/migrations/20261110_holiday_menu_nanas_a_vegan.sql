-- ve-holiday-guide: the prototype full holiday menu (Sean, 2026-11-10: "let's use Nana's A Vegan as the prototype of how the menu is
-- going to appear"). Read from Nana's A Vegan's own four-slide Instagram post (@nanasavegan, Oct 31, Sean's screenshots IMG_8171 to
-- IMG_8174) and entered by the team for its listing, live at once. Items keep ve-holiday's shape {name, desc, price}, 20 at most.
-- Pickup for every order is from their caption (Sean pasted it). Not on the post: an order-by date. Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, pickup, price_range, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'Plant-based soul food for ThanksLiving: pick a protein, your sides and dessert, from a solo plate to a feast for ten, with a gluten-free solo plate and Puddin'' Brat banana pudding trays.',
  jsonb_build_array(
    jsonb_build_object('name', 'Solo Meal', 'price', '$50', 'desc', '1 protein, 4 sides and dessert, with cranberry sauce and cornbread.'),
    jsonb_build_object('name', 'Family Feast', 'price', '$225', 'desc', 'Serves 4 to 6. 1 protein, 4 sides and dessert, with cranberry sauce and cornbread.'),
    jsonb_build_object('name', 'Ultimate Family Feast', 'price', '$375', 'desc', 'Serves 8 to 10. 2 proteins, 5 sides and 2 desserts, with cranberry sauce and cornbread.'),
    jsonb_build_object('name', 'Proteins', 'price', '', 'desc', 'Smothered Chick*n, BBQ Chick*n, Country-Style Meatloaf, Oxtails, Herb Roasted Turkey.'),
    jsonb_build_object('name', 'Sides', 'price', '', 'desc', 'Baked Mac and Cheese, Collard Greens, Candied Yams, Okra and Tomatoes, Potato Salad, Carolina Red Rice, String Beans, Herb Stuffing.'),
    jsonb_build_object('name', 'Desserts', 'price', '', 'desc', 'Classic Banana Puddin'', Biscoff Banana Puddin'', Sweet Potato Pie.'),
    jsonb_build_object('name', 'Gluten-Free Solo Meal', 'price', '', 'desc', 'Protein: Smothered Chick*n, BBQ Chick*n or Country-Style Meatloaf. Sides from Collard Greens, Candied Yams, Okra and Tomatoes, Potato Salad, Carolina Red Rice and String Beans. Dessert: Classic Banana Puddin''.'),
    jsonb_build_object('name', 'Puddin'' Brat: The OG', 'price', 'Half pan', 'desc', 'Classic banana pudding with vanilla wafers, fresh bananas, creamy vanilla pudding and whipped cream.'),
    jsonb_build_object('name', 'Puddin'' Brat: Biscoff Brat', 'price', 'Half pan', 'desc', 'Vanilla pudding layered with Biscoff cookies, fresh bananas, cookie butter and whipped cream.'),
    jsonb_build_object('name', 'Puddin'' Brat: Strawberry Shortie', 'price', 'Half pan', 'desc', 'Vanilla pudding with vanilla wafers, bananas, strawberries, strawberry puree, whipped cream and a strawberry crunch.')
  ),
  'https://www.instagram.com/nanasavegan/',
  'Wed Nov 25, 5 to 8 PM, in the Bronx. Order through the link in their Instagram bio.',
  '$50 to $375',
  'Prototype full menu, 2026-11-10, from Nana''s own post (Sean''s screenshots IMG_8171 to IMG_8174).',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.slug = 'nanas-a-vegan' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);
