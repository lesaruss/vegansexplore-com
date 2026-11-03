-- A survey per Guide (Sean, 2026-11-03: "everybody can get a free account, but they have to complete the survey that's tied to that guide").
-- Rows, not code: a door Guide adds a ve_surveys row and its ve_survey_questions. Finishing one admits an account waiting on its Passport
-- (the same door as the profile survey: survey_door_at, entry_via survey, Founding before the deadline). A member who paid can take it for the points.
create table if not exists ve_surveys (
  slug text primary key,
  guide_slug text,
  title text not null,
  intro text,
  admits boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists ve_survey_questions (
  survey_slug text not null references ve_surveys(slug) on delete cascade,
  id text not null,
  pos int not null,
  kind text not null check (kind in ('choice','multi','text','long')),
  prompt text not null,
  help text,
  options jsonb,               -- [{v,label}] for choice and multi
  points int not null default 0,
  required boolean not null default true,
  primary key (survey_slug, id)
);
create table if not exists ve_survey_answers (
  member_id uuid not null references members(id) on delete cascade,
  survey_slug text not null,
  question_id text not null,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (member_id, survey_slug, question_id)
);
create table if not exists ve_survey_completions (
  member_id uuid not null references members(id) on delete cascade,
  survey_slug text not null,
  completed_at timestamptz not null default now(),
  admitted boolean not null default false,
  primary key (member_id, survey_slug)
);
alter table ve_surveys enable row level security;
alter table ve_survey_questions enable row level security;
alter table ve_survey_answers enable row level security;
alter table ve_survey_completions enable row level security;
alter table ve_guides add column if not exists survey_slug text;

-- Public read of a survey's questions goes through ve_survey_get (service role); nothing is readable directly.
create or replace function ve_survey_get(p_survey text, p_member uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select case when s.slug is null then null else jsonb_build_object(
    'slug', s.slug, 'title', s.title, 'intro', s.intro, 'guide_slug', s.guide_slug, 'admits', s.admits,
    'questions', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'kind', q.kind, 'prompt', q.prompt, 'help', q.help,
        'options', q.options, 'points', q.points, 'required', q.required) order by q.pos) from ve_survey_questions q where q.survey_slug = s.slug), '[]'::jsonb),
    'total', coalesce((select sum(points) from ve_survey_questions q where q.survey_slug = s.slug), 0),
    'answers', coalesce((select jsonb_object_agg(a.question_id, a.value) from ve_survey_answers a where a.member_id = p_member and a.survey_slug = s.slug), '{}'::jsonb),
    'earned', coalesce((select sum(q.points) from ve_survey_answers a join ve_survey_questions q on q.survey_slug = a.survey_slug and q.id = a.question_id
                        where a.member_id = p_member and a.survey_slug = s.slug), 0),
    'completed', exists (select 1 from ve_survey_completions c where c.member_id = p_member and c.survey_slug = s.slug)) end
  from (select 1) x left join ve_surveys s on s.slug = p_survey and s.active;
$$;

create or replace function ve_survey_answer(p_member uuid, p_survey text, p_question text, p_value jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s ve_surveys; q ve_survey_questions; m record;
  v jsonb := p_value; v_empty boolean; v_text text; v_grant jsonb := null; v_admitted boolean := false; v_done boolean; v_missing int;
begin
  select * into s from ve_surveys where slug = p_survey and active;
  if not found then return jsonb_build_object('error', 'unknown_survey'); end if;
  select * into q from ve_survey_questions where survey_slug = p_survey and id = p_question;
  if not found then return jsonb_build_object('error', 'unknown_question'); end if;
  select id, membership_status, coalesce(membership_tier, '') tier, coalesce(member_class, 'member') cls, survey_door_at into m from members where id = p_member;
  if not found or m.tier = 'guest' or m.cls <> 'member' or m.membership_status not in ('active', 'pending_payment') then
    return jsonb_build_object('error', 'not_eligible');
  end if;
  -- An account waiting on its Passport starts the door by answering (only for a survey that admits).
  if m.membership_status = 'pending_payment' then
    if not s.admits then return jsonb_build_object('error', 'not_eligible'); end if;
    if m.survey_door_at is null then update members set survey_door_at = now() where id = p_member; end if;
  end if;

  v_empty := v is null or v = 'null'::jsonb or v = '""'::jsonb or v = '[]'::jsonb or (jsonb_typeof(v) = 'string' and btrim(v #>> '{}') = '');
  if not v_empty then
    if q.kind = 'choice' then
      if jsonb_typeof(v) <> 'string' or not exists (select 1 from jsonb_array_elements(q.options) o where o ->> 'v' = v #>> '{}') then return jsonb_build_object('error', 'bad_value'); end if;
    elsif q.kind = 'multi' then
      if jsonb_typeof(v) <> 'array' or exists (select 1 from jsonb_array_elements_text(v) x where not exists (select 1 from jsonb_array_elements(q.options) o where o ->> 'v' = x)) then
        return jsonb_build_object('error', 'bad_value'); end if;
    else
      if jsonb_typeof(v) <> 'string' then return jsonb_build_object('error', 'bad_value'); end if;
      v_text := left(btrim(v #>> '{}'), case q.kind when 'long' then 2000 else 200 end);
      v := to_jsonb(v_text);
    end if;
  end if;

  if v_empty then
    delete from ve_survey_answers where member_id = p_member and survey_slug = p_survey and question_id = p_question;
  else
    insert into ve_survey_answers (member_id, survey_slug, question_id, value) values (p_member, p_survey, p_question, v)
    on conflict (member_id, survey_slug, question_id) do update set value = excluded.value, updated_at = now();
    if q.points > 0 then v_grant := ve_points_grant(p_member, q.points, 'survey_answer', 'survey:' || p_survey || ':' || p_question); end if;
  end if;

  select count(*) into v_missing from ve_survey_questions sq
    where sq.survey_slug = p_survey and sq.required
      and not exists (select 1 from ve_survey_answers a where a.member_id = p_member and a.survey_slug = p_survey and a.question_id = sq.id);
  v_done := v_missing = 0;
  if v_done then
    insert into ve_survey_completions (member_id, survey_slug) values (p_member, p_survey) on conflict do nothing;
    if s.admits then
      v_admitted := ve_survey_door_admit(p_member);
      if v_admitted then update ve_survey_completions set admitted = true where member_id = p_member and survey_slug = p_survey; end if;
    end if;
  end if;
  return jsonb_build_object('ok', true, 'question', p_question, 'points', q.points,
    'paid_now', coalesce((v_grant ->> 'granted')::boolean, false), 'completed', v_done, 'admitted', v_admitted, 'missing', v_missing);
end $$;
revoke all on function ve_survey_get(text, uuid) from public, anon, authenticated;
revoke all on function ve_survey_answer(uuid, text, text, jsonb) from public, anon, authenticated;

-- The Events Guide's survey: about their events and their community. 100 points (Logan's default, Sean's to change), 12 questions.
insert into ve_surveys (slug, guide_slug, title, intro, admits) values
 ('vegan-events-guide', 'vegan-events-guide', 'The event survey',
  'Tell us about the events you run or want to run. It takes about ten minutes, it is free, and it earns 100 points. Finishing it opens the Vegan Events Guide and your Vegans Explore membership, and it is the first step of any sponsorship application.', true)
on conflict (slug) do update set title = excluded.title, intro = excluded.intro;
update ve_guides set door = true, survey_slug = 'vegan-events-guide' where slug = 'vegan-events-guide';

delete from ve_survey_questions where survey_slug = 'vegan-events-guide';
insert into ve_survey_questions (survey_slug, id, pos, kind, prompt, help, options, points, required) values
 ('vegan-events-guide','e_role',1,'choice','What is your part in events?',null,
  '[{"v":"host","label":"I host or organize events"},{"v":"promoter","label":"I promote or produce events"},{"v":"venue","label":"I run a venue"},{"v":"vendor","label":"I am a vendor or brand that shows up at events"},{"v":"start","label":"I want to start hosting"},{"v":"other","label":"Something else"}]',8,true),
 ('vegan-events-guide','e_chapter',2,'choice','Where do you mostly host?',null,
  '[{"v":"south-florida","label":"South Florida"},{"v":"central-florida","label":"Central Florida"},{"v":"north-florida","label":"North Florida"},{"v":"atlanta","label":"Atlanta"},{"v":"washington-dc","label":"Washington, D.C."},{"v":"maryland","label":"Maryland"},{"v":"virginia","label":"Virginia"},{"v":"delaware","label":"Delaware"},{"v":"west-virginia","label":"West Virginia"},{"v":"philadelphia","label":"Philadelphia"},{"v":"new-york","label":"New York"},{"v":"los-angeles","label":"Los Angeles"},{"v":"london","label":"London"},{"v":"other","label":"Somewhere else"}]',6,true),
 ('vegan-events-guide','e_kind',3,'multi','What kinds of events?','Pick all that fit.',
  '[{"v":"potluck","label":"Potlucks and dinners"},{"v":"social","label":"Social club meetups"},{"v":"market","label":"Markets and pop-ups"},{"v":"festival","label":"Festivals"},{"v":"fundraiser","label":"Fundraisers"},{"v":"class","label":"Classes and talks"},{"v":"night","label":"Restaurant community nights"},{"v":"other","label":"Something else"}]',8,true),
 ('vegan-events-guide','e_count',4,'choice','How many events have you hosted in the last 12 months?',null,
  '[{"v":"0","label":"None yet"},{"v":"1-3","label":"1 to 3"},{"v":"4-12","label":"4 to 12"},{"v":"13+","label":"More than 12"}]',8,true),
 ('vegan-events-guide','e_crowd',5,'choice','How many people come to a typical one?',null,
  '[{"v":"<25","label":"Under 25"},{"v":"25-75","label":"25 to 75"},{"v":"75-200","label":"75 to 200"},{"v":"200-1000","label":"200 to 1,000"},{"v":"1000+","label":"More than 1,000"}]',8,true),
 ('vegan-events-guide','e_group',6,'text','The name of your group, business or event, and a link to it','A website, Instagram or Meetup page is fine.',null,8,true),
 ('vegan-events-guide','e_audience',7,'long','Who are your events for?','A sentence or two.',null,10,true),
 ('vegan-events-guide','e_vegan',8,'choice','How Vegan are your events?',null,
  '[{"v":"all","label":"Everything is Vegan"},{"v":"mostly","label":"Mostly Vegan"},{"v":"friendly","label":"Vegan-friendly, with other food too"},{"v":"notyet","label":"I am planning to make them more Vegan"}]',8,true),
 ('vegan-events-guide','e_hard',9,'multi','What is hardest about hosting?','Pick up to three.',
  '[{"v":"turnout","label":"Getting people to come"},{"v":"noshows","label":"No-shows"},{"v":"money","label":"Money"},{"v":"venue","label":"Finding a venue"},{"v":"vendors","label":"Finding vendors"},{"v":"weather","label":"Weather"},{"v":"help","label":"Finding help"},{"v":"word","label":"Getting the word out"}]',8,true),
 ('vegan-events-guide','e_help',10,'long','What one thing would help you most?','Tell us what would change your next event.',null,10,true),
 ('vegan-events-guide','e_next',11,'choice','Do you have an event coming in the next 90 days?',null,
  '[{"v":"yes","label":"Yes, it is planned"},{"v":"maybe","label":"Maybe, I am planning it"},{"v":"no","label":"Not right now"}]',8,true),
 ('vegan-events-guide','e_story',12,'long','Optional: a moment you were proud of as a host','Only if you would like to share it.',null,10,false);
