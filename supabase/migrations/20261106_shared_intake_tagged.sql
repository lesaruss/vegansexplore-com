-- ve-events-guide: step 3 of the membership rule, the shared questions tagged (Sean approved the wording 2026-11-06,
-- docs/proposals/membership-rule-wording-steps-3-9.md). Four shared questions; Events and Restaurant ask all four, Creator asks chapter.
-- Question ids stay where they were (e_chapter, e_vegan, e_group) so Depot > Event sponsors' Compare keeps reading them; vegan_level keeps
-- the stored values all | mostly | friendly | notyet. "Plant-based options", never "Vegan options", for a place that is not Vegan
-- (canon-ve-pre-vegan-meaning). Every intake still totals 250. Nobody had finished any of these intakes, so no answer changes meaning.
-- Safe to run twice.

insert into public.ve_shared_questions (key, kind, prompt, help, options) values
 ('chapter', 'choice', 'Which Vegans Explore chapter are you in, or closest to?', null,
  '[{"v":"south-florida","label":"South Florida"},{"v":"central-florida","label":"Central Florida"},{"v":"north-florida","label":"North Florida"},{"v":"atlanta","label":"Atlanta"},{"v":"washington-dc","label":"Washington, D.C."},{"v":"maryland","label":"Maryland"},{"v":"virginia","label":"Virginia"},{"v":"delaware","label":"Delaware"},{"v":"west-virginia","label":"West Virginia"},{"v":"philadelphia","label":"Philadelphia"},{"v":"new-york","label":"New York"},{"v":"los-angeles","label":"Los Angeles"},{"v":"london","label":"London"},{"v":"other","label":"Somewhere else"}]'::jsonb),
 ('org_name', 'text', 'What is the name of your business, group or organization?', null, null),
 ('org_link', 'text', 'Your website or Instagram', null, null),
 ('vegan_level', 'choice', 'How Vegan is what you run?', null,
  '[{"v":"all","label":"Everything is Vegan"},{"v":"mostly","label":"Mostly Vegan"},{"v":"friendly","label":"Plant-based options alongside other food"},{"v":"notyet","label":"I am planning to make it more Vegan"}]'::jsonb)
on conflict (key) do update set kind = excluded.kind, prompt = excluded.prompt, help = excluded.help, options = excluded.options;

-- Events: 13 questions, 250.
update public.ve_survey_questions set pos = pos + 1 where survey_slug = 'vegan-events-guide' and pos >= 7 and id <> 'e_link' and not exists (select 1 from public.ve_survey_questions where survey_slug = 'vegan-events-guide' and id = 'e_link');
insert into public.ve_survey_questions (survey_slug, id, pos, kind, prompt, points, required, shared_key)
 values ('vegan-events-guide', 'e_link', 7, 'text', 'Your website or Instagram', 10, false, 'org_link') on conflict do nothing;
update public.ve_survey_questions set shared_key = 'chapter' where survey_slug = 'vegan-events-guide' and id = 'e_chapter';
update public.ve_survey_questions set shared_key = 'org_name', points = 10 where survey_slug = 'vegan-events-guide' and id = 'e_group';
update public.ve_survey_questions set shared_key = 'vegan_level' where survey_slug = 'vegan-events-guide' and id = 'e_vegan';

-- Restaurant: chapter, name and link after the role; how Vegan takes the shared wording. 20 questions, 250.
update public.ve_survey_questions set pos = pos + 3 where survey_slug = 'vegan-restaurant-guide' and pos >= 2 and not exists (select 1 from public.ve_survey_questions where survey_slug = 'vegan-restaurant-guide' and id = 'r_chapter');
insert into public.ve_survey_questions (survey_slug, id, pos, kind, prompt, points, required, shared_key) values
 ('vegan-restaurant-guide', 'r_chapter', 2, 'choice', 'x', 15, true, 'chapter'),
 ('vegan-restaurant-guide', 'r_name', 3, 'text', 'x', 10, true, 'org_name'),
 ('vegan-restaurant-guide', 'r_link', 4, 'text', 'x', 10, false, 'org_link')
on conflict do nothing;
update public.ve_survey_questions set shared_key = 'vegan_level' where survey_slug = 'vegan-restaurant-guide' and id = 'r_vegan';
update public.ve_survey_questions q set points = v.p from (values ('r_role',20),('r_why',20),('r_support',20),('r_events',20),('r_proud',7),('r_recommend',8),('r_wish',5)) v(id,p)
 where q.survey_slug = 'vegan-restaurant-guide' and q.id = v.id;

-- Creator: chapter first. 17 questions, 250.
update public.ve_survey_questions set pos = pos + 1 where survey_slug = 'creator-guide' and not exists (select 1 from public.ve_survey_questions where survey_slug = 'creator-guide' and id = 'c_chapter');
insert into public.ve_survey_questions (survey_slug, id, pos, kind, prompt, points, required, shared_key)
 values ('creator-guide', 'c_chapter', 1, 'choice', 'x', 15, true, 'chapter') on conflict do nothing;
update public.ve_survey_questions q set points = v.p from (values ('c_city',15),('c_why',5),('c_heard',5)) v(id,p)
 where q.survey_slug = 'creator-guide' and q.id = v.id;

do $$ declare r record; begin
  for r in select survey_slug, sum(points) t from public.ve_survey_questions where survey_slug in ('vegan-events-guide','vegan-restaurant-guide','creator-guide') group by 1 loop
    if r.t <> 250 then raise exception '% totals %, not 250', r.survey_slug, r.t; end if;
  end loop;
end $$;
