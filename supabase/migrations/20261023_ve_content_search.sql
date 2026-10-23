-- Content index, Step 3: search and clips (Sean, 2026-10-23: "start step 3"). Search the tagged moments by words and
-- topic and play the exact second. Built in Depot > Content index first (Search, #search; one moment, #moment/<id>) so
-- Sean can judge the results before members get it. Everything reads ve_content_moments_live (ready transcripts, each
-- one's latest tagging run). Called by ve-content-index (service role); no public access.

-- Words to search: the summary and topics count most, then the quote, then the speaker and the episode's title.
create or replace function public.ve_content_moment_doc(p_summary text, p_quote text, p_speaker text, p_title text, p_topics text[])
 returns tsvector
 language sql
 immutable
 set search_path to 'public'
as $function$
  select setweight(to_tsvector('english', coalesce(p_summary, '') || ' ' || coalesce(array_to_string(p_topics, ' '), '')), 'A')
      || setweight(to_tsvector('english', coalesce(p_quote, '')), 'B')
      || setweight(to_tsvector('english', coalesce(p_speaker, '') || ' ' || coalesce(p_title, '')), 'C');
$function$;

-- Moments matching the words (websearch syntax: "plant protein", -powder, or) and/or a topic and a show, best first.
create or replace function public.ve_content_moments_search(p_q text default null, p_topic text default null, p_show text default null, p_limit int default 60)
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  with q as (select case when coalesce(btrim(p_q), '') = '' then null else websearch_to_tsquery('english', p_q) end as tq),
  hits as (
    select m.*, case when q.tq is null then 0 else ts_rank(ve_content_moment_doc(m.summary, m.quote, m.speaker, m.title, m.topics), q.tq) end as rank
    from ve_content_moments_live m, q
    where (q.tq is null or ve_content_moment_doc(m.summary, m.quote, m.speaker, m.title, m.topics) @@ q.tq)
      and (coalesce(p_topic, '') = '' or p_topic = any (m.topics))
      and (coalesce(p_show, '') = '' or m.podcast_show = p_show)
  )
  select jsonb_build_object(
    'total', (select count(*) from hits),
    'moments', coalesce((select jsonb_agg(jsonb_build_object('id', h.id, 'content_id', h.content_id, 'start_s', h.start_s, 'end_s', h.end_s,
        'speaker', h.speaker, 'quote', h.quote, 'summary', h.summary, 'topics', to_jsonb(h.topics), 'title', h.title,
        'podcast_show', h.podcast_show, 'episode_number', h.episode_number, 'youtube_id', h.youtube_id)
      order by h.rank desc, h.episode_number nulls last, h.start_s)
      from (select * from hits order by rank desc, episode_number nulls last, start_s limit greatest(1, least(coalesce(p_limit, 60), 200))) h), '[]'::jsonb)
  );
$function$;

-- One moment, with the rest of its episode's moments.
create or replace function public.ve_content_moment_get(p_id uuid)
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'moment', to_jsonb(m) - 'run_id' - 'created_at',
    'episode', (select jsonb_agg(jsonb_build_object('id', o.id, 'start_s', o.start_s, 'end_s', o.end_s, 'speaker', o.speaker, 'summary', o.summary, 'topics', to_jsonb(o.topics)) order by o.start_s)
                from ve_content_moments_live o where o.content_id = m.content_id))
  from ve_content_moments_live m where m.id = p_id;
$function$;

-- Every topic with how many moments it has (search's topic list), and how far tagging has got.
create or replace function public.ve_content_topic_counts()
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'topics', (select jsonb_agg(jsonb_build_object('slug', t.slug, 'label', t.label, 'moments',
                 (select count(*) from ve_content_moments_live m where t.slug = any (m.topics))) order by t.sort) from ve_content_topics t),
    'moments', (select count(*) from ve_content_moments_live),
    'episodes_tagged', (select count(*) from ve_content_transcripts where status = 'ready' and tag_status = 'tagged'),
    'episodes_waiting', (select count(*) from ve_content_transcripts where status = 'ready' and tag_status in ('queued', 'tagging'))
  );
$function$;

revoke all on function public.ve_content_moments_search(text, text, text, int) from public, anon, authenticated;
revoke all on function public.ve_content_moment_get(uuid) from public, anon, authenticated;
revoke all on function public.ve_content_topic_counts() from public, anon, authenticated;
