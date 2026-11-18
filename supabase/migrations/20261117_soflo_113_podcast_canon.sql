-- SoFlo Vegans 113 (2026-11-17, playbooks ve-city-shows and ve-podcast-studio): the canon changes Logan applied through the connector.
-- Each update merges keys into the canon body, so running it twice changes nothing. Episode content (ve_pod_segments, ve_pod_episodes)
-- was edited as studio data, like every episode, and is not repeated here.

update knowledge_records set body = body || jsonb_build_object('podcast_guides_ai_v1', jsonb_build_object(
  'date','2026-11-17','scope','The podcasts (SoFlo Vegans and every show made in BrandDesk > Podcast)',
  'rule','On the podcasts the Guides are voiced with their AI voices (el-media tts, the Guide''s profile voice), checked word for word with stt and leveled to -16 LUFS. Sean records only his own parts. Do not ask him to record Guide lines for a podcast.',
  'sean_words','You can still use AI for the other voices. I don''t want to do those voices. I''ll just do my own voice in this.'))
where slug = 'canon-guide-voices-sean-performs' and not (body ? 'podcast_guides_ai_v1');

update knowledge_records set body = body || jsonb_build_object(
  'claimed_listings_first_v1', jsonb_build_object('date','2026-11-17',
    'rule','In every podcast''s Directory segment (and any spotlight of new places), businesses that claimed their listing come first. A business that is not Vegan is described with plant-based options, never Vegan options.',
    'sean_words','We should be definitely spotlighting people who''ve claimed listings. They take priority.'),
  'pronunciation_dania_v1', jsonb_build_object('date','2026-11-17','rule','Dania Beach is said Day-nee-uh, never Dinah. HQ spoken() respells it.'),
  'bed_length_v1', jsonb_build_object('date','2026-11-17','rule','A segment''s song must be at least as long as the segment; directory-v1 and v2 are 52 s. Use directory-v3 (300 s) or a 100 s story bed.'),
  'pronunciation_aguacate_v1', jsonb_build_object('date','2026-11-17','rule','Aguacate is voiced from the respelling "Agua-cah-teh", the sample Sean picked. For a new hard name, send Sean short samples first.'),
  'pronunciation_code_live', jsonb_build_object('date','2026-11-17','note','Dania and Aguacate in HQ spoken() are on HQ main f6f3517, production READY.'))
where slug = 'canon-podcast-mix-standard';
