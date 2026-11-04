-- Applied 2026-11-03 through the connector (apply_migration door_guides_canon_v3_one_membership), written to the repo at wrap-up 2026-11-04.
-- Sean's correction: the survey door is the same membership as the $11 Passport; only the points and a few perks differ.
update public.knowledge_records
set version = 3, updated_by = 'logan', updated_at = now(),
    change_summary = 'v3 (Sean correction 2026-11-03): the survey door is a full membership, the same as the $11 Passport. Same access to everything a member can do (record clips, claim, sponsorship, saving). The only differences are the points (1,100 for the $11, the survey''s own points for the survey) and a few perks the $11 has.',
    body = (body - 'v2_levels') || jsonb_build_object(
      'v3_levels', jsonb_build_array(
        'Open, no account: the Overview and the one free example (public, indexed).',
        'A member, by either door: the survey (free) or the $11 Passport. Both open the whole door Guide and everything a member can do, including recording clips for the podcast, claiming, applying for sponsorship and saving across devices.'),
      'v3_membership', 'One membership, two doors. The survey door and the $11 Passport give the same access. The differences are only the points (1,100 with the $11; the survey pays its own points) and a few perks the $11 has. Founding Member applies to both before 2027-01-01.',
      'v3_code_note', 've-events-guide mayRecord already lets any active non-agent member record. The error and button wording that says Passport members is to be changed to members.')
where slug = 'canon-ve-door-guides' and version = 2;
