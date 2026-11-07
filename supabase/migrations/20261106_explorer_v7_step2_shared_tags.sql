-- ve-explorer-path: v7 step 2 (canon-ve-door-guides v7/v10; Sean approved 2026-11-06). Explorer's questions about the person become shared
-- questions, so any path intake that asks them carries Explorer's answer instead of asking again. chapter was already shared.
-- The bank rows copy Explorer's wording and choices exactly (the shared-key trigger copies the bank's wording onto tagged questions).
-- Nobody had answered the explorer survey when this ran. Safe to run twice.
insert into public.ve_shared_questions (key, kind, prompt, help, options)
select 'journey', q.kind, q.prompt, q.help, q.options from public.ve_survey_questions q where q.survey_slug = 'explorer' and q.id = 'x_journey'
on conflict (key) do nothing;
insert into public.ve_shared_questions (key, kind, prompt, help, options)
select 'runs', q.kind, q.prompt, q.help, q.options from public.ve_survey_questions q where q.survey_slug = 'explorer' and q.id = 'x_run'
on conflict (key) do nothing;
update public.ve_survey_questions set shared_key = 'journey' where survey_slug = 'explorer' and id = 'x_journey';
update public.ve_survey_questions set shared_key = 'runs' where survey_slug = 'explorer' and id = 'x_run';
