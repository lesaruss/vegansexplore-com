-- Guide answers: a free knowledge base in front of the Guides (Sean, 2026-10-06).
--
-- "Make it more like a chat bot where it's essentially a knowledge base... train it with as many
-- questions as possible... once it has it, it should immediately pick up and pull into a database of
-- potential questions and answers... not paying out of pocket for anything."
--
-- How it works:
--   guide_kb_answers    the answers. Live ones are served free (no AI, no tokens, no points).
--                       Drafts come from Guide replies and from Logan; needs_sean rows are questions
--                       only Sean can answer, saved for a session with him.
--   guide_kb_questions  every question asked, what it matched, and what happened (answered free,
--                       sent to the AI Guide, no match). Unanswered questions are the to-do list.
--   guide_kb_gaps       the to-do list: unanswered questions grouped, most asked first.
--   guide_kb_match()    Postgres text search plus trigram similarity. Zero tokens.
-- ve-auth `guide_ask` answers from here first; `guide_chat_send` (the AI Guide, 4 points) is the
-- member's choice when there is no saved answer, and its reply is saved here as a draft.
-- Brand-ready: brand_slug lets LESARUSS AI and the other brands reuse the same tables.

create extension if not exists pg_trgm;

create or replace function public.guide_kb_doc(p_question text, p_also text[], p_topic text)
returns tsvector language sql immutable as $$
  select setweight(to_tsvector('english', coalesce(p_question, '')), 'A')
      || setweight(to_tsvector('english', coalesce(array_to_string(p_also, ' '), '')), 'B')
      || setweight(to_tsvector('english', coalesce(p_topic, '')), 'D')
$$;

create table if not exists public.guide_kb_answers (
  id uuid primary key default gen_random_uuid(),
  brand_slug text not null default 'vegans-explore',
  topic text,
  question text not null,
  also_asked text[] not null default '{}',
  answer text,
  link_url text,
  link_label text,
  status text not null default 'draft' check (status in ('live', 'draft', 'needs_sean', 'retired')),
  source text not null default 'logan' check (source in ('logan', 'sean', 'guide', 'member')),
  featured boolean not null default false,
  sort_order integer not null default 100,
  times_served integer not null default 0,
  last_served_at timestamptz,
  notes text,
  question_key text generated always as (lower(regexp_replace(btrim(question), '\s+', ' ', 'g'))) stored,
  search tsvector generated always as (public.guide_kb_doc(question, also_asked, topic)) stored,
  created_by text,
  updated_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_slug, question_key)
);
create index if not exists guide_kb_answers_search on public.guide_kb_answers using gin (search);
create index if not exists guide_kb_answers_q_trgm on public.guide_kb_answers using gin (lower(question) gin_trgm_ops);
alter table public.guide_kb_answers enable row level security;

create table if not exists public.guide_kb_questions (
  id uuid primary key default gen_random_uuid(),
  brand_slug text not null default 'vegans-explore',
  member_id uuid,
  guide_slug text,
  question text not null,
  question_key text generated always as (lower(regexp_replace(btrim(question), '\s+', ' ', 'g'))) stored,
  matched_answer_id uuid references public.guide_kb_answers(id) on delete set null,
  score real,
  outcome text not null check (outcome in ('answered', 'no_match', 'sent_to_guide', 'guide_failed')),
  reply text,
  created_at timestamptz not null default now()
);
create index if not exists guide_kb_questions_key on public.guide_kb_questions (brand_slug, question_key);
create index if not exists guide_kb_questions_created on public.guide_kb_questions (created_at desc);
alter table public.guide_kb_questions enable row level security;

-- Best matches for a question, highest score first. Score 0 to 1: 60% trigram similarity to the
-- question or its closest paraphrase, 40% the share of the question's words the answer covers. The
-- brand name and the word Vegan are left out of the word share because they are in half of everything
-- (tuned live 2026-10-06: one shared word like "dinner" or "vegan" no longer answers a question).
create or replace function public.guide_kb_match(p_brand text, p_question text, p_limit integer default 4)
returns table (id uuid, question text, answer text, link_url text, link_label text, score real)
language sql stable set search_path = public as $$
  with q as (
    select lower(regexp_replace(p_question, 'vegans?\s+explore', ' ', 'gi')) as qt
  ), ql as (
    select q.qt, array(select l from unnest(tsvector_to_array(to_tsvector('english', q.qt))) l where l not in ('vegan', 'vegans')) as lex
    from q
  )
  select a.id, a.question, a.answer, a.link_url, a.link_label,
         (0.6 * greatest(similarity(ql.qt, lower(a.question)),
                         coalesce((select max(similarity(ql.qt, lower(x))) from unnest(a.also_asked) x), 0))
          + 0.4 * case when cardinality(ql.lex) = 0 then 0
                       else (select count(*) from unnest(ql.lex) l where l = any(tsvector_to_array(a.search)))::real / cardinality(ql.lex) end)::real as score
  from public.guide_kb_answers a, ql
  where a.brand_slug = p_brand and a.status = 'live'
  order by score desc
  limit greatest(1, least(p_limit, 10))
$$;

create or replace function public.guide_kb_served(p_id uuid)
returns void language sql set search_path = public as $$
  update public.guide_kb_answers set times_served = times_served + 1, last_served_at = now() where id = p_id
$$;

-- The to-do list: questions without a saved answer, most asked first, with the latest AI Guide reply
-- (a starting point for the saved answer) when a member asked their Guide.
create or replace view public.guide_kb_gaps as
  select q.brand_slug, q.question_key,
         (array_agg(q.question order by q.created_at desc))[1] as question,
         count(*) as times_asked,
         count(distinct q.member_id) as members,
         max(q.created_at) as last_asked,
         (array_agg(q.reply order by q.created_at desc) filter (where q.reply is not null))[1] as latest_guide_reply
  from public.guide_kb_questions q
  where q.outcome <> 'answered'
    and not exists (select 1 from public.guide_kb_answers a
                    where a.brand_slug = q.brand_slug and a.question_key = q.question_key and a.status = 'live')
  group by q.brand_slug, q.question_key
  order by count(*) desc, max(q.created_at) desc;

revoke all on public.guide_kb_answers, public.guide_kb_questions, public.guide_kb_gaps from anon, authenticated;
revoke execute on function public.guide_kb_match(text, text, integer), public.guide_kb_served(uuid) from public, anon, authenticated;
