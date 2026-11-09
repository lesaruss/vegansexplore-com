-- ve-explorer-path step 7 (canon-ve-door-guides v7/v10): Build your profile. 2026-11-09, Sean: "go on step 7 with your defaults".
-- The profile (31 questions, 250 points, ve_profile_answer) has existed since 2026-10-28. Two of its questions are the same as the
-- Explorer survey's, so an Explorer never answers them twice: the answer carries over, counts as answered and pays its profile points
-- once (ref profile:<question>, the same ref ve_profile_answer uses, so it is never paid twice).
--   q1_city  <- x_chapter, every chapter (not "Somewhere else")
--   q6_stage <- x_journey, only where it maps exactly: Pre-Vegan or Just curious -> "Curious / pre-Vegan", Vegetarian -> "Vegetarian".
--              "Vegan" is left for them to answer, since the profile asks how long.
-- q3_roles (Which best describes you?) is not carried: it is a different question from "Do you run any of these?".
-- A profile answer they already gave is never replaced.

create or replace function ve_profile_carry_explorer(p_member uuid) returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_ans jsonb; v_chapter text; v_journey text; v_stage text; v_pts jsonb := ve_profile_questions(); v_out jsonb := '[]'::jsonb;
begin
  select coalesce(mission_survey_answers, '{}'::jsonb) into v_ans from members
  where id = p_member and member_class in ('member', 'internal') and coalesce(membership_status, '') <> 'cancelled';
  if v_ans is null then return v_out; end if;
  select value #>> '{}' into v_chapter from ve_survey_answers where member_id = p_member and survey_slug = 'explorer' and question_id = 'x_chapter';
  select value #>> '{}' into v_journey from ve_survey_answers where member_id = p_member and survey_slug = 'explorer' and question_id = 'x_journey';

  if v_chapter is not null and v_chapter <> 'other' and not (v_ans ? 'q1_city') then
    update members set mission_survey_answers = coalesce(mission_survey_answers, '{}'::jsonb) || jsonb_build_object('q1_city', v_chapter)
    where id = p_member;
    begin update members set home_community = v_chapter where id = p_member and home_community is null;
    exception when check_violation then null; end;
    perform ve_points_grant(p_member, (v_pts ->> 'q1_city')::int, 'profile_answer', 'profile:q1_city');
    v_out := v_out || '"q1_city"'::jsonb;
  end if;

  v_stage := case v_journey when 'prevegan' then 'Curious / pre-Vegan' when 'curious' then 'Curious / pre-Vegan' when 'vegetarian' then 'Vegetarian' end;
  if v_stage is not null and not (v_ans ? 'q6_stage') then
    update members set mission_survey_answers = coalesce(mission_survey_answers, '{}'::jsonb) || jsonb_build_object('q6_stage', v_stage)
    where id = p_member;
    perform ve_points_grant(p_member, (v_pts ->> 'q6_stage')::int, 'profile_answer', 'profile:q6_stage');
    v_out := v_out || '"q6_stage"'::jsonb;
  end if;
  return v_out;
end $$;

-- Runs when the Explorer survey is finished and again when that finish admits them (the completion row is written before the admission).
create or replace function ve_profile_carry_explorer_trg() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.survey_slug = 'explorer' then
    begin perform ve_profile_carry_explorer(new.member_id);
    exception when others then null; -- never block finishing a survey
    end;
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_profile_carry_explorer on ve_survey_completions;
create trigger trg_ve_profile_carry_explorer after insert or update of admitted on ve_survey_completions
  for each row execute function ve_profile_carry_explorer_trg();

-- Everyone who has already finished Explorer.
select ve_profile_carry_explorer(member_id) from ve_survey_completions where survey_slug = 'explorer';

revoke all on function ve_profile_carry_explorer(uuid) from public, anon, authenticated;
revoke all on function ve_profile_carry_explorer_trg() from public, anon, authenticated;
