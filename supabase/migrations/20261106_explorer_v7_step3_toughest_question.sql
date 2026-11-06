-- ve-explorer-path: v7 step 3, the rest (canon-ve-door-guides v10 explorer_badges_v10; wording approved by Sean 2026-11-06).
-- Adds the optional "toughest thing" question (35 points) after the worth-it question, which drops from 75 to 40, so Explorer still
-- totals 250. "Do you run any of these?" stays last (required; finishing the required questions admits). Intro says nine questions.
-- Nobody had answered the explorer survey when this ran. Safe to run twice.
update public.ve_survey_questions set points = 40 where survey_slug = 'explorer' and id = 'x_worth';
insert into public.ve_survey_questions (survey_slug, id, pos, kind, prompt, help, options, points, required)
values ('explorer', 'x_tough', 7, 'long', 'What is one of the toughest things you are dealing with on your Vegan journey?', null, null, 35, false)
on conflict do nothing;
update public.ve_survey_questions q set pos = v.p + 100
from (values ('x_brings',1),('x_journey',2),('x_chapter',3),('x_more',4),('x_hear',5),('x_worth',6),('x_tough',7),('x_add',8),('x_run',9)) as v(id,p)
where q.survey_slug = 'explorer' and q.id = v.id;
update public.ve_survey_questions set pos = pos - 100 where survey_slug = 'explorer' and pos > 100;
update public.ve_surveys
set intro = 'Nine quick questions about you and where you live, about two minutes. Finish it and you are a member, with up to 250 points.'
where slug = 'explorer';
