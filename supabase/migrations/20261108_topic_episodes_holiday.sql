-- The Holiday Guide's Listen tab (Sean, 2026-11-08: "the other ones that we have on our RSS have topics that are related that we
-- can pull in"): a 'holiday' topic for ve_topic_episodes, matched on the episode title. The function is otherwise unchanged
-- (20261031_ve_topic_episodes.sql). A regex term is not our copy; the word rule for our own copy is unchanged.
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
      when 'holiday' then '\m(thanksgiving|thanksliving|holidays?|friendsgiving|christmas|hanukkah|kwanzaa)\M'
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
