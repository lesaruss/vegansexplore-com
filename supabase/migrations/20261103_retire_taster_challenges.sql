-- ve-pathways (Sean, 2026-11-03: "Go retire the Taster and challenges"): the Welcome at /passport replaces the Taste and the
-- three challenges as the free path; the survey door is the free way in. Nothing deleted: ve_tasters, ve_challenges and their
-- history stay. On 2026-11-03 there was one Taster (a test row) and no challenge, so nobody is mid-sequence.
update ve_site_settings set value = jsonb_set(value, '{tasters_on}', 'false'::jsonb) where key = 'nurture';
