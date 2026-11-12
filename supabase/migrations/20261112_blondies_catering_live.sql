-- 2026-11-12 (Sean, approving holiday menus: "Blondie's... it says we don't have a listing... they are caterers, so we should have
-- them listed under that section"). The listing existed (added 2026-11-10 with the menu draft) but was never approved, so the Depot's
-- slug check (approved listings only) said "No listing with that slug". Approved with Catering as its section, Bakeries & Cafes kept
-- as a second, their Instagram from the older rejected duplicate; the menu tip linked and shown. Safe to run twice.
update listings set status = 'approved', category = 'Catering',
  extra_categories = (select array(select distinct unnest(coalesce(extra_categories, '{}') || array['Bakeries & Cafes']))),
  instagram = coalesce(nullif(instagram, ''), 'blondiesveganbakery'), listed_at = coalesce(listed_at, now()), updated_at = now()
where id = '827d1834-3fec-41e6-8935-99f0b0b2064d';

update ve_holiday_menu_tips set listing_id = '827d1834-3fec-41e6-8935-99f0b0b2064d', status = 'live',
  reviewed_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da', reviewed_at = coalesce(reviewed_at, now()), updated_at = now()
where place_name = 'Blondies Vegan Bakery & Cafe' and holiday_slug = 'thanksliving' and status = 'pending';
