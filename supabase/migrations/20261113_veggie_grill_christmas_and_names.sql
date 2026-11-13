-- Next Level Veggie Grill, Carrie Davis's second reply (2026-11-13): "UCLA should be excluded from the Thanksgiving menus" (it has none);
-- "Our menus for Christmas are the same as Thanksgiving... add those menus for all locations, excluding UCLA"; "yes, please update the
-- names to Toluca Lake and Hollywood Dome."

-- 1. The location names.
update listings set location_label = 'Toluca Lake', updated_at = now() where slug = 'next-level-veggie-grill-burbank-d55b' and location_label is distinct from 'Toluca Lake';
update listings set location_label = 'Hollywood Dome',
  description = replace(description, 'Hollywood DOME', 'Hollywood Dome'), updated_at = now()
  where slug = 'next-level-veggie-grill-los-angeles-9f8d' and location_label is distinct from 'Hollywood Dome';

-- 2. The Christmas menu at every location but UCLA: the same menu, summary, ordering link and policy as ThanksLiving. Pickup dates and
--    holiday hours are left empty (the ThanksLiving ones are Thanksgiving dates); Carrie is asked for Christmas pickup and hours.
insert into ve_holiday_menus (holiday_slug, listing_id, member_id, status, summary, items, order_url, order_by, pickup, price_range,
  holiday_hours, contact_note, team_note, reviewed_at, submitted_at)
select 'christmas', t.listing_id, t.member_id, 'live', t.summary, t.items, t.order_url, null, null, t.price_range, null, t.contact_note,
  'Copied from ThanksLiving 2026-11-13 by Logan (Carrie Davis: Christmas menus are the same). Pickup dates and Christmas hours waiting on Carrie.', now(), now()
from ve_holiday_menus t join listings l on l.id = t.listing_id
where t.holiday_slug = 'thanksliving' and t.member_id = 'bb861387-f0bd-475f-8e8b-fdbaa2aa4c76' and t.status = 'live' and l.slug <> 'veggie-grill'
  and not exists (select 1 from ve_holiday_menus c where c.listing_id = t.listing_id and c.holiday_slug = 'christmas');
