-- canon-ve-world-vegan-expo (created 2026-11-21 by Logan from Sean's locks this session): the North Star (January 20 to 24, 2028, every two
-- years), the count-in offer (first access plus the Founding badge, no fee, no deposit), the host city rule (the race is the community part of
-- every bid; a city's offer weighs in; the 80% gate retired as the deciding rule), the committees (nine, volunteer, Chairs, monthly Zoom, two
-- misses then a check-in, a third off, All Access Pass in good standing, paid jobs posted inside first, members only for now), outreach last,
-- and narration on every view recorded by Sean. Applied live through the connector; the full body is in the row. This file records it.
insert into knowledge_records (slug, title, category, subcategory, body, status, owner, tags, version, change_summary, created_by, updated_by)
select 'canon-ve-world-vegan-expo', 'The World Vegan Expo: the North Star (locks to date)', 'decisions', 'product',
  '{"see":"the live row; created 2026-11-21"}'::jsonb, 'active', 'sar',
  array['vegans-explore','world-vegan-expo','expo-2028','committees','canon'], 1,
  'Created 2026-11-21: the North Star, the count-in offer, the host city rule, the committees.', 'logan', 'logan'
where not exists (select 1 from knowledge_records where slug = 'canon-ve-world-vegan-expo');
