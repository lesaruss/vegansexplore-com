-- The way back (Sean, 2026-11-01: "build the show page back-link too"). A show's episode view (/directory/<show>?ep=<guid>,
-- public/ve-episodes.js) links to that episode's show notes on the Pulse (/pulse/<slug>). Given the show's listing and a feed
-- episode's guid, this finds the Pulse article: candidates from the same show by title, date or episode number, each confirmed
-- with ve_pulse_episode (20261101_ve_pulse_episode.sql), so the link back always agrees with the link there.
create or replace function public.ve_pulse_for_episode(p_listing uuid, p_guid text)
returns text language sql stable security definer set search_path = public, extensions as $$
  with sm(show, slug) as (values ('Vegans Explore Podcast','vegans-explore-podcast'),('SoFlo Vegans Podcast','soflo-vegans-podcast'),
    ('Vegans Who Lift Podcast','vegans-who-lift-podcast'),('Pre-Vegans Podcast','pre-vegans-podcast')),
  s as (select l.id, sm.show from listings l join sm on sm.slug = l.slug where l.id = p_listing and l.status = 'approved'),
  e as (select ep from s join ve_podcast_feeds f on f.listing_id = s.id, lateral jsonb_array_elements(f.episodes) ep
        where ep ->> 'guid' = p_guid limit 1),
  c as (select pc.slug, similarity(lower(pc.title), lower(e.ep ->> 'title')) sim
        from s, e, ve_pulse_content pc
        where pc.status = 'published' and pc.podcast_show = s.show
          and (similarity(lower(pc.title), lower(e.ep ->> 'title')) >= 0.2
            or abs(extract(epoch from ((e.ep ->> 'date')::timestamptz - pc.published_at)) / 86400) <= 2
            or ((e.ep ->> 'episode') ~ '^[0-9]+$' and pc.episode_number = (e.ep ->> 'episode')::int))
        order by ((e.ep ->> 'episode') ~ '^[0-9]+$' and pc.episode_number = (e.ep ->> 'episode')::int) desc,
          abs(extract(epoch from ((e.ep ->> 'date')::timestamptz - pc.published_at))) <= 2 * 86400 desc, sim desc limit 8)
  select c.slug from c where (ve_pulse_episode(c.slug) -> 'episode' ->> 'guid') = p_guid order by c.sim desc limit 1;
$$;
revoke all on function public.ve_pulse_for_episode(uuid, text) from public;
grant execute on function public.ve_pulse_for_episode(uuid, text) to anon, authenticated, service_role;
