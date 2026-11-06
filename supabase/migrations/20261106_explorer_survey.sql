-- ve-events-guide: step 7 of the membership rule, the Explorer survey on the Welcome (canon-ve-door-guides v6 membership_rule_v6;
-- wording approved by Sean 2026-11-06, docs/proposals/membership-rule-wording-steps-3-9.md). 8 questions, 250 points, checked by a person.
-- A survey marked reviewed holds its points for an account that is not a member yet: finishing it puts the account in the same queue as
-- the profile survey door (members.survey_review 'pending', Depot > Profiles > Waiting for review); approving pays the held points and
-- admits (Founding by survey_submitted_at, the day they finished). An active member who takes it is paid at once.
-- Also ve_member_guide_surveys(member) for the Depot's review page. Safe to run twice.

alter table public.ve_surveys add column if not exists reviewed boolean not null default false;

insert into public.ve_surveys (slug, guide_slug, title, intro, admits, active, reviewed)
values ('explorer', null, 'The Explorer survey',
        'Eight quick questions about you and where you live. A person on our team reads every one, and when it checks out you are a member, with 250 points.', true, true, true)
on conflict (slug) do update set title = excluded.title, intro = excluded.intro, admits = true, active = true, reviewed = true;

insert into public.ve_survey_questions (survey_slug, id, pos, kind, prompt, help, options, points, required, shared_key) values
 ('explorer', 'x_brings', 1, 'multi', 'What brings you to Vegans Explore?', null,
  '[{"v":"eat","label":"Finding places to eat"},{"v":"people","label":"Meeting people"},{"v":"events","label":"Events"},{"v":"learn","label":"Learning"},{"v":"animals","label":"Supporting the animals"},{"v":"work","label":"My business or work"}]'::jsonb, 35, true, null),
 ('explorer', 'x_journey', 2, 'choice', 'Where are you on your Vegan journey?', null,
  '[{"v":"vegan","label":"Vegan"},{"v":"prevegan","label":"Pre-Vegan, working toward it"},{"v":"vegetarian","label":"Vegetarian"},{"v":"curious","label":"Just curious"}]'::jsonb, 35, true, null),
 ('explorer', 'x_chapter', 3, 'choice', 'x', null, null, 30, true, 'chapter'),
 ('explorer', 'x_more', 4, 'multi', 'What do you want more of where you live?', null,
  '[{"v":"food","label":"Places to eat"},{"v":"events","label":"Events"},{"v":"groceries","label":"Groceries and products"},{"v":"people","label":"People to meet"},{"v":"animals","label":"Ways to help animals"}]'::jsonb, 35, true, null),
 ('explorer', 'x_hear', 5, 'multi', 'How do you want to hear from us?', null,
  '[{"v":"pulse","label":"The Daily Pulse by email"},{"v":"instagram","label":"Instagram"},{"v":"site","label":"I will check the site"}]'::jsonb, 20, false, null),
 ('explorer', 'x_run', 6, 'multi', 'Do you run any of these?', null,
  '[{"v":"restaurant","label":"A restaurant or food business"},{"v":"events","label":"Events"},{"v":"nonprofit","label":"A nonprofit, rescue or sanctuary"},{"v":"creator","label":"I make content"},{"v":"none","label":"None of these"}]'::jsonb, 30, true, null),
 ('explorer', 'x_worth', 7, 'long', 'In your own words: what would make Vegans Explore worth it for you?', null, null, 45, true, null),
 ('explorer', 'x_add', 8, 'text', 'Optional: a place, person or group we should add to the Directory', null, null, 20, false, null)
on conflict do nothing;

create or replace function public.ve_survey_answer(p_member uuid, p_survey text, p_question text, p_value jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  s ve_surveys; q ve_survey_questions; m record; c record;
  v jsonb := p_value; v_empty boolean; v_text text; v_grant jsonb := null; v_admitted boolean := false; v_done boolean; v_missing int;
  v_hold boolean := false; v_review text := null;
begin
  select * into s from ve_surveys where slug = p_survey and active;
  if not found then return jsonb_build_object('error', 'unknown_survey'); end if;
  select * into q from ve_survey_questions where survey_slug = p_survey and id = p_question;
  if not found then return jsonb_build_object('error', 'unknown_question'); end if;
  select id, membership_status, coalesce(membership_tier, '') tier, coalesce(member_class, 'member') cls, survey_door_at, survey_review into m from members where id = p_member;
  if not found or m.tier = 'guest' or m.cls <> 'member' or m.membership_status not in ('active', 'pending_payment') then
    return jsonb_build_object('error', 'not_eligible');
  end if;
  if m.membership_status = 'pending_payment' then
    if not s.admits then return jsonb_build_object('error', 'not_eligible'); end if;
    -- A reviewed survey (the Explorer survey) holds its points until a person approves it, and is locked while it waits.
    v_hold := s.reviewed;
    if v_hold and m.survey_review = 'pending' then return jsonb_build_object('error', 'under_review'); end if;
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
    if q.points > 0 and not v_hold then v_grant := ve_points_grant(p_member, q.points, 'survey_answer', 'survey:' || p_survey || ':' || p_question); end if;
    -- A shared answer: keep it once and let the newest win in every intake that already has it (points there were paid when first given).
    if q.shared_key is not null then
      insert into ve_member_shared_answers (member_id, key, value, survey_slug) values (p_member, q.shared_key, v, p_survey)
      on conflict (member_id, key) do update set value = excluded.value, survey_slug = excluded.survey_slug, updated_at = now();
      update ve_survey_answers a set value = v, updated_at = now()
        from ve_survey_questions oq
        where oq.shared_key = q.shared_key and a.survey_slug = oq.survey_slug and a.question_id = oq.id
          and a.member_id = p_member and not (a.survey_slug = p_survey and a.question_id = p_question);
    end if;
  end if;

  -- Carry in the shared answers given elsewhere, paying their points here (held on a reviewed survey), so this intake counts and pays in full.
  for c in select q2.id, q2.points, ms.value from ve_survey_questions q2
             join ve_member_shared_answers ms on ms.member_id = p_member and ms.key = q2.shared_key
            where q2.survey_slug = p_survey
              and not exists (select 1 from ve_survey_answers a where a.member_id = p_member and a.survey_slug = p_survey and a.question_id = q2.id)
  loop
    insert into ve_survey_answers (member_id, survey_slug, question_id, value) values (p_member, p_survey, c.id, c.value) on conflict do nothing;
    if c.points > 0 and not v_hold then perform ve_points_grant(p_member, c.points, 'survey_answer', 'survey:' || p_survey || ':' || c.id); end if;
  end loop;

  select count(*) into v_missing from ve_survey_questions sq
    where sq.survey_slug = p_survey and sq.required
      and not exists (select 1 from ve_survey_answers a where a.member_id = p_member and a.survey_slug = p_survey and a.question_id = sq.id);
  v_done := v_missing = 0;
  if v_done then
    insert into ve_survey_completions (member_id, survey_slug) values (p_member, p_survey) on conflict do nothing;
    if v_hold then
      update members set survey_review = 'pending', survey_submitted_at = now(), survey_review_note = null, updated_at = now() where id = p_member;
      v_review := 'pending';
    elsif s.admits then
      v_admitted := ve_survey_door_admit(p_member);
      if v_admitted then update ve_survey_completions set admitted = true where member_id = p_member and survey_slug = p_survey; end if;
    end if;
  end if;
  return jsonb_build_object('ok', true, 'question', p_question, 'points', q.points,
    'paid_now', coalesce((v_grant ->> 'granted')::boolean, false), 'completed', v_done, 'admitted', v_admitted, 'missing', v_missing, 'review', v_review);
end $function$;

-- The team's decision now also pays a reviewed Guide survey's held points (the Explorer survey), then admits as before.
create or replace function public.ve_survey_review_decide(p_member uuid, p_judge uuid, p_decision text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m record; k text; pts jsonb := ve_profile_questions(); total int := 0; r jsonb; a record;
begin
  if not exists (select 1 from members where id = p_judge and is_superadmin) then return jsonb_build_object('error', 'judge_only'); end if;
  select * into m from members where id = p_member;
  if not found or m.membership_status <> 'pending_payment' or m.survey_door_at is null or m.survey_review is distinct from 'pending' then
    return jsonb_build_object('error', 'not_waiting');
  end if;
  if p_decision = 'send_back' then
    if coalesce(btrim(p_note), '') = '' then return jsonb_build_object('error', 'note_required'); end if;
    update members set survey_review = 'sent_back', survey_review_note = btrim(p_note), survey_reviewed_at = now(), survey_reviewed_by = p_judge,
      mission_survey_completed_at = null, updated_at = now() where id = p_member;
    -- A reviewed Guide survey can be finished again once it is changed.
    delete from ve_survey_completions c using ve_surveys s where c.member_id = p_member and c.survey_slug = s.slug and s.reviewed;
    return jsonb_build_object('ok', true, 'decision', 'send_back');
  elsif p_decision = 'approve' then
    for k in select jsonb_object_keys(coalesce(m.mission_survey_answers, '{}'::jsonb)) loop
      if pts ? k then
        r := ve_points_grant(p_member, (pts ->> k)::int, 'profile_answer', 'profile:' || k);
        if coalesce((r ->> 'granted')::boolean, false) then total := total + (pts ->> k)::int; end if;
      end if;
    end loop;
    for a in select sa.survey_slug, sa.question_id, q.points from ve_survey_answers sa
               join ve_survey_questions q on q.survey_slug = sa.survey_slug and q.id = sa.question_id
               join ve_surveys s on s.slug = sa.survey_slug and s.reviewed
              where sa.member_id = p_member and q.points > 0 loop
      r := ve_points_grant(p_member, a.points, 'survey_answer', 'survey:' || a.survey_slug || ':' || a.question_id);
      if coalesce((r ->> 'granted')::boolean, false) then total := total + a.points; end if;
    end loop;
    update members set membership_status = 'active', entry_via = 'survey', survey_review = 'approved', survey_review_note = nullif(btrim(coalesce(p_note, '')), ''),
      survey_reviewed_at = now(), survey_reviewed_by = p_judge, updated_at = now() where id = p_member;
    update ve_survey_completions c set admitted = true from ve_surveys s where c.member_id = p_member and c.survey_slug = s.slug and s.reviewed;
    return jsonb_build_object('ok', true, 'decision', 'approve', 'points', total,
      'founding', (select founding_member from members where id = p_member));
  end if;
  return jsonb_build_object('error', 'bad_decision');
end $$;
revoke all on function public.ve_survey_review_decide(uuid, uuid, text, text) from public, anon, authenticated;

-- Every Guide survey a member answered, worded as they saw it (Depot > Profiles).
create or replace function public.ve_member_guide_surveys(p_member uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(x order by x ->> 'pos_first'), '[]'::jsonb) from (
    select jsonb_build_object('survey', s.slug, 'title', s.title, 'reviewed', s.reviewed, 'pos_first', case when s.reviewed then '0' else '1' end || s.slug,
      'completed_at', (select c.completed_at from ve_survey_completions c where c.member_id = p_member and c.survey_slug = s.slug),
      'qa', (select jsonb_agg(jsonb_build_object('q', q.prompt, 'a',
                case when q.kind in ('choice', 'multi') then
                  (select string_agg(o ->> 'label', ', ') from jsonb_array_elements(q.options) o
                    where o ->> 'v' = any (array(select jsonb_array_elements_text(case jsonb_typeof(a.value) when 'array' then a.value else jsonb_build_array(a.value) end))))
                else a.value #>> '{}' end) order by q.pos)
             from ve_survey_answers a join ve_survey_questions q on q.survey_slug = a.survey_slug and q.id = a.question_id
             where a.member_id = p_member and a.survey_slug = s.slug)) x
    from ve_surveys s where exists (select 1 from ve_survey_answers a where a.member_id = p_member and a.survey_slug = s.slug)) t;
$$;
revoke all on function public.ve_member_guide_surveys(uuid) from public, anon, authenticated;

do $$ declare t int; begin
  select sum(points) into t from public.ve_survey_questions where survey_slug = 'explorer';
  if t <> 250 then raise exception 'explorer totals %, not 250', t; end if;
end $$;
