-- Ideas 111326 (Sean's screenshots, 2026-11-13; Sean: "let's get the Thanksgiving menus... let's get all these going and confirm
-- what has been posted"). Full menus copied as printed from each business's own post, in the third person, built by the team
-- (member_id = Sean, as A Broken Angel and Raw Chef Carla). Safe to run twice.
--   1. Listings: Not Ya Average Leaf added (Birmingham food truck); Da Meat Up and My Hungry Vegan put back (both now have a city,
--      phone and a 100% Vegan menu); Joy's Green Kitchen is Fully Vegan (its own menu says so) and in Atlanta; The Rabbit Hole in South Florida.
--   2. Full ThanksLiving menus: The Rabbit Hole (the whole menu, replacing the short Spotted card; Sean: "it looked lighter than what was
--      in that image"), Joy's Green Kitchen, Not Ya Average Leaf, Da Meat Up, My Hungry Vegan.
--   3. Events: Critter Creek's December Farmer's Moo-ket (Dec 6), the Philly Vegan Social Club and Vegan Kween spin class (Dec 5),
--      Vegans in Clermont's Winter Solstice Soiree (Dec 20).
-- Left out: Vibe Vegan and Vegan Byy Nature (no city on the posts or the web; nothing is listed on a guess).

-- 1. Listings ---------------------------------------------------------------------------------------------------------------
insert into listings (name, slug, category, specialty, description, status, location, phone, email, instagram, address_city,
  address_state, address_country, latitude, longitude, business_status, vegan_status, initials, crawl_source, communities, listed_at,
  details, updated_at)
select 'Not Ya Average Leaf', 'not-ya-average-leaf-birmingham', 'Food Trucks', '',
  'Not Ya Average Leaf is a 100% Vegan food truck in Birmingham, Alabama ("where Vegan ain''t boring"), posting its stops each week. Its menu runs from oyster mushrooms, Vegan wyngz and BBQ ribz to lasagna, mac and yams with pineapple, and it takes bookings and holiday orders.',
  'approved', 'Birmingham, AL', '(205) 317-8068', 'notyaaverageleaf@gmail.com', 'notya_averageleaf', 'Birmingham', 'AL', 'US',
  33.5186, -86.8104, 'OPERATIONAL', 'fully_vegan', 'N', 'admin', '{}', now(),
  jsonb_build_object('added_by_hand', jsonb_build_object('by', 'Logan', 'at', now()),
    'admin_notes', jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Added in the back end for Sean (2026-11-14), from its Thanksgiving menu in Ideas 111326. A food truck: the point is the Birmingham city centre. Logo still to fill.'))),
  now()
where not exists (select 1 from listings where slug = 'not-ya-average-leaf-birmingham');

update listings set status = 'approved', category = 'Catering', location = 'Riverview, FL', address_city = 'Riverview',
  address_state = 'FL', address_country = 'US', latitude = 27.8661, longitude = -82.3265, phone = '(813) 648-9903',
  vegan_status = 'fully_vegan', communities = array['central-florida'], listed_at = coalesce(listed_at, now()),
  description = 'Da Meat Up cooks 100% plant-based and Vegan comfort food in the Tampa Bay area: faux-tail, Jamaican-style pepper steak, smothered chkn, wangz and BBQ jackfruit ribz with mac and chz, rice and peas, collards and candied yams. Orders by Instagram message or phone, with pickups in Riverview and Apollo Beach.',
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('admin_notes', coalesce(details->'admin_notes', '[]'::jsonb) ||
    jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Put back for Sean (2026-11-14, Ideas 111326): its Plants-Giving menu gives the phone and Riverview and Apollo Beach pickups. The point is Riverview''s centre.'))),
  updated_at = now()
where slug = 'dameatup' and status <> 'approved';

update listings set status = 'approved', category = 'Catering', location = 'Riverview, FL', address_country = 'US',
  latitude = 27.8661, longitude = -82.3265, phone = '(813) 360-9430', email = 'myhungryvegans@gmail.com', instagram = 'my_hungry_vegan',
  vegan_status = 'fully_vegan', communities = array['central-florida'], listed_at = coalesce(listed_at, now()),
  description = 'My Hungry Vegan is a Vegan caterer in Riverview, Florida ("Stay hungry"), cooking Southern comfort food like Vegan oxtails, fried oyster mushrooms, cornbread stuffing and collard greens, with cakes, pies and banana pudding for the holidays.',
  details = coalesce(details, '{}'::jsonb) || jsonb_build_object('admin_notes', coalesce(details->'admin_notes', '[]'::jsonb) ||
    jsonb_build_array(jsonb_build_object('at', now(), 'by', 'Logan', 'kind', 'note',
      'text', 'Put back for Sean (2026-11-14, Ideas 111326): it turned up with a holiday menu, phone, email and Instagram. The point is Riverview''s centre.'))),
  updated_at = now()
where slug = 'my-hungry-vegan-riverview' and status <> 'approved';

update listings set vegan_status = 'fully_vegan', communities = array['atlanta'], updated_at = now()
where slug = 'joy-s-green-kitchen' and (vegan_status is distinct from 'fully_vegan' or not ('atlanta' = any(communities)));

update listings set communities = array['south-florida'], updated_at = now()
where id = 'cf9d2ed0-d0a5-4059-92dc-d52d849aff4c' and not ('south-florida' = any(communities));

-- 2. Full ThanksLiving menus ------------------------------------------------------------------------------------------------
with m(slug, summary, items, order_url, order_by, pickup, price_range, contact_note) as (values
  ('rabbit-hole', 'The Rabbit Hole''s 100% Vegan Thanksgiving menu: two platters (the Explorer and the Giver), a family size for 4 to 6, six sides and two pies by the slice or whole. Orders by call, text or email, for pickup on Thanksgiving Day.',
   $j$[
    {"name":"The Explorer Platter","desc":"Chef Sam's meatloaf, garlic herb potatoes with shallot gravy, crispy Brussels sprouts with gochujang brown butter and Parker House rolls.","price":"$30"},
    {"name":"The Giver Platter","desc":"Orange sage turkey, bread and butter stuffing with cranberry and apple sauce, Southern mac and cheese and spicy collards.","price":"$30"},
    {"name":"Family Platter","desc":"A platter for 4 to 6 people.","price":"$165"},
    {"name":"Bread & Butter Stuffing","desc":"Side, feeds 1 to 2.","price":"$18"},
    {"name":"Garlic Herb Mashed Potatoes with Gravy","desc":"Side, feeds 1 to 2.","price":"$18"},
    {"name":"Crispy Brussels Sprouts","desc":"Side, feeds 1 to 2.","price":"$18"},
    {"name":"Apple Cranberry Sauce","desc":"Side, feeds 1 to 2.","price":"$18"},
    {"name":"Baked Mac & Cheese","desc":"Side, feeds 1 to 2.","price":"$18"},
    {"name":"Maple Cinnamon Cornbread","desc":"Side, feeds 1 to 2.","price":"$18"},
    {"name":"Pumpkin Pie","desc":"By the slice or whole.","price":"$10 slice, $55 whole"},
    {"name":"Dutch Apple Pie","desc":"By the slice or whole.","price":"$10 slice, $55 whole"}
   ]$j$, 'https://www.instagram.com/rabbitholelife/', null::date, 'Pickup Thursday, Nov 26.', '$10 to $165',
   'Order by call, text or email: (954) 419-4899.'),
  ('joy-s-green-kitchen', 'Joy''s Green Kitchen''s Thanksgiving menu is fully Vegan: a build-your-own plate for one, then proteins, sides, vegetables, breads, sauces and desserts by the half pan, all packed cold for easy reheating at home.',
   $j$[
    {"name":"Build Your Thanksgiving Plate","desc":"One protein (lentil loaf with sweet and smoky glaze, smoked seitan turkey with savory gravy, or brown sugar-citrus glazed seitan ham), three sides (4-cheese baked mac and cheese, sauteed cabbage, Southern-style dressing, potato salad, collard greens or candied yams) and a cornbread muffin or drop biscuit.","price":"$45"},
    {"name":"Stuffed Seitan Roast with Dressing","desc":"Half pan, serves 8 to 10.","price":"$85"},
    {"name":"Smothered Chick'n Wings with Savory Onion Gravy","desc":"Half pan, serves 8 to 10.","price":"$115"},
    {"name":"Crab Cakes with Dill Aioli","desc":"Chickpea and hearts of palm. Half pan, serves 8 to 10.","price":"$85"},
    {"name":"Hickory BBQ Jackfruit (GF)","desc":"Half pan, serves 8 to 10.","price":"$85"},
    {"name":"Smoked Seitan \"Turkey\" with Savory Gravy","desc":"Half pan, serves 8 to 10.","price":"$75"},
    {"name":"Lentil Loaf with Sweet & Smoky Glaze (GF)","desc":"Half pan, serves 8 to 10.","price":"$70"},
    {"name":"Brown Sugar-Citrus Glazed Ham (Seitan)","desc":"Half pan, serves 8 to 10.","price":"$75"},
    {"name":"Roasted Cauliflower Steak with Garlic-Herb Gravy (GF)","desc":"Half pan, serves 8 to 10.","price":"$70"},
    {"name":"Chick'n & Dumplings or Cajun Gumbo","desc":"Half pan, serves 8 to 10.","price":"$90"},
    {"name":"Spinach & Artichoke Dip","desc":"With corn tortilla chips. Half pan, serves 8 to 10.","price":"$85"},
    {"name":"Award-Winning 4-Cheese Baked Mac & Cheese","desc":"Half pan, serves 10 to 15.","price":"$90"},
    {"name":"Sides by the Half Pan","desc":"Serves 10 to 15: creamy corn chowder (GF) $65, Southern-style dressing $75, creamy feta red-skin mashed potatoes (GF) $65, buttery mashed potatoes and gravy (GF) $60, brown rice and quinoa pilaf with cranberries, pecans and roasted butternut $75, creamy potato salad $65, Southern-style Cajun seafood pasta salad (chickpea-based) $80, cowboy caviar $70, herb-butter broccolini (GF) $65, Southern-style collard greens (GF) $75, sweet potato cornbread pudding $75.","price":"$60 to $80"},
    {"name":"Additional Veggies by the Half Pan","desc":"Serves 10 to 15: stuffed acorn squash with wild rice, cranberries and walnuts $85, shaved Brussels and apple slaw $65, sweet thyme glazed carrots $65, sweet and savory glazed Brussels sprouts $70, maple-sage Hasselback butternut squash $85, green bean casserole $75, herb butter Parmesan corn $65, marinated cheesy-smoked kale salad $70.","price":"$65 to $85"},
    {"name":"Breads by the Dozen","desc":"Sweet potato biscuits $45, dinner yeast rolls $35, classic cornbread $35.","price":"$35 to $45"},
    {"name":"Sauces by the Pint","desc":"House gravy, cranberry compote, cilantro-lime crema, dill aioli and more.","price":"$15 each"},
    {"name":"Cheesecakes","desc":"Serves 8 to 10: classic Oreo $85, sweet potato $80.","price":"$80 to $85"},
    {"name":"Dessert Pans","desc":"Half pan, serves 12 to 15: layered Southern banana pudding $75, glazed apple cider cake $65, salted caramel bread pudding $80.","price":"$65 to $80"},
    {"name":"Single Desserts","desc":"One to two servings: Southern banana pudding $15, sweet potato cheesecake $15, apple cider cake $12, salted caramel bread pudding $12.","price":"$12 to $15"}
   ]$j$, 'https://www.joysgreenkitchen.com', date '2026-11-21',
   'Wed Nov 25, 9 AM to 1 PM: pickup at Leaven Kitchen, 215 Laredo Dr, Suite 100, Decatur, GA 30030, or delivery. Packed cold for reheating at home.',
   '$12 to $115', 'Order by email: joy@joysgreenkitchen.com. A 30% rush fee applies to orders placed within 48 hours of pickup or delivery.'),
  ('not-ya-average-leaf-birmingham', 'Not Ya Average Leaf''s 100% Vegan Thanksgiving menu: nine dishes, each by the half-size pan (feeds 10) or the personal pan (feeds 3). Orders by text; the invoice and pickup details come back by text.',
   $j$[
    {"name":"Mac & Chz","desc":"Half-size pan (feeds 10) or personal pan (feeds 3).","price":"$94 half, $50 personal"},
    {"name":"Cornbread Dressing + Cranberry Sauce","desc":"Half-size pan (feeds 10) or personal pan (feeds 3).","price":"$90 half, $50 personal"},
    {"name":"Jackfruit \"Ham\" Pieces","desc":"Half-size pan (feeds 10) or personal pan (feeds 3).","price":"$75 half, $40 personal"},
    {"name":"Fresh Cut Candied Yams Casserole","desc":"Half-size pan (feeds 10) or personal pan (feeds 3).","price":"$90 half, $50 personal"},
    {"name":"Collard Greens","desc":"Half-size pan (feeds 10) or personal pan (feeds 3).","price":"$86 half, $47 personal"},
    {"name":"Deviled Eggz","desc":"Half-size pan (feeds 10) or personal pan (feeds 3).","price":"$51 half, $28 personal"},
    {"name":"Vegan Wyngz","desc":"BBQ, buffalo, lemon pepper or huney hot. Half-size pan (feeds 10) or personal pan (feeds 3).","price":"$230 half, $100 personal"},
    {"name":"Oyster Mushrooms","desc":"Half-size pan (feeds 10) or personal pan (feeds 3).","price":"$215 half, $95 personal"},
    {"name":"BBQ Vegan Ribz","desc":"Half-size pan (feeds 10) or personal pan (feeds 3).","price":"$150 half, $65 personal"}
   ]$j$, 'https://www.instagram.com/notya_averageleaf/', null::date, 'Pickup details come with the invoice.', '$28 to $230',
   'Text (205) 317-8068 with the order; the invoice and pickup details are sent back.'),
  ('dameatup', 'Da Meat Up''s Plants-Giving preorder menu is 100% plant-based and Vegan comfort food: a build-your-own family tray for 4, or half pans of each meat and side for 8 to 10.',
   $j$[
    {"name":"Build Your Own Family Tray","desc":"Serves 4. One meat (BBQ jackfruit ribz +$15, smothered chkn, Jamaican-style pepper steak, faux-tail +$25, or wangz in hunny hot, BBQ, buffalo or lemon pepper) and two sides (creamy mac and chz, candied yams, Jamaican rice and peas, collard greens or Cajun cabbage).","price":"From $95"},
    {"name":"Faux-Tail","desc":"Half pan, about 8 to 10 servings.","price":"$150"},
    {"name":"Jamaican Style Pepper Steak","desc":"Half pan, about 8 to 10 servings.","price":"$125"},
    {"name":"Smothered CHKN","desc":"Half pan, about 8 to 10 servings.","price":"$125"},
    {"name":"Wangz","desc":"50 pieces, two sauces.","price":"$135"},
    {"name":"BBQ Jackfruit Ribz","desc":"27 pieces.","price":"$135"},
    {"name":"Creamy Mac & Chz","desc":"Half pan, about 8 to 10 servings.","price":"$65"},
    {"name":"Rice & Peas","desc":"Half pan, about 8 to 10 servings.","price":"$55"},
    {"name":"Collard Greens","desc":"Half pan, about 8 to 10 servings.","price":"$45"},
    {"name":"Cajun Cabbage","desc":"Half pan, about 8 to 10 servings.","price":"$45"},
    {"name":"Candied Yams","desc":"Half pan, about 8 to 10 servings.","price":"$45"}
   ]$j$, 'https://www.instagram.com/dameatup/', date '2026-11-20',
   'Tue Nov 24, 4 to 6 PM at Crunch Riverview, or Wed Nov 25, 4 to 6 PM at Crunch Apollo Beach. Pickup window confirmed with the order.',
   '$45 to $150', 'Order by noon Nov 20: message @dameatup or call or text (813) 648-9903. Full payment required, limited availability, prices before tax; tell them about any allergies.'),
  ('my-hungry-vegan-riverview', 'My Hungry Vegan''s holiday catering is open: Southern Vegan comfort food and desserts in standard sizes that feed 5 to 8. Prices by phone or email.',
   $j$[
    {"name":"Cornbread Stuffing","desc":"Feeds 5 to 8.","price":""},
    {"name":"Southern Collard Greens","desc":"Feeds 5 to 8.","price":""},
    {"name":"Vegan Oxtails","desc":"Feeds 5 to 8.","price":""},
    {"name":"Fried Oyster Mushrooms","desc":"Feeds 5 to 8.","price":""},
    {"name":"Creamy Mac N Cheese","desc":"Feeds 5 to 8.","price":""},
    {"name":"Garlic Mashed Potatoes","desc":"Feeds 5 to 8.","price":""},
    {"name":"Tipsy Vegan Rum Cake","desc":"Dessert.","price":""},
    {"name":"Sweet Potato Pie","desc":"Dessert.","price":""},
    {"name":"Lemon Pound Cake","desc":"Dessert.","price":""},
    {"name":"Peach Cobbler Cupcakes","desc":"Dessert.","price":""},
    {"name":"Banana Pudding","desc":"Half pan.","price":""},
    {"name":"Musi Breeze","desc":"A drink, by the half gallon.","price":""}
   ]$j$, 'https://www.instagram.com/my_hungry_vegan/', null::date, null, null,
   'Order by phone or text with JD at (813) 360-9430, or email myhungryvegans@gmail.com.')
)
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, price_range,
  contact_note, team_note, submitted_at, reviewed_at, created_at, updated_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live', m.summary, m.items::jsonb, m.order_url, m.order_by, m.pickup,
  m.price_range, m.contact_note,
  'From Sean''s Ideas 111326 screenshot of its own post (2026-11-13); every item as printed. Built by Logan 2026-11-14.', now(), now(), now(), now()
from m join listings l on (l.slug = m.slug or (m.slug = 'rabbit-hole' and l.id = 'cf9d2ed0-d0a5-4059-92dc-d52d849aff4c'))
where not exists (select 1 from ve_holiday_menus x where x.listing_id = l.id and x.holiday_slug = 'thanksliving' and x.status = 'live');

-- 3. Events ------------------------------------------------------------------------------------------------------------------
select ve_event_intake(jsonb_build_object(
  'title', 'Critter Creek Farm Sanctuary December Farmer''s Moo-ket',
  'description', 'Critter Creek Farm Sanctuary''s holiday Farmer''s Moo-ket in Gainesville: plant-based vendors for holiday shopping, live music from Lifted Riffs, and a chance to meet the rescued residents and feed them treats. A $5 suggested donation at the gate goes to the animals'' care; no tickets are needed. Closed-toe shoes are required in the pig pasture, which may close at 3:30 PM or earlier.',
  'starts_at', '2026-12-06T12:00:00-05:00', 'ends_at', '2026-12-06T16:00:00-05:00', 'timezone', 'America/New_York',
  'location_name', 'Critter Creek Farm Sanctuary', 'address', '12626 NW County Road 231', 'city', 'Gainesville', 'state', 'FL', 'country', 'US',
  'category', 'market', 'is_free', true, 'ticket_url', 'https://crittercreekfarmsanctuary.org/farmers-moo-kets/',
  'host_listing_id', (select id from listings where slug = 'critter-creek-farm-sanctuary'), 'organizer_name', 'Critter Creek Farm Sanctuary',
  'organizer_url', 'https://crittercreekfarmsanctuary.org/'), 'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', true);

select ve_event_intake(jsonb_build_object(
  'title', 'Ready to Spin? A Cycling Class with Philly Vegan Social Club and Vegan Kween',
  'description', 'Philly Vegan Social Club and Vegan Kween (KJ) host a cycling class at Sweat Cycle Philly, with food by Gangster Vegan Organics. Everyone is welcome. $15 a person; tickets must be bought before the day.',
  'starts_at', '2026-12-05T12:00:00-05:00', 'timezone', 'America/New_York',
  'location_name', 'Sweat Cycle Philly', 'address', '1826 W Cabot St', 'city', 'Philadelphia', 'state', 'PA', 'country', 'US',
  'category', 'social', 'is_free', false, 'price_cents', 1500, 'ticket_url', 'https://partiful.com/u/VrM8jI2gyGMs9BJWvXNi',
  'host_listing_id', (select id from listings where slug = 'philly-vegan-social-club'), 'organizer_name', 'Philly Vegan Social Club and Vegan Kween'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', true);

select ve_event_intake(jsonb_build_object(
  'title', 'Winter Solstice Soirée by Vegans in Clermont',
  'description', 'Vegans in Clermont celebrates the holidays and the turn of the season in Historic Downtown Clermont, raising funds for NATIV SPACE (a chapter of Saving the Seas Corp) and the Plant Based Treaty.',
  'starts_at', '2026-12-20T16:00:00-05:00', 'ends_at', '2026-12-20T20:00:00-05:00', 'timezone', 'America/New_York',
  'location_name', 'Historic Downtown Clermont', 'city', 'Clermont', 'state', 'FL', 'country', 'US',
  'category', 'fundraiser', 'ticket_url', 'http://vegansinclermont.com/',
  'host_listing_id', (select id from listings where slug = 'vegans-in-clermont'), 'organizer_name', 'Vegans in Clermont'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', true);

-- ve_event_intake defaults is_free to true: the spin class is $15, the soiree's price is not on the post.
update events set is_free = false where title = 'Ready to Spin? A Cycling Class with Philly Vegan Social Club and Vegan Kween' and is_free;
update events set is_free = null where title = 'Winter Solstice Soirée by Vegans in Clermont' and is_free;
