-- ve-pre-vegan-business-guide: the business badge intake (canon-ve-business-badges; Sean approved 2026-11-06, "approved", with Logan's three defaults:
-- Question 2's Vegan choice trimmed to "We run it for the animals."; Vegan + "Mostly" or "Not yet" on Question 3 shows 100% Plant-based for now and the
-- team follows up; about 20 points a question). docs/proposals/business-badges-intake.md.
-- 1. Questions can be skipped by an earlier answer: ve_survey_questions.show_if {"q": "<id>", "in": [values]}. A question the member's path skips is
--    not required and pays its points as if answered, so every path through an intake pays its full total.
-- 2. Four shared questions replace "How Vegan is what you run?" (vegan_level) in the Restaurant, Events and Pre-Vegan Business intakes. The old ids
--    e_vegan and r_vegan stay (now Question 1), so Depot > Event sponsors' Compare keeps reading them. Nobody had answered vegan_level.
-- 3. ve_business_badges: one row a member, the badge their answers set and what shows. 100% Vegan waits for our team (status checking) and shows
--    100% Plant-based meanwhile; Vegan + Mostly or Not yet shows 100% Plant-based with status follow_up. Changing back is at once, no penalty.
--    The badges on listings are the next step; nothing here draws one. Safe to run twice.

alter table public.ve_survey_questions add column if not exists show_if jsonb;

insert into public.ve_shared_questions (key, kind, prompt, help, options) values
 ('biz_all_plant', 'choice', 'Is everything you sell plant-based?', 'Your food, drinks and anything else you sell.',
  '[{"v":"yes","label":"Yes, everything"},{"v":"no","label":"No, we also sell some animal products"},{"v":"notyet","label":"Not yet, we are working toward it"}]'::jsonb),
 ('biz_word', 'choice', 'Which word fits your business best?', 'Both are respected. There is no wrong answer. Pick the one that is true for you.',
  '[{"v":"vegan","label":"Vegan. We run it for the animals."},{"v":"plant","label":"Plant-based. All our food is plants. That is our focus."}]'::jsonb),
 ('biz_beyond', 'choice', 'Do you keep animal products out beyond the plate?', 'For example: honey, sugar made with bone char, wine or beer filtered with animal products, leather, cleaning products.',
  '[{"v":"all","label":"Yes, all of it"},{"v":"mostly","label":"Mostly, we are still checking a few things"},{"v":"notyet","label":"Not yet"}]'::jsonb),
 ('biz_help', 'choice', 'Would you like help with your plant-based items?', null,
  '[{"v":"certify","label":"Yes, I want to hear about Pre-Vegan Certified for some items"},{"v":"add","label":"Yes, I want help adding plant-based items"},{"v":"not_now","label":"Not right now"}]'::jsonb)
on conflict (key) do update set kind = excluded.kind, prompt = excluded.prompt, help = excluded.help, options = excluded.options;

-- Place the four questions in an intake: Question 1 at p_pos (an existing question id is reused), 2 to 4 right after it.
create or replace function public.ve_badge_questions_place(p_survey text, p_q1 text, p_prefix text, p_pos int, p_pts int[]) returns void
language plpgsql set search_path = public as $$
begin
  if not exists (select 1 from ve_survey_questions where survey_slug = p_survey and id = p_prefix || '_word') then
    update ve_survey_questions set pos = pos + case when exists (select 1 from ve_survey_questions where survey_slug = p_survey and id = p_q1) then 3 else 4 end
     where survey_slug = p_survey and pos >= p_pos and id <> p_q1;
  end if;
  insert into ve_survey_questions (survey_slug, id, pos, kind, prompt, points, required, shared_key)
    values (p_survey, p_q1, p_pos, 'choice', 'x', p_pts[1], true, 'biz_all_plant')
    on conflict (survey_slug, id) do update set pos = excluded.pos, points = excluded.points, required = true, shared_key = 'biz_all_plant', show_if = null;
  insert into ve_survey_questions (survey_slug, id, pos, kind, prompt, points, required, shared_key, show_if) values
    (p_survey, p_prefix || '_word', p_pos + 1, 'choice', 'x', p_pts[2], true, 'biz_word', jsonb_build_object('q', p_q1, 'in', jsonb_build_array('yes'))),
    (p_survey, p_prefix || '_beyond', p_pos + 2, 'choice', 'x', p_pts[3], true, 'biz_beyond', jsonb_build_object('q', p_prefix || '_word', 'in', jsonb_build_array('vegan'))),
    (p_survey, p_prefix || '_bizhelp', p_pos + 3, 'choice', 'x', p_pts[4], false, 'biz_help', jsonb_build_object('q', p_q1, 'in', jsonb_build_array('no','notyet')))
  on conflict (survey_slug, id) do update set pos = excluded.pos, points = excluded.points, required = excluded.required, shared_key = excluded.shared_key, show_if = excluded.show_if;
end $$;

-- Restaurant (250): r_vegan becomes Question 1; 55 points come off eleven optional questions.
select public.ve_badge_questions_place('vegan-restaurant-guide', 'r_vegan', 'r', (select pos from public.ve_survey_questions where survey_slug = 'vegan-restaurant-guide' and id = 'r_vegan'), array[20,20,20,20]);
update public.ve_survey_questions q set points = v.p from (values ('r_link',5),('r_start',5),('r_try',5),('r_fun',5),('r_open',5),('r_who',5),('r_found',5),('r_site',5),('r_help',5),('r_pos',5),('r_recommend',3)) v(id,p)
 where q.survey_slug = 'vegan-restaurant-guide' and q.id = v.id;

-- Events (250): e_vegan becomes Question 1; 60 points come off the rest.
select public.ve_badge_questions_place('vegan-events-guide', 'e_vegan', 'e', (select pos from public.ve_survey_questions where survey_slug = 'vegan-events-guide' and id = 'e_vegan'), array[20,20,20,20]);
update public.ve_survey_questions q set points = v.p from (values ('e_role',15),('e_chapter',10),('e_kind',15),('e_count',15),('e_crowd',15),('e_link',5),('e_audience',20),('e_hard',15),('e_help',20),('e_next',15),('e_story',15)) v(id,p)
 where q.survey_slug = 'vegan-events-guide' and q.id = v.id;

-- Pre-Vegan Business (100): the four come first; they are 10, 5, 5, 5 here and the five required questions drop to 7.
select public.ve_badge_questions_place('pre-vegan-business-guide', 'pb_allplant', 'pb', 1, array[10,5,5,5]);
update public.ve_survey_questions q set points = 7 where q.survey_slug = 'pre-vegan-business-guide' and q.id in ('pb_kind','pb_role','pb_now','pb_add','pb_worry');

drop function public.ve_badge_questions_place(text, text, text, int, int[]);

do $$ declare r record; begin
  for r in select survey_slug, sum(points) t from public.ve_survey_questions where survey_slug in ('vegan-events-guide','vegan-restaurant-guide','pre-vegan-business-guide') group by 1 loop
    if r.t <> case r.survey_slug when 'pre-vegan-business-guide' then 100 else 250 end then raise exception '% totals %', r.survey_slug, r.t; end if;
  end loop;
end $$;

-- Each question's state for a member: shown, skipped (their path skips it) or waiting (the answer that decides it is not given yet).
-- An answer counts from this intake, else the member's shared answer.
create or replace function public.ve_survey_states(p_member uuid, p_survey text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare q record; st jsonb := '{}'::jsonb; ans jsonb; par text; pv jsonb;
begin
  select coalesce(jsonb_object_agg(x.id, x.value), '{}'::jsonb) into ans from (
    select q2.id, coalesce(a.value, m.value) value from ve_survey_questions q2
      left join ve_survey_answers a on a.member_id = p_member and a.survey_slug = p_survey and a.question_id = q2.id
      left join ve_member_shared_answers m on m.member_id = p_member and m.key = q2.shared_key
     where q2.survey_slug = p_survey and coalesce(a.value, m.value) is not null) x;
  for q in select id, show_if from ve_survey_questions where survey_slug = p_survey order by pos loop
    if q.show_if is null then st := st || jsonb_build_object(q.id, 'shown');
    else
      par := coalesce(st ->> (q.show_if ->> 'q'), 'shown'); pv := ans -> (q.show_if ->> 'q');
      if par <> 'shown' then st := st || jsonb_build_object(q.id, par);
      elsif pv is null then st := st || jsonb_build_object(q.id, 'waiting');
      elsif (q.show_if -> 'in') ? (pv #>> '{}') then st := st || jsonb_build_object(q.id, 'shown');
      else st := st || jsonb_build_object(q.id, 'skipped'); end if;
    end if;
  end loop;
  return st;
end $$;
revoke all on function public.ve_survey_states(uuid, text) from public, anon, authenticated;

-- The badge record.
create table if not exists public.ve_business_badges (
  member_id uuid primary key references public.members(id) on delete cascade,
  claimed text not null check (claimed in ('vegan','plant_based','pre_vegan')),
  shown text not null check (shown in ('vegan','plant_based','pre_vegan')),
  status text not null check (status in ('shown','checking','follow_up')),
  answers jsonb not null default '{}'::jsonb,
  approved_at timestamptz, approved_by uuid references public.members(id),
  team_note text,
  claimed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ve_business_badges enable row level security;
create index if not exists ve_business_badges_status on public.ve_business_badges (status, claimed_at);

create table if not exists public.ve_business_badge_events (
  id bigserial primary key,
  member_id uuid not null references public.members(id) on delete cascade,
  kind text not null,
  claimed text, shown text, status text, note text,
  by_member uuid references public.members(id),
  at timestamptz not null default now()
);
alter table public.ve_business_badge_events enable row level security;

-- Recompute a member's badge from their shared answers. Approval for 100% Vegan holds while their answers keep saying 100% Vegan.
create or replace function public.ve_business_badge_sync(p_member uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare a jsonb; v_all text; v_word text; v_beyond text; v_claim text; v_shown text; v_status text; old ve_business_badges;
begin
  select coalesce(jsonb_object_agg(key, value #>> '{}'), '{}'::jsonb) into a from ve_member_shared_answers
   where member_id = p_member and key in ('biz_all_plant','biz_word','biz_beyond','biz_help');
  v_all := a ->> 'biz_all_plant'; v_word := a ->> 'biz_word'; v_beyond := a ->> 'biz_beyond';
  if v_all in ('no','notyet') then v_claim := 'pre_vegan';
  elsif v_all = 'yes' and v_word = 'plant' then v_claim := 'plant_based';
  elsif v_all = 'yes' and v_word = 'vegan' and v_beyond = 'all' then v_claim := 'vegan';
  elsif v_all = 'yes' and v_word = 'vegan' and v_beyond in ('mostly','notyet') then v_claim := 'plant_based';
  else v_claim := null; end if;
  select * into old from ve_business_badges where member_id = p_member;
  if v_claim is null then return case when old.member_id is null then null else ve_business_badge_view(p_member) end; end if;

  if v_claim = 'vegan' then
    if old.approved_at is not null and old.claimed = 'vegan' then v_shown := 'vegan'; v_status := 'shown';
    else v_shown := 'plant_based'; v_status := 'checking'; end if;
  elsif v_claim = 'plant_based' and v_word = 'vegan' then v_shown := 'plant_based'; v_status := 'follow_up';
  else v_shown := v_claim; v_status := 'shown'; end if;

  insert into ve_business_badges (member_id, claimed, shown, status, answers)
    values (p_member, v_claim, v_shown, v_status, a)
  on conflict (member_id) do update set
    claimed = excluded.claimed, shown = excluded.shown, status = excluded.status, answers = excluded.answers,
    approved_at = case when excluded.claimed = 'vegan' and ve_business_badges.claimed = 'vegan' then ve_business_badges.approved_at end,
    approved_by = case when excluded.claimed = 'vegan' and ve_business_badges.claimed = 'vegan' then ve_business_badges.approved_by end,
    claimed_at = case when excluded.claimed is distinct from ve_business_badges.claimed then now() else ve_business_badges.claimed_at end,
    updated_at = now();
  if old.member_id is null or old.claimed is distinct from v_claim or old.status is distinct from v_status then
    insert into ve_business_badge_events (member_id, kind, claimed, shown, status) values (p_member, 'answers', v_claim, v_shown, v_status);
  end if;
  return ve_business_badge_view(p_member);
end $$;
revoke all on function public.ve_business_badge_sync(uuid) from public, anon, authenticated;

create or replace function public.ve_business_badge_view(p_member uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('claimed', b.claimed, 'shown', b.shown, 'status', b.status, 'approved', b.approved_at is not null, 'claimed_at', b.claimed_at)
  from ve_business_badges b where b.member_id = p_member;
$$;
revoke all on function public.ve_business_badge_view(uuid) from public, anon, authenticated;

create or replace function public.ve_business_badge_trg() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(new.key, old.key) in ('biz_all_plant','biz_word','biz_beyond','biz_help') then perform ve_business_badge_sync(coalesce(new.member_id, old.member_id)); end if;
  return null;
end $$;
drop trigger if exists trg_ve_business_badge on public.ve_member_shared_answers;
create trigger trg_ve_business_badge after insert or update or delete on public.ve_member_shared_answers
  for each row execute function public.ve_business_badge_trg();

-- The team's decision: approve 100% Vegan, or ask to follow up (it keeps showing 100% Plant-based). Service role only; the caller is a super admin.
create or replace function public.ve_business_badge_decide(p_member uuid, p_admin uuid, p_decision text, p_note text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare b ve_business_badges; v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not exists (select 1 from members where id = p_admin and is_superadmin) then return jsonb_build_object('error', 'forbidden'); end if;
  select * into b from ve_business_badges where member_id = p_member for update;
  if not found then return jsonb_build_object('error', 'not_found'); end if;
  if p_decision = 'approve' then
    if b.claimed <> 'vegan' then return jsonb_build_object('error', 'not_a_vegan_claim'); end if;
    if b.approved_at is not null then return jsonb_build_object('error', 'already_approved'); end if;
    update ve_business_badges set shown = 'vegan', status = 'shown', approved_at = now(), approved_by = p_admin,
      team_note = coalesce(v_note, team_note), updated_at = now() where member_id = p_member;
  elsif p_decision = 'follow_up' then
    if v_note is null then return jsonb_build_object('error', 'note_needed'); end if;
    if b.claimed <> 'vegan' or b.approved_at is not null then return jsonb_build_object('error', 'not_waiting'); end if;
    update ve_business_badges set status = 'follow_up', shown = 'plant_based', team_note = v_note, updated_at = now() where member_id = p_member;
  elsif p_decision = 'note' then
    if v_note is null then return jsonb_build_object('error', 'note_needed'); end if;
    update ve_business_badges set team_note = v_note, updated_at = now() where member_id = p_member;
  else return jsonb_build_object('error', 'bad_decision'); end if;
  insert into ve_business_badge_events (member_id, kind, claimed, shown, status, note, by_member)
    select member_id, p_decision, claimed, shown, status, v_note, p_admin from ve_business_badges where member_id = p_member;
  return jsonb_build_object('ok', true, 'badge', ve_business_badge_view(p_member));
end $$;
revoke all on function public.ve_business_badge_decide(uuid, uuid, text, text) from public, anon, authenticated;

-- ve_survey_get: each question's show_if and state, the member's badge, and earned counting skipped questions (they pay as answered).
create or replace function public.ve_survey_get(p_survey text, p_member uuid)
 returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
declare s ve_surveys; st jsonb := '{}'::jsonb;
begin
  select * into s from ve_surveys where slug = p_survey and active;
  if not found then return null; end if;
  if p_member is not null then st := ve_survey_states(p_member, p_survey); end if;
  return jsonb_build_object(
    'slug', s.slug, 'title', s.title, 'intro', s.intro, 'guide_slug', s.guide_slug, 'admits', s.admits,
    'questions', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'kind', q.kind, 'prompt', q.prompt, 'help', q.help,
        'options', q.options, 'points', q.points, 'required', q.required, 'shared', q.shared_key, 'show_if', q.show_if, 'state', coalesce(st ->> q.id, 'shown')) order by q.pos)
        from ve_survey_questions q where q.survey_slug = s.slug), '[]'::jsonb),
    'total', coalesce((select sum(points) from ve_survey_questions q where q.survey_slug = s.slug), 0),
    'answers', coalesce((select jsonb_object_agg(a.question_id, a.value) from ve_survey_answers a where a.member_id = p_member and a.survey_slug = s.slug), '{}'::jsonb),
    'carried', case when p_member is null then '{}'::jsonb else ve_survey_carried(p_member, s.slug) end,
    'earned', coalesce((select sum(q.points) from ve_survey_questions q where q.survey_slug = s.slug and (st ->> q.id = 'skipped'
                        or exists (select 1 from ve_survey_answers a where a.member_id = p_member and a.survey_slug = s.slug and a.question_id = q.id))), 0),
    'completed', exists (select 1 from ve_survey_completions c where c.member_id = p_member and c.survey_slug = s.slug),
    'badge', case when p_member is null then null else ve_business_badge_view(p_member) end);
end $function$;

-- ve_survey_answer: as before, plus skipped questions pay their points and are never required, and the badge comes back.
create or replace function public.ve_survey_answer(p_member uuid, p_survey text, p_question text, p_value jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  s ve_surveys; q ve_survey_questions; m record; c record;
  v jsonb := p_value; v_empty boolean; v_text text; v_grant jsonb := null; v_admitted boolean := false; v_done boolean; v_missing int;
  v_hold boolean := false; v_review text := null; v_states jsonb; v_badge_before jsonb; v_badge jsonb;
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
    v_hold := s.reviewed;
    if v_hold and m.survey_review = 'pending' then return jsonb_build_object('error', 'under_review'); end if;
    if m.survey_door_at is null then update members set survey_door_at = now() where id = p_member; end if;
  end if;
  v_badge_before := ve_business_badge_view(p_member);

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
    if q.shared_key is not null then
      insert into ve_member_shared_answers (member_id, key, value, survey_slug) values (p_member, q.shared_key, v, p_survey)
      on conflict (member_id, key) do update set value = excluded.value, survey_slug = excluded.survey_slug, updated_at = now();
      update ve_survey_answers a set value = v, updated_at = now()
        from ve_survey_questions oq
        where oq.shared_key = q.shared_key and a.survey_slug = oq.survey_slug and a.question_id = oq.id
          and a.member_id = p_member and not (a.survey_slug = p_survey and a.question_id = p_question);
    end if;
  end if;

  for c in select q2.id, q2.points, ms.value from ve_survey_questions q2
             join ve_member_shared_answers ms on ms.member_id = p_member and ms.key = q2.shared_key
            where q2.survey_slug = p_survey
              and not exists (select 1 from ve_survey_answers a where a.member_id = p_member and a.survey_slug = p_survey and a.question_id = q2.id)
  loop
    insert into ve_survey_answers (member_id, survey_slug, question_id, value) values (p_member, p_survey, c.id, c.value) on conflict do nothing;
    if c.points > 0 and not v_hold then perform ve_points_grant(p_member, c.points, 'survey_answer', 'survey:' || p_survey || ':' || c.id); end if;
  end loop;

  -- A question the member's path skips pays as answered (once, the same reference), so every path pays the intake's full total.
  v_states := ve_survey_states(p_member, p_survey);
  if not v_hold then
    for c in select q3.id, q3.points from ve_survey_questions q3 where q3.survey_slug = p_survey and q3.points > 0 and v_states ->> q3.id = 'skipped' loop
      perform ve_points_grant(p_member, c.points, 'survey_answer', 'survey:' || p_survey || ':' || c.id);
    end loop;
  end if;

  select count(*) into v_missing from ve_survey_questions sq
    where sq.survey_slug = p_survey and sq.required and coalesce(v_states ->> sq.id, 'shown') <> 'skipped'
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
  v_badge := ve_business_badge_view(p_member);
  return jsonb_build_object('ok', true, 'question', p_question, 'points', q.points,
    'paid_now', coalesce((v_grant ->> 'granted')::boolean, false), 'completed', v_done, 'admitted', v_admitted, 'missing', v_missing, 'review', v_review,
    'states', v_states, 'badge', v_badge,
    'badge_changed', v_badge is not null and (v_badge_before is null or v_badge_before ->> 'claimed' is distinct from v_badge ->> 'claimed' or v_badge_before ->> 'status' is distinct from v_badge ->> 'status'));
end $function$;

-- vegan_level is no longer asked anywhere. Its row stays so history reads.
