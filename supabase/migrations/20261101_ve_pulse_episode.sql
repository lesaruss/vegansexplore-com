-- The Pulse's episode pages (Sean, 2026-11-01: "The banner on this page is broken... we have a lot of articles setup this
-- way... we need to fix the formatting and how people find them"). 278 of the 279 published ve_pulse_content rows are podcast
-- episodes, and 55 had no YouTube video or audio, so their page had nothing to play. api/pulse-article.js asks this for the
-- episode's show and its audio in the show's own feed (matched by ve_content_feed_episode), so every episode plays in place.
-- When the titles differ too much (the early SoFlo Vegans episodes were renamed here, and their dates sit 5 to 22 days off the
-- feed's, up to three months for 12 to 20), the feed's own episode number is used, within 120 days and sharing a title word (a name):
-- 28 matched that way on 2026-11-01, each checked by its guest.
-- Public data only: the show's listing and one feed episode.
create or replace function public.ve_pulse_episode(p_slug text)
returns jsonb language sql stable security definer set search_path = public, extensions as $$
  with c as (select id, title, podcast_show, episode_number, published_at from ve_pulse_content where slug = p_slug and status = 'published' limit 1),
  sm(show, slug) as (values ('Vegans Explore Podcast','vegans-explore-podcast'),('SoFlo Vegans Podcast','soflo-vegans-podcast'),
    ('Vegans Who Lift Podcast','vegans-who-lift-podcast'),('Pre-Vegans Podcast','pre-vegans-podcast')),
  s as (select l.id, l.slug, l.name, l.logo_url from c join sm on sm.show = c.podcast_show
        join listings l on l.slug = sm.slug and l.status = 'approved'),
  m0 as (select fe.guid from c, lateral ve_content_feed_episode(c.id) fe),
  m1 as (select ep ->> 'guid' as guid from c, s join ve_podcast_feeds f on f.listing_id = s.id,
         lateral jsonb_array_elements(f.episodes) ep
         where c.episode_number is not null and (ep ->> 'episode') ~ '^[0-9]+$' and (ep ->> 'episode')::int = c.episode_number
           and abs(extract(epoch from ((ep ->> 'date')::timestamptz - c.published_at)) / 86400) <= 120
           and exists (select 1 from regexp_split_to_table(lower(ep ->> 'title'), '[^a-z]+') w
             where length(w) >= 4 and w not in ('vegan','vegans','podcast','with','from','that','this','your','plant','based','about')
               and lower(c.title) like '%' || w || '%')
         order by abs(extract(epoch from ((ep ->> 'date')::timestamptz - c.published_at))) limit 1),
  -- A match is kept only when no other article of the same show is clearly closer to that feed title (the loose date rule had
  -- given the wine fining article the Michelin episode and Aging Well the Evolution episode); then the episode-number match.
  cand as (select guid, 0 pri from m0 union all select guid, 1 from m1),
  ok as (select cand.guid, cand.pri from cand, c, s join ve_podcast_feeds f on f.listing_id = s.id,
         lateral jsonb_array_elements(f.episodes) ep
         where ep ->> 'guid' = cand.guid
           and not exists (select 1 from ve_pulse_content o where o.status = 'published' and o.podcast_show = c.podcast_show and o.id <> c.id
             and similarity(lower(o.title), lower(ep ->> 'title')) > similarity(lower(c.title), lower(ep ->> 'title')) + 0.15)),
  m as (select guid from ok order by pri limit 1),
  e as (select ep from s join ve_podcast_feeds f on f.listing_id = s.id, m,
        lateral jsonb_array_elements(f.episodes) ep where ep ->> 'guid' = m.guid limit 1)
  select case when not exists (select 1 from s) then null else jsonb_build_object(
    'show', (select jsonb_build_object('slug', slug, 'name', name, 'logo', logo_url) from s),
    'episode', (select jsonb_build_object('guid', ep ->> 'guid', 'audio', ep ->> 'audio', 'type', ep ->> 'type',
      'image', ep ->> 'image', 'duration', (ep ->> 'duration')::int, 'date', ep ->> 'date') from e)
  ) end;
$$;
revoke all on function public.ve_pulse_episode(text) from public;
grant execute on function public.ve_pulse_episode(text) to anon, authenticated, service_role;
