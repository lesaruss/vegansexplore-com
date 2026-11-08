-- ve-pre-vegan-guide: step 2, the Pre-Vegan survey and the Guide's row (canon canon-ve-pre-vegan-guide v1).
-- The survey is Explorer's nine questions plus five Pre-Vegan questions, one flow, 250 points, and finishing it makes
-- them a member (admits). Shared keys (journey, chapter, runs) carry answers over from Explorer and the other intakes,
-- so an Explorer member sees only what is new. Points re-weighted to keep 250 (Logan's defaults, Sean's to change):
-- required stay few and small (journey 15, chapter 15, runs 10, starting point 15), open answers worth the most.
-- The Guide is a door Guide (ve-guide-unlock opens it on finishing this survey). Its members-only text (Days 2 to 7 in
-- full) is ve_guides.content_html, written from the session, never in this repo.

insert into ve_surveys (slug, guide_slug, title, intro, admits, active, reviewed)
values ('pre-vegan', 'pre-vegan-guide', 'The Pre-Vegan survey',
        'A few questions about you and where you are starting from. It is free, every answer is saved as you go, and finishing it makes you a member and opens the Pre-Vegan Guide.',
        true, true, false)
on conflict (slug) do update set guide_slug = excluded.guide_slug, title = excluded.title, intro = excluded.intro, admits = true;

-- Explorer's questions, same ids and wording, re-weighted.
insert into ve_survey_questions (survey_slug, id, pos, kind, prompt, help, options, points, required, shared_key, show_if)
select 'pre-vegan', q.id,
       case q.id when 'x_journey' then 1 when 'x_chapter' then 2 when 'x_brings' then 3 when 'x_run' then 20 else q.pos + 10 end,
       q.kind, q.prompt, q.help, q.options,
       case q.id when 'x_journey' then 15 when 'x_chapter' then 15 when 'x_run' then 10 when 'x_brings' then 20 when 'x_more' then 20
                 when 'x_hear' then 10 when 'x_worth' then 25 when 'x_tough' then 25 when 'x_add' then 25 else q.points end,
       q.required, q.shared_key, q.show_if
from ve_survey_questions q where q.survey_slug = 'explorer'
on conflict (survey_slug, id) do update set pos = excluded.pos, points = excluded.points, prompt = excluded.prompt,
  options = excluded.options, required = excluded.required, shared_key = excluded.shared_key;

-- The five Pre-Vegan questions (they come right after journey, chapter and what brings you).
insert into ve_survey_questions (survey_slug, id, pos, kind, prompt, help, options, points, required) values
  ('pre-vegan','pv_start',4,'choice','Where are you starting from?','There is no wrong answer. It helps Maya start you in the right place.',
   '[{"v":"meat_daily","label":"I eat meat most days"},{"v":"meat_some","label":"I eat meat sometimes"},{"v":"pescatarian","label":"Fish, but no other meat"},{"v":"vegetarian","label":"Vegetarian already"},{"v":"mostly_vegan","label":"Mostly Vegan, with a few slips"}]'::jsonb,15,true),
  ('pre-vegan','pv_hardest',5,'multi','What do you think will be hardest?','Pick any.',
   '[{"v":"cheese","label":"Cheese and dairy"},{"v":"eating_out","label":"Eating out"},{"v":"family","label":"Family and friends"},{"v":"cooking","label":"Knowing what to cook"},{"v":"labels","label":"Knowing what is in things"},{"v":"cost","label":"Cost"},{"v":"cravings","label":"Cravings"},{"v":"protein","label":"Getting enough protein"}]'::jsonb,15,false),
  ('pre-vegan','pv_home',6,'choice','Who do you eat with at home?',null,
   '[{"v":"alone","label":"Just me"},{"v":"vegan_house","label":"People who eat Vegan too"},{"v":"partner","label":"A partner who does not"},{"v":"family","label":"Family or kids who do not"},{"v":"roommates","label":"Roommates"}]'::jsonb,15,false),
  ('pre-vegan','pv_cook',7,'choice','How often do you cook?',null,
   '[{"v":"most_days","label":"Most days"},{"v":"few_week","label":"A few times a week"},{"v":"rarely","label":"Rarely"},{"v":"never","label":"I would like to learn"}]'::jsonb,15,false),
  ('pre-vegan','pv_help',8,'multi','What would help you most?','Pick any.',
   '[{"v":"daily_steps","label":"One small step a day"},{"v":"recipes","label":"Easy recipes"},{"v":"places","label":"Places to eat near me"},{"v":"swaps","label":"What to buy instead"},{"v":"people","label":"People who have done it"},{"v":"ask","label":"Someone to ask"}]'::jsonb,25,false)
on conflict (survey_slug, id) do update set pos = excluded.pos, kind = excluded.kind, prompt = excluded.prompt, help = excluded.help,
  options = excluded.options, points = excluded.points, required = excluded.required;

-- The Guide: free with its survey (a door Guide). Published so ve-guide-unlock answers it; the page stays noindex and
-- out of the catalog and sitemap until Sean launches it.
insert into ve_guides (slug, title, description, cover_url, cost_lesars, published, access_rule, door, survey_slug, sort_order)
values ('pre-vegan-guide', 'The Pre-Vegan Guide',
        'For people ready to go Vegan who do not know where to start. Free with a short survey, with Maya, and inside it the members-only 111 Days to Going and Staying Vegan.',
        '/public/guides/prevegan.jpg', 1100, true, 'points', true, 'pre-vegan', 11)
on conflict (slug) do update set door = true, survey_slug = 'pre-vegan', published = true, title = excluded.title, description = excluded.description;
