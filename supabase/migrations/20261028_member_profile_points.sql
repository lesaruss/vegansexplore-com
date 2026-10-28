-- The survey becomes the member's profile (Sean, 2026-10-28: "Maybe we treat it like a dating profile where it asks different
-- questions about themselves that will be added to their profile. They can get a combined 250 points for every question they answer
-- with some questions being worth more than others"). Each statement is safe to run twice.
--
-- Every question has its own points (ve_profile_questions, 250 in all); an answer is saved the moment it is given
-- (members.mission_survey_answers, the profile) and pays its points once (ve_points_grant, reason profile_answer, ref
-- profile:<question>), so changing or clearing an answer later never pays again or takes back. The profile is complete when every
-- point is earned (mission_survey_completed_at). The old survey's 250 never paid anyone: award_points_bounty had no
-- mission_survey_completed rule, so it returned no_active_rule. The two members who finished it are paid for their answers here.

-- 0. The ledger takes the new reason (its list never had the old survey's mission_survey either).
alter table public.points_ledger drop constraint if exists points_ledger_reason_check;
alter table public.points_ledger add constraint points_ledger_reason_check check (reason = any (array['signup', 'referral', 'daily_login',
  'listing_like', 'listing_create', 'discussion_post', 'discussion_reply', 'discussion_vote', 'event_attend', 'profile_complete',
  'profile_field', 'admin_adjust', 'purchase', 'redemption', 'vote_given', 'vote_received', 'vote_refunded', 'featured_purchase',
  'transfer_sent', 'transfer_received', 'store_purchase', 'store_refund', 'points_purchase', 'bartering', 'boost_purchase',
  'seed_initial', 'Welcome bonus + early activity', 'campaign_back', 'questionnaire', 'wizard_redeem', 've_hunt_complete',
  've_hunt_anchor', 'guide_redeem', 'cycle_grant', 'bounty', 'comp_membership', 'recipe_approved', 'guide_chat_spend',
  'credit_exchange', 'checkin', 'welcome', 'purchase_thanks', 'points_contribution', 'listing_submit', 'profile_answer'])) not valid;

-- 1. The questions and what each is worth. The words live in /public/ve-mission-survey.js (STEPS); the points live here.
--    p_ prompts are the profile's own lines (300 characters), worth the most.
create or replace function public.ve_profile_questions()
returns jsonb language sql immutable as $$
  select '{
    "p_meal": 15, "p_why": 15, "p_day": 15, "p_meet": 15, "p_fact": 15,
    "q1_city": 10, "q2_zip": 5, "q3_roles": 10, "q4_website": 5, "q5_instagram": 5,
    "q6_stage": 10, "q7_vegan_since": 5, "q8_drivers": 5, "q9_challenges": 5,
    "q23_matters": 10, "q24_diet": 5, "q25_household": 5, "q26_work": 5,
    "q10_options_rating": 5, "q11_missing": 5, "q12_business_types": 5, "q13_eatout_freq": 5, "q14_spend": 5, "q15_local_spots": 10,
    "q16_wants": 10, "q17_connect": 5, "q18_events": 5, "q19_nps": 5, "q20_contribute": 5,
    "q21_open": 15, "q22_goal": 10
  }'::jsonb;
$$;

-- 2. Where a member stands: their answers, what each question is worth, which have paid, and the total.
create or replace function public.ve_profile_state(p_member uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
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
    'active', m.membership_status = 'active' and coalesce(m.membership_tier, '') <> 'guest')
  from members m, q, paid where m.id = p_member;
$$;
revoke all on function public.ve_profile_state(uuid) from public, anon, authenticated;

-- 3. Save one answer: the profile, the columns it fills, its points once, and the profile marked complete at 250.
create or replace function public.ve_profile_answer(p_member uuid, p_question text, p_value jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_pts integer := (ve_profile_questions() ->> p_question)::int;
  v_empty boolean;
  v_text text;
  v_grant jsonb := null;
  v_state jsonb;
begin
  if v_pts is null then return jsonb_build_object('error', 'unknown_question'); end if;
  if not exists (select 1 from members where id = p_member and membership_status = 'active' and coalesce(membership_tier, '') <> 'guest') then
    return jsonb_build_object('error', 'not_eligible');
  end if;
  v_empty := p_value is null or p_value = 'null'::jsonb or p_value = '""'::jsonb or p_value = '[]'::jsonb
    or (jsonb_typeof(p_value) = 'string' and btrim(p_value #>> '{}') = '');
  v_text := case when jsonb_typeof(p_value) = 'string' then btrim(p_value #>> '{}') end;

  update members set mission_survey_answers = case when v_empty then coalesce(mission_survey_answers, '{}'::jsonb) - p_question
    else coalesce(mission_survey_answers, '{}'::jsonb) || jsonb_build_object(p_question, p_value) end
  where id = p_member;

  -- The answers that are also profile columns.
  if not v_empty then
    if p_question = 'q2_zip' then update members set profile_location = v_text where id = p_member;
    elsif p_question = 'q3_roles' then update members set member_type = p_value ->> 0 where id = p_member;
    elsif p_question = 'q4_website' then update members set profile_website = v_text where id = p_member;
    elsif p_question = 'q5_instagram' then update members set instagram_handle = v_text where id = p_member;
    elsif p_question = 'q21_open' then update members set mission_survey_response = v_text where id = p_member;
    elsif p_question = 'q7_vegan_since' and v_text ~ '^\d{4}-\d{2}$' then update members set vegan_since = (v_text || '-01')::date where id = p_member;
    elsif p_question = 'q1_city' then
      begin update members set home_community = v_text where id = p_member;
      exception when check_violation then null; -- "Somewhere else" is an answer, not a chapter
      end;
    end if;
    v_grant := ve_points_grant(p_member, v_pts, 'profile_answer', 'profile:' || p_question);
  end if;

  v_state := ve_profile_state(p_member);
  if (v_state ->> 'earned')::int >= (v_state ->> 'total')::int then
    update members set mission_survey_completed_at = coalesce(mission_survey_completed_at, now()), mission_survey_draft = null where id = p_member;
  end if;
  return jsonb_build_object('ok', true, 'question', p_question, 'points', v_pts,
    'paid_now', coalesce((v_grant ->> 'granted')::boolean, false), 'earned', (v_state ->> 'earned')::int, 'total', (v_state ->> 'total')::int);
end $$;
revoke all on function public.ve_profile_answer(uuid, text, jsonb) from public, anon, authenticated;

-- 4. Complete means every point earned, so the two who finished the old survey are not complete until their answers have paid.
update members set mission_survey_completed_at = null where mission_survey_completed_at is not null
  and not exists (select 1 from points_ledger l where l.member_id = members.id and l.reason = 'profile_answer');

-- 5. Pay the answers already given (the old survey's finishers, and anything saved since this morning's drafts).
do $$
declare r record; k text; v jsonb;
begin
  for r in select id, coalesce(mission_survey_answers, '{}'::jsonb) || coalesce(mission_survey_draft->'answers', '{}'::jsonb) as a
           from members where mission_survey_answers is not null or mission_survey_draft is not null loop
    for k, v in select key, value from jsonb_each(r.a) loop
      if ve_profile_questions() ? k then perform ve_profile_answer(r.id, k, v); end if;
    end loop;
  end loop;
end $$;
