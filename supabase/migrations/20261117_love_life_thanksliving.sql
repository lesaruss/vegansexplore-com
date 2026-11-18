-- Love Life Cafe's Thanksgiving pre-order (Sean's PDF of their page, 2026-11-17). What Sean hands over goes live. Safe to run twice.
insert into ve_holiday_menu_tips (holiday_slug, member_id, listing_id, place_name, city, state, link, note, status, by_team, team_note, reviewed_by, reviewed_at)
select 'thanksliving', '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, l.id, 'Love Life Cafe', 'Miami', 'FL', 'https://lovelifecafe.com',
  'Love Life Cafe''s 100% Vegan Thanksgiving dinner package is $250 and serves 4 to 6: meatloaf, mac and cheese, mashed potatoes, roasted sweet potatoes, kale salad and a 9-inch gluten-free apple pie. Pre-order through Sun Nov 22 (up to 5 packages an order). Pickup Thanksgiving Day, Thu Nov 26, 10 AM to 3 PM, at 2616 NW 5th Ave in Wynwood.',
  'live', true, 'From Sean''s PDF of the Love Life Cafe Thanksgiving page, 2026-11-17.', '72712a4a-ea0e-4ef4-a29e-d382496ef8da'::uuid, now()
from listings l where l.slug = 'love-life-cafe' and l.status = 'approved'
  and not exists (select 1 from ve_holiday_menu_tips t where t.holiday_slug = 'thanksliving' and t.listing_id = l.id and t.status <> 'declined');
