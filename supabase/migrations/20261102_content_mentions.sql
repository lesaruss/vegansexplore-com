-- Directory cards in the Pulse (Sean, 2026-11-02: "if somebody's referenced in our articles and they're in our directory, their
-- tile should show up on that page. If a restaurant's mentioned, their restaurant should show up on that page at the bottom.")
--
-- Logan's defaults, Sean's to change:
--   1. "In this story" at the foot of every Pulse article: the Directory cards of the people, restaurants, brands and groups
--      each article names. Each listing's page gets "In the Pulse" linking back to them.
--   2. Matching, worked out ahead and saved here: (a) credit, a person credited on the episode (ve_person_credits, not as Host);
--      (b) link, the listing's website (or Instagram) linked from the article's text; (c) name, the listing's full name as whole
--      words in the article, never a one-word name. Our own four shows and their hosts are left out, since their episodes already
--      sit on their own pages, and a few plain phrases that are also a listing's name are left out (see the stop list below).
--   3. Review: a Depot list removes a wrong match (status 'removed', kept so a rebuild never puts it back).
--   4. Order: the published Pulse articles first. The city Daily Pulse topics are the next pass.
--
-- Rebuilt by cron ve-content-mentions every 15 minutes (ve_content_mentions_sweep): an article is built when it has no run yet,
-- when it changed since its last run, or once a day, so a new listing joins its old articles within a day.
-- RLS on. Anyone reads the shown rows (the article and listing pages read them with the anon key); everything else goes through
-- the service role. Safe to run twice.

create table if not exists ve_content_mentions (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references ve_pulse_content(id) on delete cascade,
  listing_id uuid not null references listings(id) on delete cascade,
  source text not null check (source in ('credit', 'link', 'name')),
  matched text,
  status text not null default 'shown' check (status in ('shown', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_id, listing_id)
);
create index if not exists ve_content_mentions_listing_idx on ve_content_mentions (listing_id) where status = 'shown';
alter table ve_content_mentions enable row level security;
drop policy if exists "shown mentions are public" on ve_content_mentions;
create policy "shown mentions are public" on ve_content_mentions for select using (status = 'shown');

create table if not exists ve_content_mention_runs (
  content_id uuid primary key references ve_pulse_content(id) on delete cascade,
  built_at timestamptz not null default now(),
  found int not null default 0
);
alter table ve_content_mention_runs enable row level security;

-- Builds one article's mentions. Shown rows the text no longer supports are removed; removed rows are never touched, so a
-- wrong match taken off in the Depot stays off.
create or replace function ve_content_mentions_build(p_content_id uuid)
returns int
language plpgsql
security definer
set search_path = public
set statement_timeout = '120s'
as $$
declare
  a record;
  v_text text;
  v_raw text;
  -- Our four shows and the people who host them: their episodes sit on their own pages, so they are not "In this story".
  -- The brand's own listing too.
  c_skip constant text[] := array['vegans-explore-podcast', 'soflo-vegans-podcast', 'vegans-who-lift-podcast', 'pre-vegans-podcast',
                                  'john-thomas', 'brooke-sellers', 'sean-russell', 'vegans-explore'];
  -- Ordinary phrases that are also a listing's name (The TOP, Turning Point, Good Karma). Found by reading the matches, 2026-11-02.
  c_stop constant text[] := array['the top', 'turning point', 'good karma'];
  -- Hosts that are never a website to match on.
  c_social constant text[] := array['youtube.com', 'instagram.com', 'facebook.com', 'tiktok.com', 'open.spotify.com', 'spotify.com',
                                    'podcasts.apple.com', 'apple.com', 'amazon.com', 'vegansexplore.com', 'lesaruss.com', 'lesaruss.ai'];
begin
  select p.id, p.slug, p.title, p.summary, p.body, p.podcast_show
    into a
    from ve_pulse_content p
   where p.id = p_content_id and p.status = 'published';
  if not found then
    delete from ve_content_mentions where content_id = p_content_id and status = 'shown';
    return 0;
  end if;

  -- The text as words: tags out, punctuation to spaces, lower case, padded so a name matches only as whole words.
  v_text := ' ' || trim(regexp_replace(regexp_replace(lower(coalesce(a.title, '') || ' ' || coalesce(a.summary, '') || ' ' || coalesce(a.body, '')),
                                                     '<[^>]*>', ' ', 'g'), '[^a-z0-9]+', ' ', 'g')) || ' ';
  v_raw := lower(coalesce(a.body, ''));

  create temp table if not exists mention_found (lid uuid, src text, matched text) on commit drop;
  delete from mention_found;

  -- (a) credit: a person credited on this episode, not as its host.
  insert into mention_found (lid, src, matched)
  select pc.listing_id, 'credit', coalesce(pc.role, 'Guest')
    from ve_person_credits pc
    join listings l on l.id = pc.listing_id
   where pc.content_id = a.id
     and coalesce(pc.role, '') <> 'Host'
     and l.status = 'approved'
     and l.slug <> all (c_skip);

  -- (b) link: the listing's website or Instagram linked in the article's own text.
  insert into mention_found (lid, src, matched)
  select l.id, 'link', coalesce(nullif(l.website, ''), l.instagram)
    from listings l
    left join lateral (
      select substring(regexp_replace(regexp_replace(lower(coalesce(l.instagram, '')), '^.*instagram\.com/', ''), '^@', '') from '^[a-z0-9._]+') as handle
    ) ig on true
   where l.status = 'approved'
     and l.slug <> all (c_skip)
     and (
       (coalesce(l.website, '') <> '' and length(regexp_replace(regexp_replace(lower(l.website), '^https?://(www\.)?', ''), '/.*$', '')) >= 8
         and regexp_replace(regexp_replace(lower(l.website), '^https?://(www\.)?', ''), '/.*$', '') <> all (c_social)
         and position(regexp_replace(regexp_replace(lower(l.website), '^https?://(www\.)?', ''), '/.*$', '') in v_raw) > 0)
       or
       (coalesce(l.instagram, '') <> '' and length(coalesce(ig.handle, '')) >= 3
         and position('instagram.com/' || ig.handle in v_raw) > 0)
     );

  -- (c) name: the full name, as whole words, two words or more, and not a stop phrase.
  insert into mention_found (lid, src, matched)
  select l.id, 'name', l.name
    from listings l
   where l.status = 'approved'
     and not (coalesce(l.tags, '{}') && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'])
     and l.slug <> all (c_skip)
     and array_length(regexp_split_to_array(trim(regexp_replace(lower(l.name), '[^a-z0-9]+', ' ', 'g')), ' '), 1) >= 2
     and length(trim(regexp_replace(lower(l.name), '[^a-z0-9]+', ' ', 'g'))) >= 7
     and trim(regexp_replace(lower(l.name), '[^a-z0-9]+', ' ', 'g')) <> all (c_stop)
     and position(' ' || trim(regexp_replace(lower(l.name), '[^a-z0-9]+', ' ', 'g')) || ' ' in v_text) > 0;

  -- One row a listing; the strongest reason wins (credit, then link, then name).
  insert into ve_content_mentions (content_id, listing_id, source, matched, status, updated_at)
  select distinct on (f.lid) a.id, f.lid, f.src, left(f.matched, 200), 'shown', now()
    from mention_found f
   order by f.lid, case f.src when 'credit' then 1 when 'link' then 2 else 3 end
  on conflict (content_id, listing_id) do update
     set source = excluded.source, matched = excluded.matched, updated_at = now()
   where ve_content_mentions.status = 'shown';

  -- A shown row the text no longer supports goes. Removed rows stay.
  delete from ve_content_mentions m
   where m.content_id = a.id and m.status = 'shown'
     and not exists (select 1 from mention_found f where f.lid = m.listing_id);

  insert into ve_content_mention_runs (content_id, built_at, found)
  values (a.id, now(), (select count(*) from mention_found))
  on conflict (content_id) do update set built_at = excluded.built_at, found = excluded.found;

  return (select count(*)::int from ve_content_mentions where content_id = a.id and status = 'shown');
end;
$$;

-- Builds the articles that are due, a batch at a time (cron ve-content-mentions).
create or replace function ve_content_mentions_sweep(p_limit int default 40)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  n int := 0;
begin
  for r in
    select p.id
      from ve_pulse_content p
      left join ve_content_mention_runs run on run.content_id = p.id
     where p.status = 'published'
       and (run.content_id is null or p.updated_at > run.built_at or run.built_at < now() - interval '1 day')
     order by run.built_at nulls first
     limit p_limit
  loop
    perform ve_content_mentions_build(r.id);
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke execute on function ve_content_mentions_build(uuid) from public, anon, authenticated;
revoke execute on function ve_content_mentions_sweep(int) from public, anon, authenticated;

select cron.schedule('ve-content-mentions', '*/15 * * * *', $c$ select ve_content_mentions_sweep(40); $c$);
