-- ve-community-directory: Sean, 2026-11-08, declined Rachel Black's pending People listing
-- (no public presence; an employee of The Humane League at the time, not a personality on her own).
-- Applied through the connector. Removed, never deleted; Directory review's Removed list can put it back.
select ve_listing_set_state('855dc138-edd3-4c8f-ba28-4f45d56029c1', 'removed',
  (select id from members where is_superadmin and email ilike 'srussell@lesaruss.com' limit 1),
  'Sean, 2026-11-08: not adding Rachel Black. No public presence found; she worked at The Humane League at the time and is not a personality on her own.',
  array['Sean declined']);
