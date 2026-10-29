-- The documentary directors from our panel get People profiles (Sean, 2026-10-29: "Can you create people profiles for those
-- directors?"). Vegans Explore Podcast 57, "Vegan Documentary Directors on How Films Change Food, Ethics, and the World" (2025-12-27):
-- Shaun Monson (Earthlings, Unity), Louie Psihoyos (The Cove, The Game Changers, Racing Extinction), Marc Pierschel (Live and Let Live,
-- The End of Meat) and Keegan Kuhn (co-director of Cowspiracy, What the Health and They're Trying to Kill Us), as the panel's host
-- introduced them (Keegan Kuhn was added new). Each is a People listing in Content Creators (every chapter, no place), credited with the episode as a panelist, with
-- their films in our Directory as Their work, and on those films' People in this film as Director. The bio is written afterwards
-- from the panel's transcript (ve-people bio_draft).
with d(name, slug, title, films) as (values
  ('Shaun Monson', 'shaun-monson', 'Documentary filmmaker, director of Earthlings and Unity', array['earthlings']),
  ('Louie Psihoyos', 'louie-psihoyos', 'Documentary filmmaker and photographer, director of The Cove and The Game Changers', array['the-game-changers']),
  ('Marc Pierschel', 'marc-pierschel', 'Documentary filmmaker, director of Live and Let Live and The End of Meat', array['live-and-let-live', 'the-end-of-meat']),
  ('Keegan Kuhn', 'keegan-kuhn', 'Documentary filmmaker, co-director of Cowspiracy and What the Health', array['cowspiracy', 'what-the-health', 'theyre-trying-to-kill-us'])
), promote as (
  -- Three of them sat quarantined from the May Instagram import (SHAUN MONSON @shaunmonson, Louie Psihoyos @psihoyos, Marc Pierschel
  -- @blackrabbitimages, his studio): those rows become the profiles, keeping the handle, the way the People seed's second pass did.
  update public.listings x set status = 'approved', name = d.name, slug = d.slug, category = 'Content Creators', communities = array['all'],
    location = 'Online', vegan_status = null, crawl_source = 'people', initials = upper(left(d.name, 1)), updated_at = now(),
    details = coalesce(x.details, '{}'::jsonb) || jsonb_build_object('person', jsonb_build_object('added', 'documentary directors panel, 2026-10-29, from the May import',
      'title', d.title, 'links', (select jsonb_agg(jsonb_build_object('label', f.name, 'url', 'https://vegansexplore.com/directory/' || f.slug) order by f.release)
                from (select l.name, l.slug, coalesce(l.details->>'release_year', '') release from listings l
                      where l.slug = any (d.films) and l.status = 'approved' and l.category = 'Documentaries & Films') f)))
  from d
  where lower(btrim(x.name)) = lower(d.name) and x.status = 'quarantined' and coalesce(x.address_city, '') = '' and coalesce(x.address_state, '') = ''
    and not exists (select 1 from listings y where y.slug = d.slug)
  returning x.id, x.slug
), closed as (
  update public.ve_backlog_checks b set decision = 'listed', decided_at = now() from promote where b.listing_id = promote.id and b.decision is null
  returning b.listing_id
), ins as (
  insert into public.listings (name, slug, category, specialty, description, status, website, location, initials, crawl_source, communities, vegan_status, details)
  select d.name, d.slug, 'Content Creators', '', '', 'approved', '', 'Online', upper(left(d.name, 1)), 'people', array['all'], null,
    jsonb_build_object('person', jsonb_build_object('added', 'documentary directors panel, 2026-10-29', 'title', d.title,
      'links', (select jsonb_agg(jsonb_build_object('label', f.name, 'url', 'https://vegansexplore.com/directory/' || f.slug) order by f.release)
                from (select l.name, l.slug, coalesce(l.details->>'release_year', '') release from listings l
                      where l.slug = any (d.films) and l.status = 'approved' and l.category = 'Documentaries & Films') f)))
  from d
  where not exists (select 1 from listings x where x.slug = d.slug)
    and not exists (select 1 from listings x where lower(btrim(x.name)) = lower(d.name) and x.status <> 'rejected')
  returning id, slug
)
insert into public.ve_person_credits (listing_id, kind, role, content_id, happened_on)
select n.id, 'episode', 'Panelist', c.id, c.published_at::date
from (select id from ins union select id from promote) n join ve_pulse_content c on c.slug = 'vegan-documentary-directors-panel-films-change-world'
on conflict do nothing;

-- On their films' pages: People in this film, the director first.
with f(film, person, role) as (values
  ('earthlings', 'shaun-monson', 'Director'),
  ('the-game-changers', 'louie-psihoyos', 'Director'),
  ('live-and-let-live', 'marc-pierschel', 'Director'),
  ('the-end-of-meat', 'marc-pierschel', 'Director'),
  ('cowspiracy', 'keegan-kuhn', 'Co-director'),
  ('what-the-health', 'keegan-kuhn', 'Co-director'),
  ('theyre-trying-to-kill-us', 'keegan-kuhn', 'Co-director')
), g as (select film, jsonb_agg(jsonb_build_object('person', person, 'role', role)) j from f group by film)
update listings l set details = jsonb_set(coalesce(l.details, '{}'::jsonb), '{film_people}',
    g.j || coalesce((select jsonb_agg(e) from jsonb_array_elements(l.details->'film_people') e
                     where not (g.j @> jsonb_build_array(jsonb_build_object('person', e->>'person')))), '[]'::jsonb)),
  updated_at = now()
from g where l.slug = g.film and l.status = 'approved' and l.category = 'Documentaries & Films';

-- Their panel episode on the film pages' On our podcast names them with their profile.
update listings l set details = jsonb_set(l.details, '{film_podcasts}', (
    select jsonb_agg(case when e->>'guid' = '3cdcbc52-8cd0-4b0e-9327-202fd8d47039' then e || jsonb_build_object('person', x.person) else e end)
    from jsonb_array_elements(l.details->'film_podcasts') e)), updated_at = now()
from (values ('earthlings', 'shaun-monson'), ('the-game-changers', 'louie-psihoyos'), ('live-and-let-live', 'marc-pierschel'),
             ('the-end-of-meat', 'marc-pierschel'), ('cowspiracy', 'keegan-kuhn'), ('what-the-health', 'keegan-kuhn'),
             ('theyre-trying-to-kill-us', 'keegan-kuhn')) x(film, person)
where l.slug = x.film and l.status = 'approved' and l.category = 'Documentaries & Films' and l.details ? 'film_podcasts';

-- Afterwards, the same day: each bio was written by ve-people bio_draft from the panel's transcript, read against it, and saved through
-- ve-people save, two lines reworded because the panel was recorded in spring 2020 (Marc's "latest film" is Butenland; Keegan's films
-- "under way"). Their moments are found by the content index's speaker labels:
update listings l set details = jsonb_set(l.details, '{person}', (l.details->'person') || jsonb_build_object('bio_source', 'transcript',
  'bio_sources', jsonb_build_array('Vegans Explore Podcast 57: Vegan Documentary Directors on How Films Change Food, Ethics, and the World'),
  'speaker_names', x.names::jsonb)), updated_at = now()
from (values ('keegan-kuhn', '["Keegan Kuhn"]'), ('shaun-monson', '["Shaun Monson"]'), ('louie-psihoyos', '["Louie Psihoyos"]'),
  ('marc-pierschel', '["Marc Pierschel", "Mark Pierschel"]')) x(slug, names)
where l.slug = x.slug and l.crawl_source = 'people';
-- Photos through ve-people photo_instagram, checked by eye: Shaun Monson (@shaunmonson) and Louie Psihoyos (@psihoyos) are them.
-- @blackrabbitimages is Marc's studio and its picture a rabbit logo, so it came off (details.logo_removed); Keegan Kuhn's account
-- was not found. Instagram's bio link for Shaun was a YouTube video, cleared as his website. Each a ve_listing_edits row.
update listings set logo_url = null, details = details || jsonb_build_object('logo_removed', logo_url), updated_at = now()
where slug = 'marc-pierschel' and logo_url like '%/media/people/marc-pierschel/%';
update listings set website = '', updated_at = now() where slug = 'shaun-monson' and website ilike '%youtu%';
