-- ve-pathways: the survey door waits for a person (Sean, 2026-11-03: "our team is now reviewing your submissions... if everything checks
-- out, you will receive a notification... you have received your points and you are officially a founding member"; "Yes, go with your
-- defaults on the review gate"). An account that earns its membership with the survey no longer becomes a member on its last answer:
--   * its answers are saved as it goes but pay NO points yet (held);
--   * when every question is answered it can Finalize (ve_survey_finalize): survey_review = 'pending', survey_submitted_at = now();
--   * a super admin approves (points for every answer are paid, the account turns active, entry_via survey) or sends it back with a note
--     (ve_survey_review_decide).
-- Founding Member follows the day they finalized, not the day we approved: a slow review never costs the deadline (Logan's default).
-- Members who are already active are unchanged (their answers pay at once, as before). A Guide's own survey (ve_survey_answer) is unchanged.
alter table members add column if not exists survey_submitted_at timestamptz;
alter table members add column if not exists survey_review text;
alter table members add column if not exists survey_review_note text;
alter table members add column if not exists survey_reviewed_at timestamptz;
alter table members add column if not exists survey_reviewed_by uuid;
alter table members drop constraint if exists members_survey_review_check;
alter table members add constraint members_survey_review_check check (survey_review is null or survey_review in ('pending', 'approved', 'sent_back'));

-- Founding: paying before the deadline, or finalizing the survey before it (admitted later, after review).
create or replace function ve_founding_on_paid() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.member_class, 'member') <> 'agent' then
    if new.entry_paid_at is not null and new.entry_paid_at < ve_founding_deadline() and now() < ve_founding_deadline()
       and (tg_op = 'INSERT' or old.entry_paid_at is null) then
      new.founding_member := true;
    elsif new.entry_via = 'survey' and new.membership_status = 'active'
       and (tg_op = 'INSERT' or old.membership_status is distinct from 'active')
       and coalesce(new.survey_submitted_at, now()) < ve_founding_deadline() then
      new.founding_member := true;
    end if;
  end if;
  return new;
end $$;

-- The state: for an account on the survey door the points are held, so earned counts every answer given (what it will receive on approval).
create or replace function ve_profile_state(p_member uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with q as (select ve_profile_questions() as pts),
  paid as (
    select coalesce(jsonb_agg(substr(l.ref_id, 9)), '[]'::jsonb) as ids, coalesce(sum(l.delta), 0) as earned
    from points_ledger l where l.member_id = p_member and l.reason = 'profile_answer'
  ),
  ans as (
    select coalesce(jsonb_agg(k), '[]'::jsonb) as ids, coalesce(sum((q.pts ->> k)::int), 0) as pts
    from members m, q, jsonb_object_keys(coalesce(m.mission_survey_answers, '{}'::jsonb)) k
    where m.id = p_member and q.pts ? k
  )
  select jsonb_build_object(
    'answers', coalesce(m.mission_survey_answers, '{}'::jsonb),
    'at', coalesce((m.mission_survey_draft->>'at')::int, 0),
    'points', q.pts,
    'paid', case when door.d then ans.ids else paid.ids end,
    'earned', case when door.d then ans.pts else paid.earned end,
    'total', (select sum(value::int) from jsonb_each_text(q.pts)),
    'completed', m.mission_survey_completed_at is not null,
    'active', m.membership_status = 'active' and coalesce(m.membership_tier, '') <> 'guest',
    'door', door.d,
    'held', door.d,
    'ready', door.d and ans.pts >= (select sum(value::int) from jsonb_each_text(q.pts)),
    'review', m.survey_review,
    'review_note', m.survey_review_note,
    'shown', ve_profile_shown(m.id))
  from members m
  cross join q cross join paid cross join ans
  cross join lateral (select (m.membership_status = 'pending_payment' and m.survey_door_at is not null) as d) door
  where m.id = p_member;
$$;

create or replace function ve_profile_answer(p_member uuid, p_question text, p_value jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_pts integer := (ve_profile_questions() ->> p_question)::int;
  v_empty boolean;
  v_text text;
  v_grant jsonb := null;
  v_state jsonb;
  v_admitted boolean := false;
  v_door boolean;
  v_review text;
begin
  if v_pts is null then return jsonb_build_object('error', 'unknown_question'); end if;
  if not exists (select 1 from members where id = p_member and coalesce(membership_tier, '') <> 'guest'
                 and (membership_status = 'active' or (membership_status = 'pending_payment' and survey_door_at is not null))) then
    return jsonb_build_object('error', 'not_eligible');
  end if;
  select (membership_status = 'pending_payment' and survey_door_at is not null), survey_review into v_door, v_review from members where id = p_member;
  -- Once finalized, the answers wait for the team and cannot change until they send it back.
  if v_door and v_review = 'pending' then return jsonb_build_object('error', 'under_review'); end if;
  v_empty := p_value is null or p_value = 'null'::jsonb or p_value = '""'::jsonb or p_value = '[]'::jsonb
    or (jsonb_typeof(p_value) = 'string' and btrim(p_value #>> '{}') = '');
  v_text := case when jsonb_typeof(p_value) = 'string' then btrim(p_value #>> '{}') end;

  update members set mission_survey_answers = case when v_empty then coalesce(mission_survey_answers, '{}'::jsonb) - p_question
    else coalesce(mission_survey_answers, '{}'::jsonb) || jsonb_build_object(p_question, p_value) end
  where id = p_member;

  if not v_empty then
    if p_question = 'q2_zip' then update members set profile_location = v_text where id = p_member;
    elsif p_question = 'q3_roles' then update members set member_type = p_value ->> 0 where id = p_member;
    elsif p_question = 'q4_website' then update members set profile_website = v_text where id = p_member;
    elsif p_question = 'q5_instagram' then update members set instagram_handle = v_text where id = p_member;
    elsif p_question = 'q21_open' then update members set mission_survey_response = v_text where id = p_member;
    elsif p_question = 'q7_vegan_since' and v_text ~ '^\d{4}-\d{2}$' then update members set vegan_since = (v_text || '-01')::date where id = p_member;
    elsif p_question = 'q1_city' then
      begin update members set home_community = v_text where id = p_member;
      exception when check_violation then null;
      end;
    end if;
    -- The survey door holds its points until the team approves; everyone else is paid at once, once per question.
    if not v_door then v_grant := ve_points_grant(p_member, v_pts, 'profile_answer', 'profile:' || p_question); end if;
  end if;

  v_state := ve_profile_state(p_member);
  if not v_door and (v_state ->> 'earned')::int >= (v_state ->> 'total')::int then
    update members set mission_survey_completed_at = coalesce(mission_survey_completed_at, now()), mission_survey_draft = null where id = p_member;
  end if;
  return jsonb_build_object('ok', true, 'question', p_question, 'points', v_pts,
    'paid_now', coalesce((v_grant ->> 'granted')::boolean, false), 'earned', (v_state ->> 'earned')::int, 'total', (v_state ->> 'total')::int,
    'admitted', v_admitted, 'held', v_door, 'ready', coalesce((v_state ->> 'ready')::boolean, false));
end $$;

-- Finalize: every question answered, then it waits for the team.
create or replace function ve_survey_finalize(p_member uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m record; v_state jsonb;
begin
  select * into m from members where id = p_member;
  if not found or m.membership_status <> 'pending_payment' or m.survey_door_at is null then return jsonb_build_object('error', 'not_eligible'); end if;
  if m.survey_review = 'pending' then return jsonb_build_object('ok', true, 'already', true); end if;
  v_state := ve_profile_state(p_member);
  if not coalesce((v_state ->> 'ready')::boolean, false) then return jsonb_build_object('error', 'not_finished'); end if;
  update members set survey_review = 'pending', survey_submitted_at = now(), survey_review_note = null,
    mission_survey_completed_at = coalesce(mission_survey_completed_at, now()), mission_survey_draft = null, updated_at = now()
  where id = p_member;
  return jsonb_build_object('ok', true);
end $$;

-- The team's decision. Approve: pay every answer's points once, then admit (Founding by the day they finalized). Send back: a note they read.
create or replace function ve_survey_review_decide(p_member uuid, p_judge uuid, p_decision text, p_note text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare m record; k text; pts jsonb := ve_profile_questions(); total int := 0; r jsonb;
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
    return jsonb_build_object('ok', true, 'decision', 'send_back');
  elsif p_decision = 'approve' then
    for k in select jsonb_object_keys(coalesce(m.mission_survey_answers, '{}'::jsonb)) loop
      if pts ? k then
        r := ve_points_grant(p_member, (pts ->> k)::int, 'profile_answer', 'profile:' || k);
        if coalesce((r ->> 'granted')::boolean, false) then total := total + (pts ->> k)::int; end if;
      end if;
    end loop;
    update members set membership_status = 'active', entry_via = 'survey', survey_review = 'approved', survey_review_note = nullif(btrim(coalesce(p_note, '')), ''),
      survey_reviewed_at = now(), survey_reviewed_by = p_judge, updated_at = now() where id = p_member;
    return jsonb_build_object('ok', true, 'decision', 'approve', 'points', total,
      'founding', (select founding_member from members where id = p_member));
  end if;
  return jsonb_build_object('error', 'bad_decision');
end $$;

revoke all on function ve_survey_finalize(uuid), ve_survey_review_decide(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function ve_survey_finalize(uuid), ve_survey_review_decide(uuid, uuid, text, text) to service_role;
