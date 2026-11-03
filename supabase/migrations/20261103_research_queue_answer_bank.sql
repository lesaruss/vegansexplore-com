-- Unanswered-question queue, answer bank checks and question panels (Sean, 2026-11-03: "go" on item 1, playbook ve-universal-search).
-- A question the box or a Guide could not answer lands in ve_research_queue; a person (Logan, Sean) researches it, writes an answer as a
-- draft in guide_kb_answers (origin 'research'), a check is recorded, and only then it goes live with an expiry (90 days, 30 for stock
-- and hours). guide_kb_match() reads live, unexpired answers only. Panels (ve_panel_*) run a set of questions through the whole engine
-- and keep what came back, so a person can score them before anything goes live. RLS on every table, no policies: everything goes
-- through the ve-research edge function (service role).

-- ---- the answer bank: where an answer came from, whether it was checked, when it stops being true ----
alter table public.guide_kb_answers
  add column if not exists origin text not null default 'legacy' check (origin in ('legacy', 'research')),
  add column if not exists kind text not null default 'evergreen' check (kind in ('evergreen', 'stock_hours')),
  add column if not exists expires_at timestamptz,
  add column if not exists checked_at timestamptz,
  add column if not exists checked_by text,
  add column if not exists evidence jsonb not null default '[]'::jsonb;

-- The matcher leaves out an answer whose time has run out. Everything else is as it was.
create or replace function public.guide_kb_match(p_brand text, p_question text, p_limit integer default 4)
returns table(id uuid, question text, answer text, link_url text, link_label text, score real)
language sql stable
set search_path to 'public'
as $function$
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
    and (a.expires_at is null or a.expires_at > now())
  order by score desc
  limit greatest(1, least(p_limit, 10))
$function$;

-- The check before live, kept in the database so no path can skip it: a research answer goes live only when it was checked, has
-- evidence and an expiry; changing a live research answer's words puts it back to a draft that needs a new check.
create or replace function public.ve_kb_guard() returns trigger language plpgsql as $$
begin
  if new.origin = 'research' then
    if tg_op = 'UPDATE' and old.status = 'live' and new.status = 'live' and new.answer is distinct from old.answer then
      new.status := 'draft'; new.checked_at := null; new.checked_by := null; new.expires_at := null;
    end if;
    if new.status = 'live' then
      if new.checked_at is null or coalesce(new.checked_by, '') = '' then raise exception 'not_checked'; end if;
      if jsonb_typeof(new.evidence) <> 'array' or jsonb_array_length(new.evidence) = 0 then raise exception 'no_evidence'; end if;
      if length(btrim(coalesce(new.answer, ''))) < 20 then raise exception 'answer_too_short'; end if;
      if new.expires_at is null then raise exception 'no_expiry'; end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_ve_kb_guard on public.guide_kb_answers;
create trigger trg_ve_kb_guard before insert or update on public.guide_kb_answers for each row execute function public.ve_kb_guard();

-- ---- the research queue ----
create or replace function public.ve_research_key(p text) returns text language sql immutable
as $$ select lower(regexp_replace(btrim(coalesce(p, '')), '\s+', ' ', 'g')) $$;

create table if not exists public.ve_research_queue (
  id uuid primary key default gen_random_uuid(),
  brand_slug text not null default 'vegans-explore',
  question text not null,
  question_key text not null,
  source text not null check (source in ('search_box', 'search_log', 'guide', 'panel', 'expiry', 'team')),
  asks integer not null default 1,
  visitors integer not null default 0,
  first_asked timestamptz not null default now(),
  last_asked timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'researching', 'drafted', 'needs_sean', 'answered', 'set_aside')),
  kb_answer_id uuid references public.guide_kb_answers(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (brand_slug, question_key)
);
create index if not exists ve_research_queue_status on public.ve_research_queue (status, asks desc, last_asked desc);
alter table public.ve_research_queue enable row level security;

create table if not exists public.ve_research_asks (
  id bigserial primary key,
  queue_id uuid not null references public.ve_research_queue(id) on delete cascade,
  visitor text not null,
  at timestamptz not null default now()
);
create index if not exists ve_research_asks_visitor on public.ve_research_asks (visitor, at desc);
alter table public.ve_research_asks enable row level security;

-- "Send it to our team": the search box and the results page call this through ve-research. Five a visitor a day; a question the bank
-- already answers is answered instead of queued; search operators, links and emails are not questions.
create or replace function public.ve_research_capture(p_brand text, p_question text, p_source text, p_visitor text)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare q text; v text; n int; qid uuid; m record; src text;
begin
  if coalesce(p_brand, 'vegans-explore') <> 'vegans-explore' then return jsonb_build_object('ok', false, 'error', 'bad_brand'); end if;
  q := left(btrim(regexp_replace(coalesce(p_question, ''), '\s+', ' ', 'g')), 300);
  if length(q) < 4 then return jsonb_build_object('ok', false, 'error', 'bad_question'); end if;
  if q ~* '(https?://|www\.|@[a-z0-9.-]+\.[a-z]{2,}|\*\s*\*|"\s*\(|\bor\b\s+"|site:)' then return jsonb_build_object('ok', false, 'error', 'not_a_question'); end if;
  src := case when p_source in ('search_box', 'team') then p_source else 'search_box' end;
  v := left(coalesce(p_visitor, ''), 40);
  if v <> '' then
    select count(*) into n from ve_research_asks where visitor = v and at > now() - interval '24 hours';
    if n >= 5 then return jsonb_build_object('ok', false, 'error', 'limit'); end if;
  end if;
  select * into m from guide_kb_match('vegans-explore', q, 1) where score >= 0.42 and answer is not null;
  if found then return jsonb_build_object('ok', true, 'answered', true, 'answer', m.answer, 'link_url', m.link_url, 'link_label', m.link_label); end if;
  insert into ve_research_queue (brand_slug, question, question_key, source)
  values ('vegans-explore', q, ve_research_key(q), src)
  on conflict (brand_slug, question_key) do update
    set asks = ve_research_queue.asks + 1, last_asked = now(), updated_at = now(),
        status = case when ve_research_queue.status = 'answered' then 'new' else ve_research_queue.status end
  returning id into qid;
  if v <> '' then
    insert into ve_research_asks (queue_id, visitor) values (qid, v);
    update ve_research_queue set visitors = (select count(distinct visitor) from ve_research_asks where queue_id = qid) where id = qid;
  end if;
  return jsonb_build_object('ok', true, 'queued', true);
end $$;

-- What people looked for and got nothing, and what Guides could not answer, joins the queue by itself.
create or replace function public.ve_research_sync() returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare a int; b int;
begin
  with zero as (
    select l.brand, l.q, l.at, l.visitor
    from ve_search_log l
    where l.zero and length(btrim(l.q)) >= 4 and l.brand = 'vegans-explore'
      and l.q !~* '(https?://|www\.|@[a-z0-9.-]+\.[a-z]{2,}|\*\s*\*|"\s*\(|site:)'
      and not exists (select 1 from guide_kb_match(l.brand, l.q, 1) m where m.score >= 0.42 and m.answer is not null)
  ), grp as (
    select brand, (array_agg(q order by at desc))[1] as question, ve_research_key(q) as k, count(*)::int as asks,
           count(distinct visitor)::int as vis, min(at) as first_at, max(at) as last_at
    from zero group by brand, ve_research_key(q)
  ), ins as (
    insert into ve_research_queue (brand_slug, question, question_key, source, asks, visitors, first_asked, last_asked)
    select brand, question, k, 'search_log', asks, vis, first_at, last_at from grp
    on conflict (brand_slug, question_key) do update
      set asks = greatest(ve_research_queue.asks, excluded.asks), visitors = greatest(ve_research_queue.visitors, excluded.visitors),
          last_asked = greatest(ve_research_queue.last_asked, excluded.last_asked), updated_at = now()
    returning 1
  ) select count(*) into a from ins;
  with ins as (
    insert into ve_research_queue (brand_slug, question, question_key, source, asks, visitors, first_asked, last_asked)
    select g.brand_slug, g.question, ve_research_key(g.question), 'guide', g.times_asked::int, g.members::int, g.last_asked, g.last_asked
    from guide_kb_gaps g where g.brand_slug = 'vegans-explore' and length(btrim(g.question)) >= 4
    on conflict (brand_slug, question_key) do update
      set asks = greatest(ve_research_queue.asks, excluded.asks), visitors = greatest(ve_research_queue.visitors, excluded.visitors),
          last_asked = greatest(ve_research_queue.last_asked, excluded.last_asked), updated_at = now()
    returning 1
  ) select count(*) into b from ins;
  return jsonb_build_object('from_search_log', a, 'from_guides', b);
end $$;

-- Answers run out: 90 days, 30 for stock and hours. An expired one is retired and its question is back in the queue.
create or replace function public.ve_kb_expire() returns integer language plpgsql security definer set search_path to 'public'
as $$
declare n int;
begin
  with x as (
    update guide_kb_answers set status = 'retired', updated_by = 'expiry',
      notes = coalesce(notes || E'\n', '') || 'Expired ' || to_char(now() at time zone 'America/New_York', 'YYYY-MM-DD') || '. Needs a fresh check.'
    where origin = 'research' and status = 'live' and expires_at is not null and expires_at <= now()
    returning id, brand_slug, question
  ), q as (
    insert into ve_research_queue (brand_slug, question, question_key, source, kb_answer_id, note)
    select brand_slug, question, ve_research_key(question), 'expiry', id, 'The answer expired. Check it again.' from x
    on conflict (brand_slug, question_key) do update set status = 'new', kb_answer_id = excluded.kb_answer_id, note = excluded.note, updated_at = now()
    returning 1
  ) select count(*) into n from q;
  return coalesce(n, 0);
end $$;

-- Draft to live, through the check. The trigger above is the backstop.
create or replace function public.ve_kb_publish(p_answer uuid, p_by text) returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare a guide_kb_answers%rowtype; days int;
begin
  select * into a from guide_kb_answers where id = p_answer for update;
  if not found then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  if a.origin <> 'research' then return jsonb_build_object('ok', false, 'error', 'not_research'); end if;
  if a.status not in ('draft', 'needs_sean') then return jsonb_build_object('ok', false, 'error', 'not_draft'); end if;
  if a.checked_at is null then return jsonb_build_object('ok', false, 'error', 'not_checked'); end if;
  days := case when a.kind = 'stock_hours' then 30 else 90 end;
  update guide_kb_answers set status = 'live', expires_at = now() + make_interval(days => days), updated_by = p_by where id = p_answer;
  update ve_research_queue set status = 'answered', updated_at = now() where kb_answer_id = p_answer;
  return jsonb_build_object('ok', true, 'expires_at', (select expires_at from guide_kb_answers where id = p_answer), 'days', days);
exception when others then
  return jsonb_build_object('ok', false, 'error', sqlerrm);
end $$;

-- ---- panels: a set of questions run through the whole engine, kept, scored by a person before anything goes live ----
create table if not exists public.ve_panel_runs (
  id uuid primary key default gen_random_uuid(),
  brand_slug text not null default 'vegans-explore',
  name text not null,
  note text,
  status text not null default 'draft' check (status in ('draft', 'run', 'judged')),
  created_by text,
  created_at timestamptz not null default now(),
  run_at timestamptz,
  judged_at timestamptz
);
alter table public.ve_panel_runs enable row level security;

create table if not exists public.ve_panel_questions (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.ve_panel_runs(id) on delete cascade,
  n integer not null,
  question text not null,
  category text not null,
  origin text not null check (origin in ('gsc', 'search_log', 'guide', 'logan')),
  expect text,
  engine jsonb,
  coverage text check (coverage in ('store', 'bank', 'content', 'listing', 'none')),
  top_label text,
  verdict text check (verdict in ('pass', 'partial', 'fail')),
  judge_note text,
  judged_by text,
  unique (run_id, n)
);
alter table public.ve_panel_questions enable row level security;

-- Runs questions n_from..n_to through the box's own engine (listings, content, store, the answer bank) and keeps a compact picture of
-- what came back. coverage follows the box's own ordering: a store answer, then a banked answer, then content for a topic question,
-- then the Directory.
create or replace function public.ve_panel_run(p_run uuid, p_from integer default 1, p_to integer default 1000)
returns jsonb language plpgsql security definer set search_path to 'public'
as $$
declare r record; brand text; l jsonb; c jsonb; s jsonb; k record; cov text; tl text; nc int; ti boolean; done int := 0; eng jsonb;
begin
  select brand_slug into brand from ve_panel_runs where id = p_run;
  if brand is null then return jsonb_build_object('ok', false, 'error', 'not_found'); end if;
  for r in select * from ve_panel_questions where run_id = p_run and n between p_from and p_to order by n loop
    l := ve_search(r.question, null, null, 5, brand);
    c := ve_search_content(r.question, 3, brand);
    s := ve_search_store(r.question, 5);
    select m.question, m.score into k from guide_kb_match(brand, r.question, 1) m;
    nc := coalesce(jsonb_array_length(c->'moments'), 0) + coalesce(jsonb_array_length(c->'episodes'), 0) + coalesce(jsonb_array_length(c->'shows'), 0);
    ti := coalesce(jsonb_array_length(c->'intent'->'topics'), 0) > 0;
    cov := case when s is not null then 'store'
                when k.score is not null and k.score >= 0.42 then 'bank'
                when nc > 0 and (ti or coalesce((l->>'total')::int, 0) = 0) then 'content'
                when coalesce((l->>'total')::int, 0) > 0 then 'listing'
                else 'none' end;
    tl := case cov
      when 'store' then 'At ' || coalesce(s->'store'->>'name', '?') || ': ' || coalesce(s->>'term', s->>'thing', 'everything Vegan') || ' (' || coalesce(s->>'total', '0') || ')'
      when 'bank' then k.question
      when 'content' then left(coalesce(c->'moments'->0->>'quote', c->'episodes'->0->>'title', c->'shows'->0->>'title'), 140)
      when 'listing' then l->'results'->0->>'name'
      else null end;
    eng := jsonb_build_object(
      'total', (l->>'total')::int,
      'read', jsonb_build_object('labels', l->'interpretation'->'labels', 'place', l->'interpretation'->'place'->>'name', 'near_me', l->'interpretation'->'near_me', 'terms', l->'interpretation'->>'terms'),
      'listings', (select coalesce(jsonb_agg(jsonb_build_object('name', x->>'name', 'category', x->>'category', 'city', x->>'city')), '[]'::jsonb) from jsonb_array_elements(coalesce(l->'results', '[]'::jsonb)) with ordinality t(x, i) where i <= 3),
      'content', jsonb_build_object('topics', c->'intent'->'labels',
        'moments', (select coalesce(jsonb_agg(jsonb_build_object('quote', left(x->>'quote', 120), 'speaker', x->>'speaker', 'show', x->>'show')), '[]'::jsonb) from jsonb_array_elements(coalesce(c->'moments', '[]'::jsonb)) with ordinality t(x, i) where i <= 2),
        'episodes', (select coalesce(jsonb_agg(jsonb_build_object('title', x->>'title', 'show', x->>'show')), '[]'::jsonb) from jsonb_array_elements(coalesce(c->'episodes', '[]'::jsonb)) with ordinality t(x, i) where i <= 2)),
      'store', case when s is null then null else jsonb_build_object('store', s->'store'->>'name', 'mode', s->>'mode', 'term', s->>'term', 'thing', s->>'thing', 'total', (s->>'total')::int) end,
      'bank', case when k.question is null then null else jsonb_build_object('question', k.question, 'score', round(k.score::numeric, 2)) end);
    update ve_panel_questions set engine = eng, coverage = cov, top_label = tl where id = r.id;
    done := done + 1;
  end loop;
  update ve_panel_runs set status = case when status = 'judged' then status else 'run' end, run_at = now() where id = p_run;
  return jsonb_build_object('ok', true, 'ran', done);
end $$;

-- Only the edge function (service role) may call any of these.
revoke all on function public.ve_research_capture(text, text, text, text), public.ve_research_sync(), public.ve_kb_expire(),
  public.ve_kb_publish(uuid, text), public.ve_panel_run(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.ve_research_capture(text, text, text, text), public.ve_research_sync(), public.ve_kb_expire(),
  public.ve_kb_publish(uuid, text), public.ve_panel_run(uuid, integer, integer) to service_role;

-- The queue fills itself every 30 minutes; answers run out at 8:17 UTC, before anyone is up.
select cron.schedule('ve-research-sync', '*/30 * * * *', 'select public.ve_research_sync()');
select cron.schedule('ve-kb-expire', '17 8 * * *', 'select public.ve_kb_expire()');
