-- ve-holiday-guide: Menus We Found (Sean, 2026-11-10: "go ahead with the Menus we found draft").
-- Sean's screenshots of ThanksLiving menus seen on social, researched and written in our own words, added as the team's menu tips
-- held at 'pending' so Sean approves each one in Depot > Holiday menus (#tips/pending) before it shows on the Guide.
-- Links go to the place's own site or Instagram (where its holiday post is). Safe to run twice: skips a link already there.
with src(place_name, city, state, link, listing_slug, note, shot) as (values
  ('The Plantisserie', 'Miami', 'FL', 'https://www.theplantisserie.com', 'the-plantisserie',
   'ThanksLiving plates at $40 a person (a main, a side and a slice of dessert), or family-size mains, sides and whole cakes. Order by Mon Nov 23 at 4 PM; pickup Wed Nov 25, noon to 9 PM. Order at store@theplantisserie.com or (786) 502-3363.', 'IMG_8161'),
  ('Pucker Up Vegan Eatery', 'Cocoa', 'FL', 'https://www.instagram.com/puckerup321/', 'pucker-up-vegan-eatery',
   'A Fall Feast for one at $26.99, Vegan turkey by the pound, sides that serve 8 to 12 and whole pies. Orders are online only and close Fri Nov 20.', 'IMG_8164'),
  ('Blondies Vegan Bakery & Cafe', 'Boynton Beach', 'FL', 'https://blondiesvegan.com', null,
   'A fall menu with a Thanksgiving Burger, chili, pumpkin bisque and a shepherd''s pie bowl, all Vegan, gluten free and nut free. Any 3 meals and 2 desserts delivered for $50 through Nov 20. Order by Instagram message or email.', 'IMG_8138, IMG_8139'),
  ('DC Vegan', 'Washington', 'DC', 'https://dcvegan.com', 'dc-vegan',
   'A ThanksLiving prix fixe dinner on Sun Nov 22 from 6 PM, reservation required: a Vegan turkey plate, a Wellington hand pie and a budino for dessert.', 'IMG_8167'),
  ('La Llamita Vegana', 'Philadelphia', 'PA', 'https://www.instagram.com/la.llamita.vegana/', 'la-llamita-vegana',
   'Peruvian, gluten-free Vegan holiday dishes. Pick up at Weavers Way Henry Got Crops on Nov 24 or Globe Dye Works Nov 25 to 26, or get delivery anywhere in the city.', 'IMG_8165'),
  ('Black Rican Vegan', 'New York', 'NY', 'https://www.instagram.com/blackricanvegan/', 'black-rican-vegan',
   'Puerto Rican holiday plates: jackfruit pernil, chicharron, empanadas and coquito tres leches. $45 a meal, or $240 for a package that feeds 4 to 6. Pickup in Harlem Nov 24 to 25.', 'IMG_8170'),
  ('Nanas A Vegan', 'Bronx', 'NY', 'https://www.instagram.com/nanasavegan/', 'nanas-a-vegan',
   'A solo plate at $50 (with a gluten-free option), a Family Feast at $225 for 4 to 6 and an Ultimate Family Feast at $375 for 8 to 10. Banana pudding half pans too. Pickup Wed Nov 25, 5 to 8 PM.', 'IMG_8171 to IMG_8174'),
  ('Planted Soul ATL', 'Atlanta', 'GA', 'https://www.instagram.com/plantedsoulatl/', null,
   'Vegan soul food plates at $30 (chick''n, mac and cheese, collards, candied yams and cornbread dressing; two plate minimum), or half and full pans up to a $410 feast for 10 to 12. Order through the form on their Instagram; balance due Nov 25.', 'IMG_8156, IMG_8166'),
  ('Sunflower Bakehouse', 'Nashville', 'TN', 'https://www.instagram.com/sunflowernashbakehouse/', null,
   'Holiday pot pie, mac and cheeze, biscuits, focaccia, pies and cakes from this all-Vegan bakery. Call (615) 750-5499 to order.', 'IMG_8169'),
  ('Vegetarian Delight Juice Bar', 'Miramar', 'FL', 'https://www.instagram.com/delightjuicebar/', 'vegetarian-delight-juice-bar',
   'Holiday catering trays: Vegan oxtail, BBQ ribs, mac and cheeze, callaloo, breadfruit salad and cornbread, plus half-gallon holiday juices. Order by text, email or Instagram message.', 'IMG_8151 to IMG_8153'),
  ('My Organic Corner', 'Weston', 'FL', 'https://myorganiccorner.com', 'my-organic-corner',
   'This organic cafe offers plant-based (Pre-Vegan) options, and its holiday menu has a lentil loaf, sweet potatoes, gravy, green beans and pumpkin bread. Order online or call 954-888-4700.', 'IMG_8163')
)
insert into ve_holiday_menu_tips (holiday_slug, member_id, listing_id, place_name, city, state, link, note, status, team_note, by_team)
select 'thanksliving', '72712a4a-ea0e-4ef4-a29e-d382496ef8da', l.id, s.place_name, s.city, s.state, s.link, s.note, 'pending',
       'Menus We Found draft, 2026-11-10, from Sean''s screenshot ' || s.shot || '. Open the link before approving.', true
from src s
left join listings l on l.slug = s.listing_slug and l.status = 'approved'
where not exists (select 1 from ve_holiday_menu_tips t where t.holiday_slug = 'thanksliving' and t.link = s.link and t.status <> 'declined');
