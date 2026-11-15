-- 2026-11-15: Menus We Found, batch 3, from Sean's screenshot folder "Ideas 111526" (Drive). Sean: "go".
-- Same path as batches 1 and 2: team drafts in ve_holiday_menu_tips, status pending, for Sean to open the link and
-- approve in Depot > Holiday menus (#tips/pending). Third person, Vegan capitalized, linked out, never copied.
-- Left out: Mattie's Mindful Meals (Long Beach) and the panaderia (panaderiala_mx): no link we could confirm.
-- Safe to run twice: each insert skips when a tip with the same holiday and link already exists.
insert into ve_holiday_menu_tips (holiday_slug, member_id, listing_id, place_name, city, state, link, note, status, by_team, team_note)
select x.hol, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid,
       (select id from listings where slug = x.slug and status = 'approved' limit 1),
       x.place, x.city, x.state, x.link, x.note, 'pending', true,
       'Menus We Found draft, 2026-11-15, from Sean''s screenshot ideas 111526 - IMG_' || x.shots || '. Open the link before approving.'
from (values
  ('thanksliving', 'peacefood-upper-west-side', 'Peacefood', 'New York', 'NY', 'https://www.peacefoodnyc.com',
   'Peacefood serves a ThanksLiving prix fixe holiday dinner at $45 from Thu Nov 26, 1 PM: chunk steak (+$5), holiday pot roast, lentil walnut loaf or lemon caper un-turkey, with house-made stuffing, porcini mushroom gravy, orange mashed yam, string beans and champagne cranberry sauce. Starters include chestnut apple bisque and raw lasagna. Reservations are open, and apple cranberry, pecan, pumpkin and ube sweet potato pies can be pre-ordered at peacefoodnyc.com. 460 Amsterdam Ave.', '8266-8269'),
  ('thanksliving', null, 'Wong Way Veg', 'Denver', 'CO', 'https://wongwayveg.com/holiday',
   'Wong Way Veg''s 100% Vegan ThanksLiving dinner for two is $125 plus tax, with a seitan or tofu roast, sides and dessert. A la carte cakes and pies (apple butter oatmeal cream pies, pumpkin bread tiramisu, maple pumpkin bundt cake) and sides (stuffing fritters, green bean casserole, garlic leek mash, lotus root and carrot dumplings). Order by Fri Nov 20, 10 PM; pickup Wed Nov 25, 1 to 6 PM, at The Art Gym, 1460 Leyden St.', '8270-8271'),
  ('thanksliving', null, 'Loving Hut Glendora', 'Glendora', 'CA', 'https://www.instagram.com/lovinghutglendora/',
   'Loving Hut Glendora makes a homemade Vegan turkey for $59, stuffed with crouton, garbanzo, celery and mushroom, serving 6 to 8; order by Wed Nov 25. Its Thanksgiving menu runs Nov 20 to 26: pumpkin medley soup, a stuffed turkey slice with gravy, pumpkin cheesecake and a Thanksgiving plate at $19.95.', '8272-8273'),
  ('thanksliving', null, 'Vegan Airyy', 'Jacksonville', 'FL', 'https://www.instagram.com/veganairyy/',
   'Vegan Airyy caters ThanksLiving in Jacksonville and St. Johns: trays that feed up to 10, from mac and cheese ($110), collard greens ($80), jackfruit stuffing ($100) and jerk oyster mushrooms ($110) to sweet potato pie ($50). Orders need 48 hours'' notice, at 904-609-7262.', '8263'),
  ('thanksliving', 'vegan-junkie', 'Vegan Junkie', 'Fort Lauderdale', 'FL', 'https://www.instagram.com/veganjunkieburgers/',
   'Vegan Junkie''s 100% plant-based ThanksLiving menu has coquito and two tres leches cakes, date caramel and pumpkin spice. Order by Instagram message by Sat Nov 21; delivery Wed Nov 25.', '8275'),
  ('thanksliving', null, 'Follow Your Heart Market & Cafe', 'Canoga Park', 'CA', 'https://www.instagram.com/fyhmarketcafe/',
   'Follow Your Heart Market & Cafe serves a Thanksgiving special Tue Nov 24, 4 to 8 PM, and Wed Nov 25, noon to 8 PM, then brunch on Thanksgiving Day, 9 AM to 2:30 PM, with the special from 10 AM.', '8276'),
  ('thanksliving', null, 'Nana''s Rooted', 'Washington', 'DC', 'https://www.instagram.com/nanas.rooted/',
   'Nana''s Rooted serves a $15 Plantsgiving Plate at its Sunday brunch stand at the Trinidad Farmers Market, 9 AM to 1 PM, 1299 Neal St NE, beside empanadas, Trini doubles and the Crispy Jack sandwich.', '8284'),
  ('hanukkah', null, 'Blondies Vegan Bakery & Cafe', 'Boynton Beach', 'FL', 'https://blondiesvegan.com',
   'Blondies'' Hanukkah menu: matzah ball soup ($10.99 a pint, $20.99 a quart), a jackfruit brisket, a Hanukkah roast at $55.99 and latkes at $3.75 each, with sides and desserts.', '8277')
) as x(hol, slug, place, city, state, link, note, shots)
where not exists (select 1 from ve_holiday_menu_tips t where t.holiday_slug = x.hol and t.link = x.link and t.status <> 'declined');

-- The People's Harvest (Black VegFest), a free Vegan food giveaway on Thanksgiving Day, from IMG_8260; approved at once like the sanctuary events.
select ve_event_intake(jsonb_build_object(
  'title', 'The People''s Harvest: All Vegan Food Giveaway',
  'link', 'https://www.instagram.com/blackvegfest/',
  'starts_at', '2026-11-26T12:00:00-05:00', 'timezone', 'America/New_York', 'time_set', true,
  'category', 'food', 'event_type', 'in_person',
  'location_name', 'Eastern Parkway', 'address', '1119 Eastern Parkway', 'city', 'Brooklyn', 'state', 'NY', 'country', 'US',
  'organizer_name', 'Black VegFest', 'organizer_url', 'https://www.instagram.com/blackvegfest/',
  'description', 'Black VegFest gives away free Vegan food on Thanksgiving Day at The People''s Harvest, from noon at 1119 Eastern Parkway, Brooklyn.'),
  'admin', null, '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, true)
where not exists (select 1 from events where title ilike 'The People''s Harvest%' and starts_at::date = '2026-11-26');
