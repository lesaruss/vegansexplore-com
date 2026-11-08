-- ve-holiday-guide: the first ThanksLiving menus spotted by our team (2026-11-08, from Sean's screenshots).
-- Each link and detail was checked on the place's own site (read through pg_net); we link out, never copy.
-- Applied through the connector on 2026-11-08 (ids 01ea4785..., d365b9d4..., 8f1bdddc...). Safe to re-run: skips a link already there.
insert into ve_holiday_menu_tips (holiday_slug, member_id, listing_id, place_name, city, state, link, note, status, by_team, reviewed_by, reviewed_at)
select v.* from (values
 ('thanksliving','72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid,'76a76ea5-1746-4b09-a832-19d5d14a40b0'::uuid,'Dina''s Vegan Deli & Desserts','Riviera Beach','FL','https://dinasvegandeli.com',
  'Thanksgiving platter: harvest seitan with brown gravy, mashed potatoes, garlic green beans, mac and cheese, cranberry sauce, $29.95. Order by Sun Nov 22, pickup Wed Nov 25. Preorder on their site or at 561-623-8643.','live',true,'72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid,now()),
 ('thanksliving','72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid,'7257d0ea-ce61-4efc-9562-865dd35e9a50'::uuid,'Soulicious Vegan Kitchen','Apopka','FL','https://souliciousvegankitchen.com/collections/thanksgiving-menu',
  'Thanksgiving menu that feeds up to 6: jackfruit brisket and oyster mushroom entrees, half trays of mac and cheese, collard greens, dirty rice and cornbread dressing, plus crab cakes and brisket sliders.','live',true,'72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid,now()),
 ('thanksliving','72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid,null::uuid,'A Broken Angel','Bend','OR','https://www.abrokenangel.com/dreams/2026/11/06/thanksgiving-feast-for-four-2026',
  'Compassionate Thanksgiving feast for 4 or more, $199: wild mushroom Wellington, black truffle mac, pear salad and sides. Order by Nov 18, pickup Wed Nov 25, 2 to 4 PM at their food cart. Sells out every year.','live',true,'72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid,now())
) v(holiday_slug, member_id, listing_id, place_name, city, state, link, note, status, by_team, reviewed_by, reviewed_at)
where not exists (select 1 from ve_holiday_menu_tips t where t.holiday_slug = v.holiday_slug and t.link = v.link);
