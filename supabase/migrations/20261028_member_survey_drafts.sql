-- The survey tailors the dashboard (Sean, 2026-10-28: "I don't get the drop down either, your dashboard drop down. Like, we should
-- know who they are, right? We should be using a survey to figure out how to tailor this experience for them... a detailed survey
-- where they can get 250 points... They could save it and come back to it"). Each statement is safe to run twice.
-- 1. Drafts: ve-mission-survey draft_save keeps the answers so far and the question they are on; submit clears it.
-- 2. The version follows the survey only: the dropdown is gone, so a version picked with it is cleared. Health or medicine and
--    Coaching or fitness (q26, What matters to you) count as Coach or pro, like Service provider.

alter table public.members add column if not exists mission_survey_draft jsonb;
comment on column public.members.mission_survey_draft is 'Mission Survey answers so far, {answers, at, saved_at}; ve-mission-survey draft_save, cleared on submit (Sean 2026-10-28).';

create or replace function public.ve_dashboard_version(p_member uuid)
returns text language sql stable security definer set search_path to 'public' as $$
  select case
    when exists (select 1 from listings where status = 'approved' and (owner_member_id = m.id or claimed_by_member_id = m.id))
      or coalesce(m.mission_survey_answers->'q3_roles', '[]'::jsonb) ? 'Business owner' then 'business'
    when m.mission_survey_answers->>'q6_stage' in ('Curious / pre-Vegan', 'Flexitarian', 'Vegetarian') then 'pre_vegan'
    when coalesce(m.mission_survey_answers->'q3_roles', '[]'::jsonb) ? 'Service provider'
      or m.mission_survey_answers->>'q26_work' in ('Health or medicine', 'Coaching or fitness') then 'coach'
    else 'member' end
  from members m where m.id = p_member;
$$;

update public.members set dashboard_version = null where dashboard_version is not null;
