-- ve-holiday-guide: Raw Chef Carla's Thanksgiving dessert (Sean sent her Facebook post, 2026-11-10: "another one to drop in here... from Raw
-- Chef Carla, who is featured on our platform and who's also mentioned in our Wednesday podcast"). Entered by the team for her listing
-- (rawchefcarla, Miami; her three other listings are rejected duplicates) and live at once. The dish photo is from her post, cropped square
-- (vegan-media/media/holiday-menus/rawchefcarla/). Her post gives no order link or order-by date, so the card shows neither; add them when
-- she sends them. Safe to run twice.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, price_range, team_note, reviewed_by, reviewed_at)
select 'thanksliving', l.id, '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 'live',
  'Pumpkin or chocolate? A raw, plant-based Pumpkin Chocolate cake for the ThanksLiving table, from a Miami raw chef.',
  jsonb_build_array(
    jsonb_build_object('section', 'Thanksgiving Menu', 'name', 'Pumpkin Chocolate', 'price', '$105',
      'desc', 'Chocolate coconut crust, pumpkin spice filling, chocolate ganache and cacao nibs.',
      'photo', 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/holiday-menus/rawchefcarla/dish-pumpkin-chocolate.jpg')
  ),
  null, null, '$105',
  'From Raw Chef Carla''s Facebook post (Sean sent it, 2026-11-10). No order link or order-by date in the post: ask her for both.',
  '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()
from listings l
where l.slug = 'rawchefcarla' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menus m where m.holiday_slug = 'thanksliving' and m.listing_id = l.id);
