-- Search questions queue (Sean, 2026-11-03: "when we don't have a result... every question you ask helps us make this knowledge base better...
-- our team is going to work on getting the answers... send you a notification... use this as an editorial tool"). One row a question
-- (normalized words), every asker kept so each is told when it is answered. RLS on, no policies: only the edge function and the Depot read it.
create table if not exists public.ve_search_questions (
  id uuid primary key default gen_random_uuid(),
  brand text not null default 'vegans-explore',
  q_key text not null,
  q text not null,
  status text not null default 'open' check (status in ('open','working','answered','set_aside')),
  asked_count int not null default 0,
  first_asked_at timestamptz not null default now(),
  last_asked_at timestamptz not null default now(),
  guide_slug text,            -- editorial: the Guide this belongs in (a fashion article, etc.)
  note text,
  answer_text text,
  answer_url text,
  answered_at timestamptz,
  answered_by uuid,
  unique (brand, q_key)
);
create table if not exists public.ve_search_question_askers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.ve_search_questions(id) on delete cascade,
  email text,
  member_id uuid,
  visitor text,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);
create unique index if not exists ve_sq_askers_email on public.ve_search_question_askers (question_id, lower(email)) where email is not null;
create unique index if not exists ve_sq_askers_visitor on public.ve_search_question_askers (question_id, visitor) where visitor is not null and email is null;
alter table public.ve_search_questions enable row level security;
alter table public.ve_search_question_askers enable row level security;

create or replace function public.ve_search_q_key(p text) returns text language sql immutable as $$
  select trim(regexp_replace(lower(coalesce(p,'')), '[^a-z0-9 ]+', ' ', 'g'))
$$;

-- p_email optional: only used to write back the answer. Returns the question and how many have asked it.
create or replace function public.ve_search_ask(p_q text, p_email text default null, p_visitor text default null, p_brand text default 'vegans-explore')
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_key text := ve_search_q_key(left(p_q,120)); v_id uuid; v_n int; v_new boolean := false; v_email text := nullif(lower(trim(coalesce(p_email,''))),'');
begin
  if length(v_key) < 2 then return jsonb_build_object('ok', false); end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return jsonb_build_object('ok', false, 'error', 'bad_email'); end if;
  insert into ve_search_questions (brand, q_key, q) values (p_brand, v_key, left(trim(p_q),120))
    on conflict (brand, q_key) do update set last_asked_at = now() returning id into v_id;
  -- a visitor or an email counts once per question
  begin
    if v_email is not null then
      insert into ve_search_question_askers (question_id, email, visitor) values (v_id, v_email, left(p_visitor,40))
        on conflict (question_id, lower(email)) where email is not null do nothing;
      delete from ve_search_question_askers where question_id = v_id and email is null and visitor = left(p_visitor,40) and p_visitor is not null;
    elsif p_visitor is not null then
      if not exists (select 1 from ve_search_question_askers where question_id = v_id and visitor = left(p_visitor,40)) then
        insert into ve_search_question_askers (question_id, visitor) values (v_id, left(p_visitor,40)) on conflict do nothing;
      end if;
    end if;
  exception when others then null; end;
  select count(*) into v_n from ve_search_question_askers where question_id = v_id;
  update ve_search_questions set asked_count = greatest(v_n,1) where id = v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'asked', greatest(v_n,1));
end $$;
revoke all on function public.ve_search_ask(text,text,text,text) from public, anon, authenticated;
