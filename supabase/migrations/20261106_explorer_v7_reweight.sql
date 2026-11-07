-- ve-outreach: Explorer v7, step 1 (canon-ve-door-guides v7 explorer_path_v7; locked by Sean 2026-11-06; playbook record 68786362).
-- Re-weight the explorer survey: few required questions worth less, optional and open ones worth more. Still 250 in all.
--   Required: x_chapter 15, x_journey 15, x_run 20.
--   Optional: x_brings 30, x_more 35, x_hear 15, x_add 45, x_worth 75.
-- Add two x_run options before "None of these": "I organize a group or community" (group), "Another kind of business" (business).
-- Nobody had answered the explorer survey when this ran (0 answers, 0 completions), so no held or paid points change.
-- Not here: ve_surveys.reviewed stays on until v7 step 3; the Explorer badge is step 6. Safe to run twice.

update public.ve_survey_questions q set points = v.pts, required = v.req
from (values
  ('x_chapter', 15, true), ('x_journey', 15, true), ('x_run', 20, true),
  ('x_brings', 30, false), ('x_more', 35, false), ('x_hear', 15, false), ('x_add', 45, false), ('x_worth', 75, false)
) as v(id, pts, req)
where q.survey_slug = 'explorer' and q.id = v.id;

update public.ve_survey_questions
set options = '[{"v":"restaurant","label":"A restaurant or food business"},{"v":"events","label":"Events"},{"v":"nonprofit","label":"A nonprofit, rescue or sanctuary"},{"v":"creator","label":"I make content"},{"v":"group","label":"I organize a group or community"},{"v":"business","label":"Another kind of business"},{"v":"none","label":"None of these"}]'::jsonb
where survey_slug = 'explorer' and id = 'x_run';

-- "Do you run any of these?" moves to last. While reviewed is on, the answer that completes the required questions puts the account
-- in review and later answers are refused (under_review); with x_run at 6, x_worth (75) and x_add (45) could never be answered.
-- Proven in a rolled-back transaction on an unpaid account: answers 1 to 7 accepted, review on 8, nothing paid while held.
update public.ve_survey_questions q set pos = v.p + 100
from (values ('x_brings',1),('x_journey',2),('x_chapter',3),('x_more',4),('x_hear',5),('x_worth',6),('x_add',7),('x_run',8)) as v(id,p)
where q.survey_slug = 'explorer' and q.id = v.id;
update public.ve_survey_questions set pos = pos - 100 where survey_slug = 'explorer' and pos > 100;
