-- ve-explorer-path: step 1 of canon-ve-door-guides v7 (explorer_path_v7, locked by Sean 2026-11-06).
-- The Explorer survey re-weighted: 250 for answering everything; required questions are few and worth less (50),
-- optional and open ones worth more (200). "Do you run any of these?" gains "I organize a group or community" and
-- "Another kind of business", kept before "None of these". The order puts the open questions after the quick ones.
-- These rows were already live on 2026-11-06 (applied without a file); this records them. No one had answered the
-- survey yet, so nobody was paid under the old weights. Safe to run twice.
-- Left for later steps: the intro still says a person reads every one (step 3 makes admission straight in).

update public.ve_survey_questions q set pos = v.pos, points = v.points, required = v.required
from (values
  ('x_brings',  1, 30, false),
  ('x_journey', 2, 15, true),
  ('x_chapter', 3, 15, true),
  ('x_more',    4, 35, false),
  ('x_hear',    5, 15, false),
  ('x_worth',   6, 75, false),
  ('x_add',     7, 45, false),
  ('x_run',     8, 20, true)
) as v(id, pos, points, required)
where q.survey_slug = 'explorer' and q.id = v.id;

update public.ve_survey_questions set options =
  '[{"v":"restaurant","label":"A restaurant or food business"},{"v":"events","label":"Events"},{"v":"nonprofit","label":"A nonprofit, rescue or sanctuary"},{"v":"creator","label":"I make content"},{"v":"group","label":"I organize a group or community"},{"v":"business","label":"Another kind of business"},{"v":"none","label":"None of these"}]'::jsonb
where survey_slug = 'explorer' and id = 'x_run';

-- Check: 250 in all, 50 of it required.
-- select sum(points), sum(points) filter (where required) from ve_survey_questions where survey_slug = 'explorer';
