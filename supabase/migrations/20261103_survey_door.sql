-- The survey door (Sean, 2026-11-03: "people don't have to pay to get in, but they do have to show some effort").
-- An unpaid account that finishes the whole profile survey (250 points, the survey's own) becomes a member.
-- Founding Member: either door before midnight Eastern on 2027-01-01. No comps, no entry_paid_at (nothing was paid).
alter table members add column if not exists entry_via text;
alter table members add column if not exists survey_door_at timestamptz;
update members set entry_via = 'passport' where entry_via is null and entry_paid_at is not null;

alter table brand_memberships drop constraint if exists brand_memberships_kind_check;
alter table brand_memberships add constraint brand_memberships_kind_check
  check (kind = any (array['passport','comp','diplomat','survey']));

-- A membership earned with the survey is its own kind, never a comp.
create or replace function trg_ve_brand_membership_sync() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.tenant_id is distinct from '00000000-0000-4000-a000-000000000002' then return new; end if;
  if new.membership_status = 'active' then
    perform ve_brand_membership_grant(new.id,
      case when new.entry_paid_at is not null then 'passport' when new.entry_via = 'survey' then 'survey' else 'comp' end, 'account');
  elsif tg_op = 'UPDATE' and old.membership_status = 'active' then
    update brand_memberships set status = 'ended', ends_at = coalesce(ends_at, now()), updated_at = now()
    where member_id = new.id and brand = 'vegans-explore' and status = 'active';
  end if;
  return new;
end $$;

-- Founding: paying before the deadline, or earning membership with the survey before it.
create or replace function ve_founding_on_paid() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.member_class, 'member') <> 'agent' and now() < ve_founding_deadline() then
    if new.entry_paid_at is not null and new.entry_paid_at < ve_founding_deadline()
       and (tg_op = 'INSERT' or old.entry_paid_at is null) then
      new.founding_member := true;
    elsif new.entry_via = 'survey' and new.membership_status = 'active'
       and (tg_op = 'INSERT' or old.membership_status is distinct from 'active') then
      new.founding_member := true;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_founding_on_paid on members;
create trigger trg_ve_founding_on_paid before insert or update of entry_paid_at, membership_status on members
  for each row execute function ve_founding_on_paid();

-- Start the door: only an account waiting on its Passport.
create or replace function ve_survey_door_start(p_member uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  update members set survey_door_at = coalesce(survey_door_at, now())
  where id = p_member and membership_status = 'pending_payment' and coalesce(member_class, 'member') = 'member';
  if not found then
    if exists (select 1 from members where id = p_member and membership_status = 'active') then
      return jsonb_build_object('ok', true, 'already_member', true);
    end if;
    return jsonb_build_object('error', 'not_eligible');
  end if;
  return jsonb_build_object('ok', true);
end $$;

-- Finishing the survey admits the account.
create or replace function ve_survey_door_admit(p_member uuid) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update members set membership_status = 'active', entry_via = 'survey', updated_at = now()
  where id = p_member and membership_status = 'pending_payment' and survey_door_at is not null;
  return found;
end $$;

create or replace function ve_profile_answer(p_member uuid, p_question text, p_value jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_pts integer := (ve_profile_questions() ->> p_question)::int;
  v_empty boolean;
  v_text text;
  v_grant jsonb := null;
  v_state jsonb;
  v_admitted boolean := false;
begin
  if v_pts is null then return jsonb_build_object('error', 'unknown_question'); end if;
  if not exists (select 1 from members where id = p_member and coalesce(membership_tier, '') <> 'guest'
                 and (membership_status = 'active' or (membership_status = 'pending_payment' and survey_door_at is not null))) then
    return jsonb_build_object('error', 'not_eligible');
  end if;
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
    v_grant := ve_points_grant(p_member, v_pts, 'profile_answer', 'profile:' || p_question);
  end if;

  v_state := ve_profile_state(p_member);
  if (v_state ->> 'earned')::int >= (v_state ->> 'total')::int then
    update members set mission_survey_completed_at = coalesce(mission_survey_completed_at, now()), mission_survey_draft = null where id = p_member;
    v_admitted := ve_survey_door_admit(p_member);
  end if;
  return jsonb_build_object('ok', true, 'question', p_question, 'points', v_pts,
    'paid_now', coalesce((v_grant ->> 'granted')::boolean, false), 'earned', (v_state ->> 'earned')::int, 'total', (v_state ->> 'total')::int,
    'admitted', v_admitted);
end $$;

-- The state tells the page whether the door is open.
create or replace function ve_profile_state(p_member uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  with q as (select ve_profile_questions() as pts),
  paid as (
    select coalesce(jsonb_agg(substr(l.ref_id, 9)), '[]'::jsonb) as ids, coalesce(sum(l.delta), 0) as earned
    from points_ledger l where l.member_id = p_member and l.reason = 'profile_answer'
  )
  select jsonb_build_object(
    'answers', coalesce(m.mission_survey_answers, '{}'::jsonb),
    'at', coalesce((m.mission_survey_draft->>'at')::int, 0),
    'points', q.pts,
    'paid', paid.ids,
    'earned', paid.earned,
    'total', (select sum(value::int) from jsonb_each_text(q.pts)),
    'completed', m.mission_survey_completed_at is not null,
    'active', m.membership_status = 'active' and coalesce(m.membership_tier, '') <> 'guest',
    'door', m.membership_status = 'pending_payment' and m.survey_door_at is not null,
    'shown', ve_profile_shown(m.id))
  from members m, q, paid where m.id = p_member;
$$;
