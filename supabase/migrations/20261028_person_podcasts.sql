-- People pages play their podcasts in place (Sean, 2026-10-28: "use the squared with the rounded corners logo thumbnails for the
-- podcast... if we can pull in RSS from other podcasts based off if their name is in the title or if you can find that they're in that
-- episode, we could add it there as well. And then also, if the person has a podcast that's featured in our media section, you can put
-- that in its own section... I don't want it to be like a long scroll... 10 episodes and then you can scroll within... if they click
-- listen, it's going to open up a player. And if they click watch, it could open up a light box").
--
-- ve_person_episodes(listing) returns, for a person in the People section:
--   ours      their credited episodes on our shows (ve_person_credits -> ve_pulse_content), each matched to the episode in the show's own
--             feed (ve_podcast_feeds) so it plays from its audio: the best title match among that show's episodes, kept only when the
--             feed episode names them (last name in its title or description) and came out within 60 days, or the titles are close
--             (similarity 0.45 or more), or it came out within 2 days with some likeness (0.2); with the square artwork and YouTube id.
--   elsewhere episodes of other podcasts in the Directory that have them on: their full name (or a name in details.person.aka) in the
--             title, or in the description as the guest ("with <name>", "joined by", "<name> joins us"), not a passing mention;
--             newest first, at most 40; not their own shows or ours.
--   shows     the podcasts they host (details.person.shows, Directory slugs), with the latest 30 episodes of each.
create extension if not exists pg_trgm;

-- The work: scanning every feed takes about 3.5 s, past the 3 s a visitor's request may run, so it is built ahead (below).
create or replace function public.ve_person_episodes_build(p_listing uuid)
returns jsonb language sql stable security definer set search_path = public, extensions as $$
  with p as (
    select l.id, regexp_replace(btrim(regexp_replace(l.name, '\s*\(.*\)\s*', '', 'g')), '^(Dr\.?|Chef)\s+', '', 'i') as full_name,
      coalesce(l.details -> 'person' -> 'shows', '[]'::jsonb) as shows,
      coalesce(l.details -> 'person' -> 'aka', '[]'::jsonb) as aka
    from listings l where l.id = p_listing and l.status = 'approved'
  ),
  names as (
    select lower(n) n from p, lateral (select p.full_name union select jsonb_array_elements_text(p.aka)) x(n) where n ~ '\S\s+\S'
  ),
  lastn as (select lower(regexp_replace(p.full_name, '^.*\s', '')) ln from p),
  sm(show, slug) as (values ('Vegans Explore Podcast','vegans-explore-podcast'),('SoFlo Vegans Podcast','soflo-vegans-podcast'),
    ('Vegans Who Lift Podcast','vegans-who-lift-podcast'),('Pre-Vegans Podcast','pre-vegans-podcast')),
  showl as (select s.id, s.slug, s.name, coalesce(s.logo_url, f.image) as image, f.episodes from listings s left join ve_podcast_feeds f on f.listing_id = s.id
    where s.status = 'approved' and s.category = 'Podcasts'),
  cr as (
    select distinct on (x.id) c.role, x.id as content_id, x.title, x.youtube_id, x.published_at, x.podcast_show, x.slug as pulse_slug
    from p join ve_person_credits c on c.listing_id = p.id and c.kind = 'episode' join ve_pulse_content x on x.id = c.content_id
  ),
  ours as (
    select cr.*, sl.id as show_id, sl.slug as show_slug, sl.name as show_name, sl.image as show_image, b.e
    from cr join sm on sm.show = cr.podcast_show join showl sl on sl.slug = sm.slug
    left join lateral (
      select e from jsonb_array_elements(sl.episodes) e, lastn
      where (similarity(lower(e->>'title'), lower(cr.title)) >= 0.45)
         or ((lower(coalesce(e->>'title','') || ' ' || coalesce(e->>'summary','')) like '%' || lastn.ln || '%')
             and abs(extract(epoch from ((e->>'date')::timestamptz - cr.published_at)) / 86400) <= 60)
         or (abs(extract(epoch from ((e->>'date')::timestamptz - cr.published_at)) / 86400) <= 2 and similarity(lower(e->>'title'), lower(cr.title)) >= 0.2)
      order by similarity(lower(e->>'title'), lower(cr.title)) desc, abs(extract(epoch from ((e->>'date')::timestamptz - cr.published_at))) limit 1
    ) b on true
  ),
  own as (select sl.* from p, jsonb_array_elements_text(p.shows) s join showl sl on sl.slug = s),
  elsewhere as (
    select sl.id as show_id, sl.slug as show_slug, sl.name as show_name, sl.image as show_image, e
    from showl sl, jsonb_array_elements(sl.episodes) e
    where sl.slug not in (select slug from sm) and sl.id not in (select id from own)
      and exists (select 1 from names, lateral (select '\m' || regexp_replace(names.n, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\M' as re) r
        where lower(coalesce(e->>'title','')) ~ r.re
           or lower(coalesce(e->>'summary','')) ~ ('(with|joined by|welcomes?|our guest|guest,?|interview\w*|sits? down with|talks? (with|to)|conversation with|chat\w* with|speak\w* with)[^.!?]{0,60}' || r.re)
           or lower(coalesce(e->>'summary','')) ~ (r.re || '[^.!?]{0,40}(joins|is back|returns|stops by|sits down)'))
    order by (e->>'date') desc nulls last limit 40
  )
  select jsonb_build_object(
    'ours', coalesce((select jsonb_agg(jsonb_build_object('title', coalesce(o.e->>'title', o.title), 'role', o.role, 'date', coalesce(o.e->>'date', o.published_at::text),
        'guid', o.e->>'guid', 'audio', o.e->>'audio', 'image', o.e->>'image', 'duration', o.e->'duration', 'youtube_id', o.youtube_id, 'pulse_slug', o.pulse_slug,
        'show', jsonb_build_object('id', o.show_id, 'slug', o.show_slug, 'name', o.show_name, 'image', o.show_image))
      order by coalesce(o.e->>'date', o.published_at::text) desc) from ours o), '[]'::jsonb),
    'elsewhere', coalesce((select jsonb_agg(jsonb_build_object('title', w.e->>'title', 'date', w.e->>'date', 'guid', w.e->>'guid', 'audio', w.e->>'audio',
        'image', w.e->>'image', 'duration', w.e->'duration', 'show', jsonb_build_object('id', w.show_id, 'slug', w.show_slug, 'name', w.show_name, 'image', w.show_image))
      order by w.e->>'date' desc) from elsewhere w), '[]'::jsonb),
    'shows', coalesce((select jsonb_agg(jsonb_build_object('id', o.id, 'slug', o.slug, 'name', o.name, 'image', o.image,
        'episodes', coalesce((select jsonb_agg(jsonb_build_object('title', e->>'title', 'date', e->>'date', 'guid', e->>'guid', 'audio', e->>'audio', 'image', e->>'image', 'duration', e->'duration'))
          from (select e from jsonb_array_elements(o.episodes) e order by (e->>'date') desc nulls last limit 30) q), '[]'::jsonb))) from own o), '[]'::jsonb));
$$;
revoke all on function public.ve_person_episodes_build(uuid) from public, anon, authenticated;

-- Built ahead and kept: each person's result, rebuilt every 6 hours (cron ve-person-episodes, 12 every 5 minutes) so new feed episodes
-- show up; the page reads the stored copy through ve_person_episodes.
create table if not exists public.ve_person_episodes_cache (listing_id uuid primary key references public.listings(id) on delete cascade, data jsonb not null, built_at timestamptz not null default now());
alter table public.ve_person_episodes_cache enable row level security;

create or replace function public.ve_person_episodes(p_listing uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select data from ve_person_episodes_cache where listing_id = p_listing), '{}'::jsonb);
$$;
revoke all on function public.ve_person_episodes(uuid) from public;
grant execute on function public.ve_person_episodes(uuid) to anon, authenticated;

create or replace function public.ve_person_episodes_refresh(p_limit int default 10)
returns int language plpgsql security definer set search_path = public, extensions as $f$
declare r record; n int := 0;
begin
  for r in select l.id from listings l left join ve_person_episodes_cache c on c.listing_id = l.id
    where l.status = 'approved' and l.category in ('Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders')
      and (c.built_at is null or c.built_at < now() - interval '6 hours')
    order by c.built_at nulls first limit greatest(1, least(p_limit, 50))
  loop
    insert into ve_person_episodes_cache (listing_id, data, built_at) values (r.id, ve_person_episodes_build(r.id), now())
      on conflict (listing_id) do update set data = excluded.data, built_at = excluded.built_at;
    n := n + 1;
  end loop;
  return n;
end $f$;
revoke all on function public.ve_person_episodes_refresh(int) from public, anon, authenticated;
select cron.schedule('ve-person-episodes', '*/5 * * * *', $c$ select public.ve_person_episodes_refresh(12); $c$);

-- The podcasts our people host, from each show's own description (checked 2026-10-28).
-- Vegans Who Lift is one of our shows, so John Thomas and Brooke Sellers have its episodes under ours, not a section of their own.
update listings l set details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('person', coalesce(l.details -> 'person', '{}'::jsonb) || jsonb_build_object('shows', to_jsonb(v.shows))), updated_at = now()
from (values ('maxime-sigouin', array['the-maxime-sigouin-podcast']), ('giacomo-marchese', array['muscles-by-brussels-radio']), ('dani-taylor', array['muscles-by-brussels-radio']), ('dotsie-bausch', array['switch4good-podcast']),
  ('jason-kartalian', array['vegan-hacks']), ('brighde-reed', array['the-world-vegan-travel-podcast']), ('neal-barnard', array['the-exam-room'])) v(slug, shows)
where l.slug = v.slug and l.status = 'approved';
