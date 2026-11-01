-- The Pulse episode match, kept ahead (2026-11-01). Matching an article to its feed episode by title on every request took 0.5 to
-- 0.9 s, and four at once ran 128 of 278 past the public role's 3 s limit, so a crawl that missed the page cache would have
-- dropped the player. The match is now kept in ve_pulse_episode_map, refreshed by cron every 10 minutes (the feeds refresh
-- hourly), and both public reads (ve_pulse_episode for /pulse/<slug>, ve_pulse_for_episode for a show page's Show notes) are
-- single-row lookups. The matching rules are 20261101_ve_pulse_episode.sql's, moved into ve_pulse_episode_compute.

create table if not exists public.ve_pulse_episode_map (
  content_id uuid primary key references public.ve_pulse_content(id) on delete cascade,
  show_listing_id uuid not null,
  guid text,
  episode jsonb,
  matched_at timestamptz not null default now()
);
create index if not exists ve_pulse_episode_map_guid on public.ve_pulse_episode_map (show_listing_id, guid);
alter table public.ve_pulse_episode_map enable row level security;

-- The matching itself (internal; the old ve_pulse_episode body).
create or replace function public.ve_pulse_episode_compute(p_content uuid)
returns jsonb language sql stable security definer set search_path = public, extensions as $$
  with c as (select id, title, podcast_show, episode_number, published_at from ve_pulse_content where id = p_content and status = 'published'),
  sm(show, slug) as (values ('Vegans Explore Podcast','vegans-explore-podcast'),('SoFlo Vegans Podcast','soflo-vegans-podcast'),
    ('Vegans Who Lift Podcast','vegans-who-lift-podcast'),('Pre-Vegans Podcast','pre-vegans-podcast')),
  s as (select l.id from c join sm on sm.show = c.podcast_show join listings l on l.slug = sm.slug and l.status = 'approved'),
  m0 as (select fe.guid from c, lateral ve_content_feed_episode(c.id) fe),
  m1 as (select ep ->> 'guid' as guid from c, s join ve_podcast_feeds f on f.listing_id = s.id,
         lateral jsonb_array_elements(f.episodes) ep
         where c.episode_number is not null and (ep ->> 'episode') ~ '^[0-9]+$' and (ep ->> 'episode')::int = c.episode_number
           and abs(extract(epoch from ((ep ->> 'date')::timestamptz - c.published_at)) / 86400) <= 120
           and exists (select 1 from regexp_split_to_table(lower(ep ->> 'title'), '[^a-z]+') w
             where length(w) >= 4 and w not in ('vegan','vegans','podcast','with','from','that','this','your','plant','based','about')
               and lower(c.title) like '%' || w || '%')
         order by abs(extract(epoch from ((ep ->> 'date')::timestamptz - c.published_at))) limit 1),
  cand as (select guid, 0 pri from m0 union all select guid, 1 from m1),
  ok as (select cand.pri, ep from cand, c, s join ve_podcast_feeds f on f.listing_id = s.id,
         lateral jsonb_array_elements(f.episodes) ep
         where ep ->> 'guid' = cand.guid
           and not exists (select 1 from ve_pulse_content o where o.status = 'published' and o.podcast_show = c.podcast_show and o.id <> c.id
             and similarity(lower(o.title), lower(ep ->> 'title')) > similarity(lower(c.title), lower(ep ->> 'title')) + 0.15)
         order by cand.pri limit 1)
  select case when not exists (select 1 from s) then null else jsonb_build_object(
    'listing_id', (select id from s),
    'episode', (select jsonb_build_object('guid', ep ->> 'guid', 'title', ep ->> 'title', 'audio', ep ->> 'audio', 'type', ep ->> 'type',
      'image', ep ->> 'image', 'duration', (ep ->> 'duration')::int, 'date', ep ->> 'date') from ok)) end;
$$;
revoke all on function public.ve_pulse_episode_compute(uuid) from public, anon, authenticated;

-- Refresh the oldest p_limit rows (and every article not mapped yet); drops rows of articles no longer published.
create or replace function public.ve_pulse_episode_refresh(p_limit int default 60)
returns int language plpgsql security definer set search_path = public, extensions as $$
declare r record; j jsonb; n int := 0;
begin
  delete from ve_pulse_episode_map m where not exists (select 1 from ve_pulse_content c where c.id = m.content_id and c.status = 'published' and c.podcast_show is not null);
  for r in
    select c.id from ve_pulse_content c left join ve_pulse_episode_map m on m.content_id = c.id
    where c.status = 'published' and c.podcast_show is not null
    order by m.matched_at nulls first, c.published_at desc limit greatest(1, p_limit)
  loop
    j := ve_pulse_episode_compute(r.id);
    if j is null then delete from ve_pulse_episode_map where content_id = r.id; continue; end if;
    insert into ve_pulse_episode_map (content_id, show_listing_id, guid, episode, matched_at)
    values (r.id, (j ->> 'listing_id')::uuid, j -> 'episode' ->> 'guid', j -> 'episode', now())
    on conflict (content_id) do update set show_listing_id = excluded.show_listing_id, guid = excluded.guid,
      episode = excluded.episode, matched_at = now();
    n := n + 1;
  end loop;
  -- One feed episode, one article: when two hold the same episode, the one whose title is closer to it keeps it (A Moment of
  -- Clarity, Dec 3, had taken NYC Tour Day 01, Dec 1, from the Day 01 article).
  update ve_pulse_episode_map m set guid = null, episode = null
  from (select m2.content_id, row_number() over (partition by m2.show_listing_id, m2.guid
          order by similarity(lower(c.title), lower(m2.episode ->> 'title')) desc, c.published_at) rk
        from ve_pulse_episode_map m2 join ve_pulse_content c on c.id = m2.content_id where m2.guid is not null) d
  where d.content_id = m.content_id and d.rk > 1;
  return n;
end $$;
revoke all on function public.ve_pulse_episode_refresh(int) from public, anon, authenticated;

-- The public reads.
create or replace function public.ve_pulse_episode(p_slug text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object('show', jsonb_build_object('slug', l.slug, 'name', l.name, 'logo', l.logo_url),
    'episode', case when m.guid is null then null else m.episode end)
  from ve_pulse_content c join ve_pulse_episode_map m on m.content_id = c.id join listings l on l.id = m.show_listing_id
  where c.slug = p_slug and c.status = 'published' limit 1;
$$;
create or replace function public.ve_pulse_for_episode(p_listing uuid, p_guid text)
returns text language sql stable security definer set search_path = public as $$
  select c.slug from ve_pulse_episode_map m join ve_pulse_content c on c.id = m.content_id and c.status = 'published'
  where m.show_listing_id = p_listing and m.guid = p_guid order by c.published_at limit 1;
$$;
grant execute on function public.ve_pulse_episode(text) to anon, authenticated, service_role;
grant execute on function public.ve_pulse_for_episode(uuid, text) to anon, authenticated, service_role;

select cron.schedule('ve-pulse-episode-map', '*/10 * * * *', $c$ select public.ve_pulse_episode_refresh(60); $c$);
