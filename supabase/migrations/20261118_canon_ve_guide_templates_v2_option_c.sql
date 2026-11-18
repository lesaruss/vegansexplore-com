-- Sean, 2026-11-18: "I love C... The real thing first, that's the winner for me." canon-ve-guide-templates v2.
update knowledge_records set version = 2, updated_at = now(), updated_by = 'logan',
  change_summary = 'v2: Sean picked design panel option C (Real things first) as the look of the shared frame, 2026-11-18',
  body = body || jsonb_build_object('v2_option_c', jsonb_build_object(
    'quote', 'I love C. I had a chance to play around with it. The real thing first, that''s the winner for me.',
    'decided', '2026-11-18', 'reference', '/mocks/guide-panel2/c/',
    'rule', 'The shared frame takes option C: a slim pink Guide bar with who the Guide is for and every part as a visible tab row (sliding on phones; small lock on paid parts; replaces the Contents dropdown), the title, one short line, ONE orange action with one plain price line beside it, then the real content as the hero. The Guide is a small card (square picture, one short line, Play) beside the title on desktop and above the action on phones, never repeating the paragraph. No how-to boxes. Locked items say Full Guide, never Locked. Finder and Handbook remain the two bodies.'))
where slug = 'canon-ve-guide-templates' and version < 2;
