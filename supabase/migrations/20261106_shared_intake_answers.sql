-- ve-events-guide / ve-pathways: step 3 of the membership rule (canon-ve-door-guides v6, shared_answers). A question shared across
-- Guide intakes is asked once: its wording and choices live in ve_shared_questions, an intake question points to it with shared_key, the
-- member's answer is kept once in ve_member_shared_answers, and the newest answer wins in every intake. Opening a new intake shows the
-- shared answers already given ("carried"); the first answer saved there writes them into that intake and pays their points, so each
-- intake still pays its full 250. No intake question is tagged here: tagging waits for Sean's OK on the wording. Safe to run twice.

create table if not exists public.ve_shared_questions (
  key text primary key,
  kind text not null check (kind in ('choice','multi','text','long')),
  prompt text not null,
  help text,
  options jsonb,
  created_at timestamptz not null default now()
);
alter table public.ve_shared_questions enable row level security;

create table if not exists public.ve_member_shared_answers (
  member_id uuid not null references public.members(id) on delete cascade,
  key text not null references public.ve_shared_questions(key),
  value jsonb not null,
  survey_slug text,
  updated_at timestamptz not null default now(),
  primary key (member_id, key)
);
alter table public.ve_member_shared_answers enable row level security;

alter table public.ve_survey_questions add column if not exists shared_key text references public.ve_shared_questions(key);

-- A tagged question always carries the bank's wording and choices, so every intake asks it the same way.
create or replace function public.ve_survey_question_shared_sync() returns trigger language plpgsql set search_path = public as $$
declare b ve_shared_questions;
begin
  if new.shared_key is not null then
    select * into b from ve_shared_questions where key = new.shared_key;
    new.kind := b.kind; new.prompt := b.prompt; new.help := b.help; new.options := b.options;
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_survey_question_shared on public.ve_survey_questions;
create trigger trg_ve_survey_question_shared before insert or update on public.ve_survey_questions
  for each row execute function public.ve_survey_question_shared_sync();

-- A wording change in the bank reaches every intake that asks it.
create or replace function public.ve_shared_question_push() returns trigger language plpgsql set search_path = public as $$
begin
  update ve_survey_questions set shared_key = shared_key where shared_key = new.key;
  return new;
end $$;
drop trigger if exists trg_ve_shared_question_push on public.ve_shared_questions;
create trigger trg_ve_shared_question_push after update on public.ve_shared_questions
  for each row execute function public.ve_shared_question_push();

-- The intake's questions with a shared answer the member gave elsewhere and no answer here yet.
create or replace function public.ve_survey_carried(p_member uuid, p_survey text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_object_agg(q.id, jsonb_build_object('value', m.value, 'from', m.survey_slug, 'at', m.updated_at)), '{}'::jsonb)
  from ve_survey_questions q
  join ve_member_shared_answers m on m.member_id = p_member and m.key = q.shared_key
  where q.survey_slug = p_survey
    and not exists (select 1 from ve_survey_answers a where a.member_id = p_member and a.survey_slug = p_survey and a.question_id = q.id);
$$;
revoke all on function public.ve_survey_carried(uuid, text) from public, anon, authenticated;

create or replace function public.ve_survey_get(p_survey text, p_member uuid)
 returns jsonb language sql stable security definer set search_path to 'public' as $function$
  select case when s.slug is null then null else jsonb_build_object(
    'slug', s.slug, 'title', s.title, 'intro', s.intro, 'guide_slug', s.guide_slug, 'admits', s.admits,
    'questions', coalesce((select jsonb_agg(jsonb_build_object('id', q.id, 'kind', q.kind, 'prompt', q.prompt, 'help', q.help,
        'options', q.options, 'points', q.points, 'required', q.required, 'shared', q.shared_key) order by q.pos) from ve_survey_questions q where q.survey_slug = s.slug), '[]'::jsonb),
    'total', coalesce((select sum(points) from ve_survey_questions q where q.survey_slug = s.slug), 0),
    'answers', coalesce((select jsonb_object_agg(a.question_id, a.value) from ve_survey_answers a where a.member_id = p_member and a.survey_slug = s.slug), '{}'::jsonb),
    'carried', case when p_member is null then '{}'::jsonb else ve_survey_carried(p_member, s.slug) end,
    'earned', coalesce((select sum(q.points) from ve_survey_answers a join ve_survey_questions q on q.survey_slug = a.survey_slug and q.id = a.question_id
                        where a.member_id = p_member and a.survey_slug = s.slug), 0),
    'completed', exists (select 1 from ve_survey_completions c where c.member_id = p_member and c.survey_slug = s.slug)) end
  from (select 1) x left join ve_surveys s on s.slug = p_survey and s.active;
$function$;

create or replace function public.ve_survey_answer(p_member uuid, p_survey text, p_question text, p_value jsonb)
 returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare
  s ve_surveys; q ve_survey_questions; m record; c record;
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

  -- Carry in the shared answers given elsewhere, paying their points here, so this intake counts and pays in full.
  for c in select q2.id, q2.points, ms.value from ve_survey_questions q2
             join ve_member_shared_answers ms on ms.member_id = p_member and ms.key = q2.shared_key
            where q2.survey_slug = p_survey
              and not exists (select 1 from ve_survey_answers a where a.member_id = p_member and a.survey_slug = p_survey and a.question_id = q2.id)
  loop
    insert into ve_survey_answers (member_id, survey_slug, question_id, value) values (p_member, p_survey, c.id, c.value) on conflict do nothing;
    if c.points > 0 then perform ve_points_grant(p_member, c.points, 'survey_answer', 'survey:' || p_survey || ':' || c.id); end if;
  end loop;

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
end $function$;
