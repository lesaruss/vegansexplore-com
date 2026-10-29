-- Our podcast on film pages (Sean, 2026-10-29: "For the documentaries, be sure to include the podcasts that I did with the directors on
-- the films... And then there's a few doctors that appeared in these films as well... anyone else that's been in a documentary, we
-- should have their podcast listed on those pages").
-- listings.details.film_podcasts [{show, guid, with, person?}]: an episode of ours, by its show's Directory slug and its feed guid
-- (ve_podcast_feeds), with who in it made or is in the film. Drawn by loadFilmPods in directory/listing.html, which reads each episode
-- through ve-podcast `episode` and plays it in the docked player. The guids are the ones the People pages already match
-- (ve_person_episodes_cache); the directors panel (Vegans Explore Podcast 57: Shaun Monson, Louie Psihoyos, Marc Pierschel, Keegan Kuhn)
-- has no People listings, so its guid was matched by title. Who is in which film was checked against each film's cast the same day:
-- Klaper in What the Health and Cowspiracy; Barnard in What the Health, Forks Over Knives, Eating You Alive and They're Trying to Kill
-- Us; Dotsie Bausch in The Game Changers; Keegan Kuhn co-directed Cowspiracy, What the Health and They're Trying to Kill Us. Barnard's
-- 2019 SoFlo episode is left out: no feed episode is matched to it.
with pod(k, show, guid, person) as (values
  ('panel',   'vegans-explore-podcast', '3cdcbc52-8cd0-4b0e-9327-202fd8d47039', null),
  ('klaper1', 'soflo-vegans-podcast',   'tag:soundcloud,2010:tracks/601615119', 'michael-klaper'),
  ('klaper2', 'vegans-explore-podcast', '779f25d1-b411-4985-bde4-6a59deba0589', 'michael-klaper'),
  ('klaper3', 'vegans-explore-podcast', '3a286bfd-97f9-4c27-85b8-099556740015', 'michael-klaper'),
  ('klaper4', 'vegans-explore-podcast', '05119b80-c7fc-4c95-ac1d-b4fbaab76f69', 'michael-klaper'),
  ('barnard', 'vegans-explore-podcast', 'b8615f03-7837-443c-aa43-7e98cf83cda3', 'neal-barnard'),
  ('dotsie1', 'soflo-vegans-podcast',   'e122657e-793c-48fc-91d5-794d88be4923', 'dotsie-bausch'),
  ('dotsie2', 'vegans-explore-podcast', '9ff7e9a2-8e55-49a9-bbaf-6fa7fe5a5c01', 'dotsie-bausch'),
  ('lewis1',  'soflo-vegans-podcast',   'e9ea10f9-ef41-4425-9ea6-06705ef38816', 'john-lewis'),
  ('lewis2',  'vegans-explore-podcast', '9b87c237-6b29-42f9-8002-2dae81dcaada', 'john-lewis')
),
film(slug, k, who) as (values
  ('earthlings', 'panel', 'Shaun Monson, director'),
  ('the-game-changers', 'panel', 'Louie Psihoyos, director'),
  ('the-game-changers', 'dotsie1', 'Dotsie Bausch, in the film'),
  ('the-game-changers', 'dotsie2', 'Dotsie Bausch, in the film'),
  ('live-and-let-live', 'panel', 'Marc Pierschel, director'),
  ('the-end-of-meat', 'panel', 'Marc Pierschel, director'),
  ('cowspiracy', 'panel', 'Keegan Kuhn, co-director'),
  ('cowspiracy', 'klaper1', 'Dr. Michael Klaper, in the film'),
  ('cowspiracy', 'klaper2', 'Dr. Michael Klaper, in the film'),
  ('cowspiracy', 'klaper3', 'Dr. Michael Klaper, in the film'),
  ('cowspiracy', 'klaper4', 'Dr. Michael Klaper, in the film'),
  ('what-the-health', 'panel', 'Keegan Kuhn, co-director'),
  ('what-the-health', 'klaper1', 'Dr. Michael Klaper, in the film'),
  ('what-the-health', 'klaper2', 'Dr. Michael Klaper, in the film'),
  ('what-the-health', 'klaper3', 'Dr. Michael Klaper, in the film'),
  ('what-the-health', 'klaper4', 'Dr. Michael Klaper, in the film'),
  ('what-the-health', 'barnard', 'Dr. Neal Barnard, in the film'),
  ('theyre-trying-to-kill-us', 'lewis1', 'John Lewis, director'),
  ('theyre-trying-to-kill-us', 'lewis2', 'John Lewis, director'),
  ('theyre-trying-to-kill-us', 'panel', 'Keegan Kuhn, co-director'),
  ('theyre-trying-to-kill-us', 'barnard', 'Dr. Neal Barnard, in the film'),
  ('forks-over-knives', 'barnard', 'Dr. Neal Barnard, in the film'),
  ('eating-you-alive', 'barnard', 'Dr. Neal Barnard, in the film')
),
agg as (
  select f.slug, jsonb_agg(jsonb_strip_nulls(jsonb_build_object('show', p.show, 'guid', p.guid, 'with', f.who, 'person', p.person))
    order by (f.who ~ 'director') desc, f.k) j
  from film f join pod p on p.k = f.k group by f.slug
)
update listings l set details = coalesce(l.details, '{}'::jsonb) || jsonb_build_object('film_podcasts', agg.j), updated_at = now()
from agg where l.slug = agg.slug and l.status = 'approved' and l.category = 'Documentaries & Films';
