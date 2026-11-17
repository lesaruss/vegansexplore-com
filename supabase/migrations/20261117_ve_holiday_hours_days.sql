-- Holiday hours by day (Sean, 2026-11-17: "It's all mushed together... Can't we set it up just like the other one?"): each answer keeps
-- its days ([{date, hours}]) so the listing page shows them like the weekly hours, behind a Regular hours / Holiday hours toggle.
-- `hours` stays as the same days in one line (for the dashboard row and anything that reads text). Safe to run twice.
alter table public.ve_holiday_hours add column if not exists days jsonb;
update public.ve_holiday_hours h set days = x.days::jsonb, hours = x.hours, updated_at = now()
from listings l, (values
  ('sen-saigon', '[{"date":"2026-11-25","hours":"5 to 8:30 PM"},{"date":"2026-11-26","hours":"Closed"}]', 'Wed, Nov 25: 5 to 8:30 PM. Thu, Nov 26: Closed.'),
  ('vegan-international-co', '[{"date":"2026-11-25","hours":"Closed"},{"date":"2026-11-26","hours":"Closed"},{"date":"2026-11-27","hours":"Closed"},{"date":"2026-11-28","hours":"Closed"}]', 'Wed, Nov 25: Closed. Thu, Nov 26: Closed. Fri, Nov 27: Closed. Sat, Nov 28: Closed.')
) x(slug, days, hours)
where l.slug = x.slug and l.status = 'approved' and h.listing_id = l.id and h.holiday_slug = 'thanksliving' and h.set_by_team;
