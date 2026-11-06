-- ve-outreach: the organizations door (canon-ve-door-guides v8 organizations_door_v8; Sean, 2026-11-06).
-- Visitor bureaus, chambers of commerce, cities and tourism boards do not take Explorer. They see a high-level preview
-- (/partners/organizations, no prices), make a free account through this short questionnaire, then our team calls and
-- writes a custom proposal. Finishing it admits the account like any Guide survey (no Guide, so guide_slug is null).
-- 9 questions, 250 points (required few and worth less; optional and open ones more, canon v7). The Inbox shows each
-- finished questionnaire as "Organization questionnaire" so it is answered within the 24-hour clock.

insert into public.ve_surveys (slug, guide_slug, title, intro, admits, active, reviewed)
values ('organizations', null, 'For organizations',
  'A few quick questions about your organization, about three minutes. Then our team reaches out to set up a short call and put together a proposal made for you.',
  true, true, false)
on conflict (slug) do update set title = excluded.title, intro = excluded.intro, admits = true, active = true, reviewed = false;

insert into public.ve_survey_questions (survey_slug, id, pos, kind, prompt, help, options, points, required, shared_key) values
  ('organizations', 'o_name', 1, 'text', 'Your organization''s name', null, null, 15, true, 'org_name'),
  ('organizations', 'o_you', 2, 'text', 'Your name and your role there', null, null, 15, true, null),
  ('organizations', 'o_kind', 3, 'choice', 'What kind of organization is it?', null, '[{"v": "bureau", "label": "Visitor or convention bureau"}, {"v": "chamber", "label": "Chamber of commerce"}, {"v": "city", "label": "City, county or town"}, {"v": "tourism", "label": "Tourism board"}, {"v": "association", "label": "Business association or district"}, {"v": "other", "label": "Something else"}]'::jsonb, 15, true, null),
  ('organizations', 'o_chapter', 4, 'choice', 'Where is it?', null, '[{"v": "south-florida", "label": "South Florida"}, {"v": "central-florida", "label": "Central Florida"}, {"v": "north-florida", "label": "North Florida"}, {"v": "atlanta", "label": "Atlanta"}, {"v": "washington-dc", "label": "Washington, D.C."}, {"v": "maryland", "label": "Maryland"}, {"v": "virginia", "label": "Virginia"}, {"v": "delaware", "label": "Delaware"}, {"v": "west-virginia", "label": "West Virginia"}, {"v": "philadelphia", "label": "Philadelphia"}, {"v": "new-york", "label": "New York"}, {"v": "los-angeles", "label": "Los Angeles"}, {"v": "london", "label": "London"}, {"v": "other", "label": "Somewhere else"}]'::jsonb, 15, true, 'chapter'),
  ('organizations', 'o_goals', 5, 'multi', 'What would you like to do with Vegans Explore?', 'Pick all that fit.', '[{"v": "visitors", "label": "Bring Vegan travelers to our area"}, {"v": "business", "label": "Help local businesses reach Vegan customers"}, {"v": "events", "label": "Promote events and festivals"}, {"v": "welcome", "label": "Show our area welcomes Vegans"}, {"v": "partner", "label": "A partnership or sponsorship"}, {"v": "other", "label": "Something else"}]'::jsonb, 30, true, null),
  ('organizations', 'o_call', 6, 'text', 'The best way and time to reach you for a short call', 'A phone or email, and the days and times that work.', null, 20, true, null),
  ('organizations', 'o_when', 7, 'choice', 'When would you want to start?', null, '[{"v": "now", "label": "This season"}, {"v": "q1", "label": "January to March 2027"}, {"v": "later", "label": "Later in 2027"}, {"v": "exploring", "label": "Just looking for now"}]'::jsonb, 35, false, null),
  ('organizations', 'o_link', 8, 'text', 'Your website', null, null, 30, false, 'org_link'),
  ('organizations', 'o_more', 9, 'long', 'Anything else you would like us to know?', null, null, 75, false, null)
on conflict (survey_slug, id) do update set pos = excluded.pos, kind = excluded.kind, prompt = excluded.prompt, help = excluded.help,
  options = excluded.options, points = excluded.points, required = excluded.required, shared_key = excluded.shared_key;

-- The Inbox: a finished organizations questionnaire is a request a person sent (source org_survey, one per account).
-- Added to ve_inbox_items by rewriting its last line, so the function's other branches stay exactly as they are. Safe to run twice.
do $mig$
declare d text;
begin
  d := pg_get_functiondef('public.ve_inbox_items'::regproc);
  if position('org_survey' in d) = 0 then
    d := replace(d, E'  order by 3 desc;', E'  union all\n'
      || E'  select ''org_survey'', c.member_id, c.completed_at, ''Organization questionnaire'',\n'
      || E'    coalesce(nullif(trim(both ''"'' from (select a.value::text from ve_survey_answers a where a.member_id = c.member_id and a.survey_slug = ''organizations'' and a.question_id = ''o_name'')), ''''), m.name),\n'
      || E'    left(concat_ws('' · '', nullif(trim(both ''"'' from (select a.value::text from ve_survey_answers a where a.member_id = c.member_id and a.survey_slug = ''organizations'' and a.question_id = ''o_you'')), ''''),\n'
      || E'      ''Call: '' || nullif(trim(both ''"'' from (select a.value::text from ve_survey_answers a where a.member_id = c.member_id and a.survey_slug = ''organizations'' and a.question_id = ''o_call'')), '''')), 200),\n'
      || E'    c.member_id, m.name, m.email, nullif(trim(both ''"'' from (select a.value::text from ve_survey_answers a where a.member_id = c.member_id and a.survey_slug = ''organizations'' and a.question_id = ''o_chapter'')), ''''),\n'
      || E'    ''/admin/depot/people#person/'' || lower(m.email)\n'
      || E'  from ve_survey_completions c join members m on m.id = c.member_id\n'
      || E'  where c.survey_slug = ''organizations'' and c.completed_at >= p_since and coalesce(m.name, '''') not like ''[TEST]%''\n'
      || E'  order by 3 desc;');
    execute d;
  end if;
end $mig$;
