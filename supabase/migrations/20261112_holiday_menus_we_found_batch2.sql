-- 2026-11-12: Menus We Found, batch 2, from Sean's screenshot folder "Ideas 111226" (Drive, contact@lesaruss.com).
-- Same path as batch 1 (2026-11-10): team drafts in ve_holiday_menu_tips, status pending, for Sean to open the link and
-- approve in Depot > Holiday menus (#tips/pending). Third person, Vegan capitalized, linked out, never copied.
-- Safe to run twice: each insert skips when a tip with the same holiday and link already exists.
insert into ve_holiday_menu_tips (holiday_slug, member_id, listing_id, place_name, city, state, link, note, status, by_team, team_note)
select 'thanksliving', '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid,
       (select id from listings where slug = x.slug and status = 'approved' limit 1),
       x.place, x.city, x.state, x.link, x.note, 'pending', true,
       'Menus We Found draft, 2026-11-12, from Sean''s screenshot ideas 111226 - ' || x.shots || '. Open the link before approving.'
from (values
  ('christophers-kitchen', 'Christopher''s Kitchen', 'Palm Beach Gardens', 'FL', 'https://www.instagram.com/christopherskitchen/',
   'A Thanksgiving dinner for two at $92: veggie loaf with maple glaze, fingerling potatoes, sweet potato casserole, green beans, quinoa stuffing, shiitake gravy and pumpkin cheesecake. Whole pies $75. Pre-order by Sun Nov 22 at 561-318-6191; pickup Wed Nov 25, 11 AM to 8 PM. Closed Thanksgiving Day.', '4'),
  ('darbster', 'Darbster', 'West Palm Beach', 'FL', 'https://darbster.com',
   'Open on Thanksgiving Day, Thu Nov 26, 12 to 5 PM, with a special Vegan Thanksgiving dinner menu (full menu coming soon). Reservations are open now by phone at 561-586-2622.', '5, 6'),
  (null, 'Graze', 'Nashville', 'TN', 'https://www.instagram.com/grazenashville/',
   'Thanksgiving to go from this all-Vegan East Nashville bistro: tofu or seitan medallion roasts ($70 for 12 slices), mac and cheese, mashed potatoes, green bean casserole, biscuits, mushroom gravy and pumpkin cheesecake. Order by Thu Nov 19; pickup Wed Nov 25, noon to 8 PM.', '12'),
  ('the-rabbit-hole', 'The Rabbit Hole', 'Pompano Beach', 'FL', 'https://www.instagram.com/rabbitholelife/',
   'Thanksgiving platters at $30: the Explorer (Chef Sam''s meatloaf, garlic herb potatoes, crispy Brussels sprouts, Parker House rolls) or the Giver (orange sage turkey, stuffing, mac and cheese, spicy collards). A family size feeds 4 to 6 for $165, sides are $18 and pies come by the slice or whole.', '14'),
  ('la-chia-vegana', 'La Chia Vegana', 'Lake Worth Beach', 'FL', 'https://www.instagram.com/lachiavegana/',
   'This all-Vegan Latin cafe has Thanksgiving pre-orders open: chick''n pot pie, cashew mac and cheese, buttery mashed potatoes, mushroom gravy, balsamic glazed Brussels sprouts and pumpkin cobbler. Pre-order by Instagram message.', '28'),
  ('mama-chea-cafe', 'Mama Cheá Café', 'Davie', 'FL', 'https://mamacheacafe.com',
   'The whole Vegan feast for $127.99 feeds 3 to 4: pumpkin Alfredo penne with walnut meatballs, garlic butter veggies, marshmallow yams, harvest slaw and four guava cinnamon rolls. Order by Mon Nov 23 at mamacheacafe.com or 754-777-0915; pickup Wed Nov 25, 1 to 6 PM. Contains walnuts, cashews and wheat.', '29, 30')
) as x(slug, place, city, state, link, note, shots)
where not exists (select 1 from ve_holiday_menu_tips t where t.holiday_slug = 'thanksliving' and t.link = x.link and t.status <> 'declined');
