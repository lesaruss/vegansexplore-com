-- ve-holiday-guide: A Broken Angel's 2026 Thanksgiving Feast for Four (Sean, 2026-11-10: "a broken angel... let's put their menus
-- together"), entered by the team for its new listing (20261110_listings_from_screenshots.sql) and live at once, in the Nana's A Vegan
-- format. From their own 2026 page (the team's found-menu note, 2026-11-08); their site is not readable from the build session, so the
-- sides are not itemized. Order by Nov 18; pickup Wed Nov 25, 2 to 4 PM, at the cart. Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, price_range, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'A compassionate Thanksgiving feast for four or more from Bend''s original Vegan food cart. It sells out every year.',
  jsonb_build_array(
    jsonb_build_object('section', 'Thanksgiving Feast', 'name', 'Feast for Four', 'price', '$199', 'desc', 'Feeds four or more: a wild mushroom Wellington, black truffle mac, a pear salad and sides.'),
    jsonb_build_object('section', 'In the Feast', 'name', 'Wild Mushroom Wellington', 'price', '', 'desc', ''),
    jsonb_build_object('section', 'In the Feast', 'name', 'Black Truffle Mac', 'price', '', 'desc', ''),
    jsonb_build_object('section', 'In the Feast', 'name', 'Pear Salad', 'price', '', 'desc', ''),
    jsonb_build_object('section', 'In the Feast', 'name', 'Sides', 'price', '', 'desc', 'See their page for this year''s sides.')
  ),
  'https://www.abrokenangel.com/dreams/2026/11/06/thanksgiving-feast-for-four-2026', date '2026-11-18',
  'Wed Nov 25, 2 to 4 PM, at the cart, 1124 NW Newport Ave, Bend.',
  '$199',
  'From A Broken Angel''s 2026 Thanksgiving page (team note, 2026-11-08); built at Sean''s ask, 2026-11-10.',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.slug = 'a-broken-angel' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);
