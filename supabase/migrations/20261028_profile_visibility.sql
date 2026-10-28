-- Member profiles, phase 1 (playbook ve-member-profiles-partner-windows, locked by Sean 2026-10-28; Sean: "go ahead with phase 1").
-- We choose when a profile is seen; the member chooses what is in it. Each answer a member can share has a switch, Can be shown or
-- Just for Vegans Explore. The team sees everything. Safe to run twice.
--
-- Switchable: the questions about the member themselves. Shown by default: the In your words prompts, city and journey. Never
-- switchable (no switch, never shown to anyone outside the team): the team's market research questions and the Instagram handle,
-- since partners never see contact details. ve_profile_public is the only way a profile leaves the team: the parts shown, in the
-- windows the later phases open.

alter table public.members add column if not exists profile_shown jsonb not null default '{}'::jsonb;
comment on column public.members.profile_shown is 'Profile answers the member set: {question: true (Can be shown) | false (Just for Vegans Explore)}; ve_profile_set_shown. Unset ones follow ve_profile_switchable() defaults.';

-- Which answers have a switch, and its default.
create or replace function public.ve_profile_switchable()
returns jsonb language sql immutable as $$
  select '{
    "p_meal": true, "p_why": true, "p_day": true, "p_meet": true, "p_fact": true,
    "q1_city": true, "q6_stage": true, "q7_vegan_since": true,
    "q3_roles": false, "q8_drivers": false, "q23_matters": false, "q24_diet": false
  }'::jsonb;
$$;

-- The member's switches as they stand: their choice, else the default.
create or replace function public.ve_profile_shown(p_member uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_object_agg(s.key, coalesce((m.profile_shown ->> s.key)::boolean, (s.value)::boolean)), '{}'::jsonb)
  from jsonb_each_text(ve_profile_switchable()) s, members m where m.id = p_member;
$$;
revoke all on function public.ve_profile_shown(uuid) from public, anon, authenticated;

create or replace function public.ve_profile_set_shown(p_member uuid, p_question text, p_shown boolean)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
begin
  if not (ve_profile_switchable() ? p_question) then return jsonb_build_object('error', 'not_switchable'); end if;
  update members set profile_shown = coalesce(profile_shown, '{}'::jsonb) || jsonb_build_object(p_question, coalesce(p_shown, false))
  where id = p_member;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  return jsonb_build_object('ok', true, 'question', p_question, 'shown', coalesce(p_shown, false));
end $$;
revoke all on function public.ve_profile_set_shown(uuid, text, boolean) from public, anon, authenticated;

-- What anyone outside the team may ever see: first name and last initial, their city, and the answers they marked Can be shown.
create or replace function public.ve_profile_public(p_member uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select jsonb_build_object(
    'name', trim(split_part(coalesce(m.name, ''), ' ', 1) || ' ' || left(split_part(coalesce(m.name, ''), ' ', 2), 1)),
    'answers', coalesce((select jsonb_object_agg(a.key, a.value) from jsonb_each(coalesce(m.mission_survey_answers, '{}'::jsonb)) a
      where (ve_profile_shown(m.id) ->> a.key)::boolean is true), '{}'::jsonb))
  from members m where m.id = p_member;
$$;
revoke all on function public.ve_profile_public(uuid) from public, anon, authenticated;

-- The member's own view now carries the switches.
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
    'active', m.membership_status = 'active' and coalesce(m.membership_tier, '') <> 'guest',
    'shown', ve_profile_shown(m.id))
  from members m, q, paid where m.id = p_member;
$$;
revoke all on function public.ve_profile_state(uuid) from public, anon, authenticated;

-- The team's view (Depot > People > Profiles): every member who has answered, most points first.
create or replace function public.ve_profile_admin_list()
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select coalesce(jsonb_agg(row_to_json(x) order by x.earned desc, x.answered desc, x.name), '[]'::jsonb) from (
    select m.id, m.name, m.email, m.home_community, m.ve_role, m.membership_status,
      (select count(*) from jsonb_object_keys(coalesce(m.mission_survey_answers, '{}'::jsonb))) as answered,
      coalesce((select sum(l.delta) from points_ledger l where l.member_id = m.id and l.reason = 'profile_answer'), 0) as earned,
      (select max(l.created_at) from points_ledger l where l.member_id = m.id and l.reason = 'profile_answer') as last_answer_at
    from members m
    where m.merged_into_member_id is null and coalesce(m.mission_survey_answers, '{}'::jsonb) <> '{}'::jsonb
  ) x;
$$;
revoke all on function public.ve_profile_admin_list() from public, anon, authenticated;

create or replace function public.ve_profile_admin_get(p_member uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select ve_profile_state(m.id) || jsonb_build_object(
    'member', jsonb_build_object('id', m.id, 'name', m.name, 'email', m.email, 'home_community', m.home_community, 've_role', m.ve_role,
      'membership_status', m.membership_status, 'entry_paid_at', m.entry_paid_at, 'created_at', m.created_at),
    'public', ve_profile_public(m.id))
  from members m where m.id = p_member;
$$;
revoke all on function public.ve_profile_admin_get(uuid) from public, anon, authenticated;

-- The playbook's Work Queue: phase 1 done (its items move to Completed), logged.
update public.briefings set
  content = replace(replace(replace(replace(content,
    '<details class="held" open><summary>Phase 1: the member''s switches and the team view <span class="grp-count">3</span></summary>',
    '<details class="held" open><summary>Phase 2 is next <span class="grp-count">0</span></summary><div class="body"><p class="empty-state">Phase 1 shipped October 28, 2026 (see Completed).</p></div></details>' || chr(10) || '    <details class="held" hidden><summary>Phase 1 <span class="grp-count">3</span></summary>'),
    '<button class="tab-btn" role="tab" aria-selected="true" data-tab="pending">Pending <span class="count">4</span></button>',
    '<button class="tab-btn" role="tab" aria-selected="true" data-tab="pending">Pending <span class="count">3</span></button>'),
    '<button class="tab-btn" role="tab" aria-selected="false" data-tab="done">Completed <span class="count">2</span></button>',
    '<button class="tab-btn" role="tab" aria-selected="false" data-tab="done">Completed <span class="count">3</span></button>'),
    '<li class="chk-item done"><span class="chk-box">&#10003;</span><span>Concept locked by Sean (October 28, 2026)</span></li>',
    '<li class="chk-item done"><span class="chk-box">&#10003;</span><span>Concept locked by Sean (October 28, 2026)</span></li>' || chr(10) ||
    '      <li class="chk-item done"><span class="chk-box">&#10003;</span><span>Phase 1 (October 28, 2026): Can be shown / Just for Vegans Explore on each answer, the team''s full view in Depot &gt; People &gt; Profiles, and the Policies page</span></li>'),
  status_summary = 'Phase 1 shipped October 28, 2026: the member''s switches, the team view and the Policies update. Phase 2, the event window, is next.',
  status_summary_updated_at = now(), updated_at = now()
where slug = 've-member-profiles-partner-windows' and content not like '%Phase 1 (October 28, 2026)%';

insert into public.playbook_records (slug, brand_slug, author, kind, source, body)
select 've-member-profiles-partner-windows', 'vegans-explore', 'Logan', 'edit', 'text',
  'Phase 1 shipped (Sean: "go ahead with phase 1"). Who can see this answer on every answer about the member (Can be shown / Just for Vegans Explore, members.profile_shown, ve_profile_switchable; team questions and the Instagram handle never shown), ve_profile_public as the only way a profile leaves the team, Depot > People > Profiles for the full team view, and the Policies page Privacy section. Migration 20261028_profile_visibility.sql.'
where not exists (select 1 from public.playbook_records where slug = 've-member-profiles-partner-windows' and body like 'Phase 1 shipped%');
