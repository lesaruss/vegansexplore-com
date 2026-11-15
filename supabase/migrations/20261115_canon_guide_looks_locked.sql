-- Theo and Maya keep their original skin tones (Sean, 2026-11-15: "their skin tone needs to match what it was before. You can keep the same
-- style and look, but the skin tone needs to match"). The fix had been written that morning on an unmerged branch (claude/sweet-ritchie-oiq411),
-- so the Nutrition Guide chat drew 76 Theo pictures from the retired theo-v2 the same day. Canon now holds the lock, branch-independent.
-- Applied 2026-11-15 through the connector (canon-ve-guide-roster v3). Safe to run twice.
update knowledge_records set
 body = body::jsonb || jsonb_build_object('looks_locked_v1', jsonb_build_object(
   'rule', 'Every Guide keeps the skin tone of its ORIGINAL look, the one already on the Guides built with them, in every new picture, shape and style (Sean, 2026-11-15: "their skin tone needs to match what it was before. You can keep the same style and look, but the skin tone needs to match, or else it''s not going to match up with the dairy guide... the pre-vegan guide... the holiday guide... the nutrition guide").',
   'theo', 'Warm light brown skin, short gray hair, trimmed gray beard, round glasses: the Holiday Guide scenes. First reference: Higgsfield ddc4b75d-6f3c-4f4d-93d2-27365c01d10b (the original). Roster square theo-v3.jpg. Retired, too dark: theo-v1.jpg, theo-v2.jpg.',
   'maya', 'Warm light brown skin, big free curls, no headband: public/guides/maya.jpg, the Dairy and Pre-Vegan Business Guides. First reference: Higgsfield 75c28848-a667-41d1-858a-1c1dc6032b6a. Roster square maya-v4.jpg. Retired, too dark: maya-v1.jpg to maya-v3.jpg.',
   'gate', 'Before any picture of a Guide ships, put it beside that Guide''s original and compare the skin. Darker or lighter is a redraw. Never use a retired roster square as a reference.',
   'why', '2026-11-15: the fix was written in the ve-social-schedule chat on branch claude/sweet-ritchie-oiq411, never merged, so the Nutrition Guide chat drew 76 Theo pictures from theo-v2 (too dark) the same day. A look lock goes here in canon the moment it is made, not only on a branch.')),
 updated_by = 'logan', updated_at = now()
where slug = 'canon-ve-guide-roster' and not (body::jsonb ? 'looks_locked_v1');
