-- ve-community-directory L (Sean, 2026-11-08: "L as recommended"): both Removed (reversible from Directory review > Removed).
select ve_listing_set_state(id, 'removed', (select id from members where is_superadmin and email ilike 'contact@lesaruss.com' limit 1),
  case slug when 'pacific-point-preserve' then 'Removed (L, Sean 2026-11-08): SeaWorld Orlando''s sea lion and seal exhibit, not a nonprofit; a captive marine exhibit does not belong in Community.'
  else 'Removed (L, Sean 2026-11-08): no website, socials, reviews or events; nothing shows an active rescue. Put back if it turns out to be one.' end,
  array['Not an animal organization we list'])
from listings where slug in ('pacific-point-preserve','humane-association-of-ga-inc') and status = 'approved';
