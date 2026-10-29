-- People in the film (Sean, 2026-10-29: "a section on it for the people that appear in the podcast... their same tile that we have in
-- their directory featured on their page. So they could even vote for them... look at the IMDb to see who's listed in that,
-- cross-reference it with who we've interviewed"). listings.details.film_people [{person, role}]: a People listing (its slug) who made
-- the film or is in it, drawn with the Directory's own card (votes and all) by loadFilmPeople in directory/listing.html. Each was checked
-- against the film's cast the same day (IMDb and Wikipedia were not reachable from the build session, so through published cast
-- listings): Klaper in What the Health and Cowspiracy; Barnard in What the Health, Forks Over Knives, Eating You Alive and They're Trying
-- to Kill Us; Joel Kahn in What the Health; Dotsie Bausch in The Game Changers; John Lewis directed and leads They're Trying to Kill Us.
-- Not found in any cast listing, so left out: Torre Washington in The Game Changers.
-- Joel Kahn's SoFlo episode joins What the Health's podcasts (details.film_podcasts).
with p(slug, person, role) as (values
  ('what-the-health', 'michael-klaper', 'In the film'),
  ('what-the-health', 'neal-barnard', 'In the film'),
  ('what-the-health', 'joel-kahn', 'In the film'),
  ('cowspiracy', 'michael-klaper', 'In the film'),
  ('forks-over-knives', 'neal-barnard', 'In the film'),
  ('eating-you-alive', 'neal-barnard', 'In the film'),
  ('theyre-trying-to-kill-us', 'john-lewis', 'Director'),
  ('theyre-trying-to-kill-us', 'neal-barnard', 'In the film'),
  ('the-game-changers', 'dotsie-bausch', 'In the film')
),
agg as (select slug, jsonb_agg(jsonb_build_object('person', person, 'role', role) order by (role = 'Director') desc, person) j from p group by slug)
update listings l set details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('film_people', agg.j), updated_at = now()
from agg where l.slug = agg.slug and l.status = 'approved' and l.category = 'Documentaries & Films';

update listings set details = jsonb_set(details, '{film_podcasts}', details->'film_podcasts' || jsonb_build_array(jsonb_build_object(
    'show', 'soflo-vegans-podcast', 'guid', 'tag:soundcloud,2010:tracks/760841980', 'with', 'Dr. Joel Kahn, in the film', 'person', 'joel-kahn'))),
  updated_at = now()
where slug = 'what-the-health' and status = 'approved' and category = 'Documentaries & Films'
  and not (details->'film_podcasts') @> '[{"guid": "tag:soundcloud,2010:tracks/760841980"}]';
