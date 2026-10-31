-- Episodes on a topic from other shows in our Directory (Sean, 2026-10-31, the Dairy Guide's Pulse: "pull in other podcasts as well
-- too, from the RSS that match... that topic"). Read from ve_podcast_feeds (every Directory podcast's latest 300 episodes, refreshed
-- by ve-podcast), so a new episode on the topic shows up on its own.
--
-- Only topics named here (never a pattern from the caller). Matched on the episode's title, whole words. Left out: our own four shows
-- (each Guide picks those by hand), LESARUSS.ai's business podcasts, episodes with no audio. At most 3 an episode per show, so one
-- busy show cannot fill the list; newest first. Public: it returns only what each show publishes in its own feed.
create or replace function public.ve_topic_episodes(p_topic text, p_limit int default 24)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with t as (
    select case p_topic
      when 'dairy' then '\m(dairy|cheeses?|milks?|yogh?urts?|casein|lactose|butter|ice cream|creamers?)\M'
    end as re
  ),
  eps as (
    select l.id, l.slug, l.name, l.logo_url, e,
           row_number() over (partition by l.id order by (e->>'date') desc nulls last) as n
    from t, ve_podcast_feeds f
    join listings l on l.id = f.listing_id,
    jsonb_array_elements(f.episodes) e
    where t.re is not null
      and l.status = 'approved' and l.category = 'Podcasts'
      and not (coalesce(l.tags, '{}') && array['lesaruss-ai-directory', 'lesaruss-ai-directory-candidate', 'lesaruss-ai-business-member'])
      and l.slug not in ('vegans-explore-podcast', 'soflo-vegans-podcast', 'pre-vegans-podcast', 'vegans-who-lift-podcast')
      and coalesce(e->>'audio', '') <> ''
      and (e->>'title') ~* t.re
  ),
  picked as (
    select * from eps where n <= 3
    order by (e->>'date') desc nulls last
    limit least(greatest(coalesce(p_limit, 24), 1), 48)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'show', jsonb_build_object('id', id, 'slug', slug, 'name', name, 'image', logo_url),
    'episode', jsonb_build_object('guid', e->>'guid', 'title', e->>'title', 'audio', e->>'audio', 'type', e->>'type',
                                  'date', e->>'date', 'duration', e->'duration', 'image', e->>'image')
  ) order by (e->>'date') desc nulls last), '[]'::jsonb)
  from picked
$$;

revoke all on function public.ve_topic_episodes(text, int) from public;
grant execute on function public.ve_topic_episodes(text, int) to anon, authenticated;
