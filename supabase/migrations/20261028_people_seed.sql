-- The People directory's first profiles (Sean, 2026-10-28: "inventory people we've interviewed already on the podcast and then populate
-- their profiles that way"). Everyone who was a guest on one of our shows, by name in the episode's guest or title, each credited with
-- those episodes; John Thomas and Brooke Sellers host Vegans Who Lift, so every episode is theirs as Host; John and Ella Magers were at
-- Vegan Foodie Fest Miami (2025-02-23, the run of show: John co-produced and hosted, Ella held a meet and greet). The section is each
-- person's best fit by name; the bio pass (ve-people bio_draft with recategorize) moves anyone the transcripts place elsewhere.
-- People not interviewed (Tabitha Brown, a story about her) and businesses (Love Life Cafe, Maizly...) are left out.

-- In their words: moments from their credited episodes in the content index, where the speaker is them (details.person.speaker_names,
-- else their last name), at most three an episode.
create or replace function public.ve_person_moments(p_listing uuid)
returns table (start_s numeric, end_s numeric, quote text, summary text, title text, youtube_id text, slug text)
language sql stable security definer set search_path = public as $$
  with p as (
    select l.id, coalesce(
      (select array_agg(lower(x)) from jsonb_array_elements_text(l.details -> 'person' -> 'speaker_names') x),
      array[lower(regexp_replace(btrim(regexp_replace(l.name, '\s*\(.*\)\s*', '', 'g')), '^.*\s', ''))]) as names
    from listings l where l.id = p_listing and l.status = 'approved'
  ), ranked as (
    select m.start_s, m.end_s, m.quote, m.summary, m.title, m.youtube_id, m.slug, m.content_id,
      row_number() over (partition by m.content_id order by m.end_s - m.start_s desc) as rn
    from p join ve_person_credits c on c.listing_id = p.id and c.kind = 'episode'
    join ve_content_moments_live m on m.content_id = c.content_id
    where exists (select 1 from unnest(p.names) n where length(n) > 2 and position(n in lower(m.speaker)) > 0)
  )
  select start_s, end_s, quote, summary, title, youtube_id, slug from ranked where rn <= 3 order by content_id, start_s limit 9;
$$;
revoke all on function public.ve_person_moments(uuid) from public;
grant execute on function public.ve_person_moments(uuid) to anon, authenticated;

with people(name, category, pats, role) as (values
  ('Neal Barnard', 'Physicians', array['%Neal Barnard%'], 'Guest'),
  ('Michael Klaper', 'Physicians', array['%Klaper%'], 'Guest'),
  ('Joel Kahn', 'Physicians', array['%Joel Kahn%'], 'Guest'),
  ('Angie Sadeghi', 'Physicians', array['%Angie Sadeghi%'], 'Guest'),
  ('Aaron Spitz', 'Physicians', array['%Aaron Spitz%'], 'Guest'),
  ('Will Bulsiewicz', 'Physicians', array['%Bulsiewicz%'], 'Guest'),
  ('Lakshman Mulpuri', 'Physicians', array['%Mulpuri%'], 'Guest'),
  ('Mari Mitrani', 'Health Experts', array['%Mari Mitrani%'], 'Guest'),
  ('Angela Crawford', 'Health Experts', array['%Angela Crawford%'], 'Guest'),
  ('Desiree Nielsen', 'Health Experts', array['%Desiree Nielsen%'], 'Guest'),
  ('Cyrus Khambatta', 'Health Experts', array['%Khambatta%'], 'Guest'),
  ('Robby Barbaro', 'Health Experts', array['%Robby Barbaro%'], 'Guest'),
  ('Evie Kevish', 'Health Experts', array['%Evie Kevish%'], 'Guest'),
  ('Tabay Atkins', 'Health Experts', array['%Tabay Atkins%'], 'Guest'),
  ('Kwame Terra', 'Health Experts', array['%Kwame Terra%'], 'Guest'),
  ('James and Dahlia Marin', 'Health Experts', array['%Dahlia Marin%'], 'Guest'),
  ('Sailesh Rao', 'Activists', array['%Sailesh Rao%'], 'Guest'),
  ('Earthling Ed', 'Activists', array['%Earthling Ed%'], 'Guest'),
  ('Ingrid Newkirk', 'Activists', array['%Ingrid Newkirk%'], 'Guest'),
  ('Charles Grippo', 'Activists', array['%Charles Grippo%'], 'Guest'),
  ('Susan Hargraves', 'Activists', array['%Susan Hargraves%'], 'Guest'),
  ('Jane Velez-Mitchell', 'Activists', array['%Velez-Mitchell%'], 'Guest'),
  ('Gail Eisnitz', 'Activists', array['%Eisnitz%'], 'Guest'),
  ('Vicky Bond', 'Activists', array['%Vicky Bond%'], 'Guest'),
  ('James Wildman', 'Activists', array['%James Wildman%'], 'Guest'),
  ('Renee King-Sonnen', 'Activists', array['%King-Sonnen%'], 'Guest'),
  ('Gwenna Hunter', 'Activists', array['%Gwen%a Hunter%'], 'Guest'),
  ('Sarina Farb', 'Activists', array['%Sarina Farb%'], 'Guest'),
  ('Dotsie Bausch', 'Athletes', array['%Dotsie Bausch%'], 'Guest'),
  ('Torre Washington', 'Athletes', array['%Torre Washington%', '%Tory Washington%'], 'Guest'),
  ('Korin Sutton', 'Athletes', array['%Korin Sutton%'], 'Guest'),
  ('Robert Cheeke', 'Athletes', array['%Robert Cheeke%'], 'Guest'),
  ('Natalie Matthews', 'Athletes', array['%Natalie Matthews%'], 'Guest'),
  ('Giacomo Marchese', 'Athletes', array['%Giacomo Marchese%'], 'Guest'),
  ('Nick Squire', 'Athletes', array['%Nick Squire%'], 'Guest'),
  ('Ben Mitchell', 'Athletes', array['%Ben Mitchell%'], 'Guest'),
  ('Ashley King', 'Athletes', array['%Ashley King%'], 'Guest'),
  ('Tomi Jessen', 'Athletes', array['%Tomi Jessen%'], 'Guest'),
  ('Omar Glaspy', 'Athletes', array['%Omar Glaspy%'], 'Guest'),
  ('Ella Magers', 'Athletes', array['%Ella Magers%'], 'Guest'),
  ('Maxime Sigouin', 'Athletes', array['%Maxime Sigouin%'], 'Guest'),
  ('Shabnam Islam', 'Athletes', array['%Shabnam Islam%'], 'Guest'),
  ('Buff Vegan Barbie', 'Athletes', array['%Buff Vegan Barbie%'], 'Guest'),
  ('John Thomas', 'Athletes', array['%John Thomas%', '%Bodybuilding Vegan%'], 'Guest'),
  ('Brooke Sellers', 'Athletes', array['%Brooke Sellers%', '%Miss Meatless Muscle%'], 'Guest'),
  ('John Lewis', 'Content Creators', array['%John Lewis%'], 'Guest'),
  ('Jason Kartalian', 'Content Creators', array['%Kartalian%'], 'Guest'),
  ('Keya, VeganKween', 'Content Creators', array['%VeganKween%'], 'Guest'),
  ('Kaie Alexander', 'Content Creators', array['%Kaie Alexander%'], 'Guest'),
  ('Alex Lenghel', 'Content Creators', array['%Alex Lenghel%'], 'Guest'),
  ('Alex Yabonk', 'Content Creators', array['%Yabonk%'], 'Guest'),
  ('Feldi', 'Content Creators', array['%Feldi%'], 'Guest'),
  ('Honey LaBronx', 'Content Creators', array['%Honey LaBronx%'], 'Guest'),
  ('The Plant Chicks', 'Content Creators', array['%Plant Chicks%'], 'Guest'),
  ('The Sustainable Duo', 'Content Creators', array['%Sustainable Duo%'], 'Guest'),
  ('Plantbased in the Burbs', 'Content Creators', array['%Plantbased in the Burbs%'], 'Guest'),
  ('Chef Babette', 'Chefs', array['%Babette%'], 'Guest'),
  ('Chef Robyn', 'Chefs', array['%Chef Robyn%'], 'Guest'),
  ('Jenny Stojkovic', 'Founders', array['%Stojkovic%'], 'Guest'),
  ('Tim James', 'Founders', array['%Tim James%'], 'Guest'),
  ('Brighde Reed', 'Founders', array['%Brighde Reed%'], 'Guest'),
  ('Sandra Nomoto', 'Founders', array['%Sandra Nomoto%'], 'Guest'),
  ('Allen Zelden', 'Founders', array['%Allen Zelden%'], 'Guest'),
  ('Veronica Menin', 'Founders', array['%Veronica Menin%'], 'Guest'),
  ('Noah Hyams', 'Founders', array['%Noah Hyams%'], 'Guest'),
  ('Brett Christoffel', 'Founders', array['%Brett Christoffel%'], 'Guest'),
  ('Vladimir Mićković', 'Founders', array['%Mićković%', '%Mickovic%'], 'Guest'),
  ('Jacobo Garcia', 'Founders', array['%Jacobo Garcia%'], 'Guest'),
  ('Dani Taylor', 'Founders', array['%Dani Taylor%'], 'Guest'),
  ('Chris Moore', 'Activists', array['%Chris Moore%'], 'Guest'),
  ('Dominic Thompson', 'Activists', array['%Dominic Thompson%'], 'Guest'),
  ('Gad Hakimi', 'Activists', array['%Gad Hakimi%'], 'Guest'),
  ('Jeff Palmer', 'Activists', array['%Jeff Palmer%'], 'Guest'),
  ('Jonny Juicer', 'Content Creators', array['%Jonny Juicer%'], 'Guest'),
  ('Jordan David', 'Activists', array['%Jordan David%'], 'Guest'),
  ('Liz Jones', 'Activists', array['%Liz Jones%'], 'Guest'),
  ('Margarita Restrepo', 'Activists', array['%Margarita Restrepo%'], 'Guest'),
  ('Rachel Black', 'Activists', array['%Rachel Black%'], 'Guest'),
  ('Richard "Kudo" Couto', 'Activists', array['%Couto%'], 'Guest')
), slugged as (
  select p.*, lower(btrim(regexp_replace(translate(p.name, 'ćĆ', 'cC'), '[^a-zA-Z0-9]+', '-', 'g'), '-')) as base from people p
), ins as (
  insert into public.listings (name, slug, category, specialty, description, status, website, location, initials, crawl_source, communities, vegan_status, details)
  select s.name, case when exists (select 1 from listings x where x.slug = s.base) then s.base || '-vegans-explore' else s.base end,
    s.category, '', '', 'approved', '', 'Online', upper(left(s.name, 1)), 'people', array['all'], null,
    jsonb_build_object('person', jsonb_build_object('added', 'podcast guests, 2026-10-28'))
  from slugged s
  where exists (select 1 from ve_pulse_content c where c.status = 'published' and c.podcast_show is not null
                  and (c.guest_name ilike any (s.pats) or c.title ilike any (s.pats)))
    -- Not twice, and never against the one-name-per-place rule (a listing with this name and no city, quarantined ones included).
    and not exists (select 1 from listings x where lower(btrim(x.name)) = lower(s.name) and coalesce(x.address_city, '') = ''
                      and coalesce(x.address_state, '') = '' and x.status <> 'rejected')
  returning id, name
)
insert into public.ve_person_credits (listing_id, kind, role, content_id, happened_on)
select i.id, 'episode', p.role, c.id, c.published_at::date
from ins i join people p on p.name = i.name
join ve_pulse_content c on c.status = 'published' and c.podcast_show is not null and (c.guest_name ilike any (p.pats) or c.title ilike any (p.pats))
on conflict do nothing;

-- The hosts of Vegans Who Lift: every episode.
insert into public.ve_person_credits (listing_id, kind, role, content_id, happened_on)
select l.id, 'episode', 'Host', c.id, c.published_at::date
from listings l join ve_pulse_content c on c.status = 'published' and c.podcast_show = 'Vegans Who Lift Podcast'
where l.crawl_source = 'people' and l.name in ('John Thomas', 'Brooke Sellers')
on conflict (listing_id, kind, content_id) do update set role = 'Host';

-- Vegan Foodie Fest Miami (the run of show in Sean's Drive).
insert into public.ve_person_credits (listing_id, kind, role, title, happened_on, note)
select l.id, 'event', x.role, 'Vegan Foodie Fest Miami', date '2025-02-23', x.note
from listings l join (values
  ('John Thomas', 'Co-producer and host', 'Produced it with Vegans Explore and Florida Marketplace Group; hosted the day and a meet and greet at his tent.'),
  ('Ella Magers', 'Special guest', 'A meet and greet in the second-floor media lounge.')
) x(name, role, note) on x.name = l.name
where l.crawl_source = 'people'
  and not exists (select 1 from ve_person_credits c where c.listing_id = l.id and c.kind = 'event' and c.title = 'Vegan Foodie Fest Miami');
