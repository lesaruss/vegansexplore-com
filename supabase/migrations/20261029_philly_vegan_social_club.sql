-- Philly Vegan Social Club (Sean, 2026-10-29, its Partiful: https://partiful.com/u/VrM8jI2gyGMs9BJWvXNi). The group search had held
-- "Philly Social Club" (a general club); Sean's link is the Philly Vegan Social Club, so that listing became it and went live.
-- Its 32 upcoming public Partiful events were read the same day from the database server (pg_net: the profile's __NEXT_DATA__,
-- then each partiful.com/e/<id> page for its description and neighborhood; Partiful shows the address only after an RSVP) and saved
-- through ve_event_intake, approved, hosted by the group, each linking to its own Partiful page. Run once from execute_sql; the
-- listing part is below so it can be re-run.
update listings set name = 'Philly Vegan Social Club', slug = 'philly-vegan-social-club', status = 'approved', instagram = 'phillyvegansocialclub',
  ig_handle = 'phillyvegansocialclub', website = 'https://partiful.com/u/VrM8jI2gyGMs9BJWvXNi', initials = 'PH', updated_at = now(),
  description = 'A Philadelphia Vegan social club started in January 2026. It fills local Vegan spots with group dinners and brunches, and hosts game nights, potlucks, fundraisers for animals and trips like a sanctuary day.',
  details = (details - 'review') || jsonb_build_object('group', jsonb_build_object('partiful', 'https://partiful.com/u/VrM8jI2gyGMs9BJWvXNi',
    'discord', 'https://discord.gg/bwnyzrzmZ8', 'events_url', 'https://partiful.com/u/VrM8jI2gyGMs9BJWvXNi', 'vegan_only', true))
where slug = 'philly-social-club';
update ve_event_sources set name = 'Philly Vegan Social Club (group)', kind = 'list', url = 'https://partiful.com/u/VrM8jI2gyGMs9BJWvXNi', active = true
where listing_id = (select id from listings where slug = 'philly-vegan-social-club');
