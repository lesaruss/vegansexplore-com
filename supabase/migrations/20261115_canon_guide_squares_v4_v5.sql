-- Theo and Maya avatars redrawn darker to match their originals (Sean, 2026-11-15: "Theo's profile avatar... is too light... same thing with Maya").
-- Applied through the connector (canon-ve-guide-roster). Safe to run twice.
update knowledge_records set body = jsonb_set(jsonb_set(body::jsonb,
  '{looks_locked_v1,theo}', to_jsonb('Medium brown skin with the depth of the Holiday Guide scenes, short gray hair, trimmed gray beard, round glasses. First reference: Higgsfield ddc4b75d-6f3c-4f4d-93d2-27365c01d10b (the original), used ALONE for the face (a current square as a second reference pulls the skin toward it). Roster square theo-v4.jpg (2026-11-15). Retired: theo-v1, theo-v2 (too dark), theo-v3 (too light, Sean 2026-11-15).'::text)),
  '{looks_locked_v1,maya}', to_jsonb('Warm brown skin with the depth of public/guides/maya.jpg (the Dairy and Pre-Vegan Business Guides), big free curls, no headband. First reference: Higgsfield 75c28848-a667-41d1-858a-1c1dc6032b6a, used alone for the face. Roster square maya-v5.jpg (2026-11-15). Retired: maya-v1 to v3 (too dark), maya-v4 (too light, Sean 2026-11-15).'::text)),
  updated_by = 'logan', updated_at = now()
where slug = 'canon-ve-guide-roster' and body::jsonb #>> '{looks_locked_v1,theo}' not like '%theo-v4%';
