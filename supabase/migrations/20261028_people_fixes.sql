-- People, after the bio pass (2026-10-28). The transcripts moved 28 people to the section their interview puts them in; where both
-- read true, the section the seed gave them stays as a second one (extra_categories), and four lead with what they are best known for
-- (Dotsie Bausch an Olympian, Gwenna Hunter, Renee King-Sonnen and Jane Velez-Mitchell for their advocacy). Profiles that came from
-- the May import get an address from their name, not their Instagram handle. Four Instagram pictures checked by eye were not them, or
-- not a picture of them (Sailesh Rao, Feldi, James Wildman, Tim James): back to the letter until a real one is found.

update public.listings l set category = v.cat, extra_categories = v.extra, updated_at = now()
from (values
  ('Cyrus Khambatta', 'Founders', array['Health Experts']),
  ('Robby Barbaro', 'Founders', array['Health Experts']),
  ('Kwame Terra', 'Founders', array['Health Experts']),
  ('Charles Grippo', 'Chefs', array['Activists']),
  ('Jane Velez-Mitchell', 'Activists', array['Founders', 'Content Creators']),
  ('Renee King-Sonnen', 'Activists', array['Founders']),
  ('Shabnam Islam', 'Health Experts', array['Athletes']),
  ('John Lewis', 'Founders', array['Content Creators']),
  ('Kaie Alexander', 'Athletes', array['Content Creators']),
  ('Alex Lenghel', 'Chefs', array['Content Creators']),
  ('Alex Yabonk', 'Founders', array['Content Creators']),
  ('The Plant Chicks', 'Founders', array['Content Creators']),
  ('The Sustainable Duo', 'Activists', array['Content Creators']),
  ('Tim James', 'Health Experts', array['Founders']),
  ('Dominic Thompson', 'Founders', array['Activists']),
  ('Jeff Palmer', 'Founders', array['Activists']),
  ('Jordan David', 'Founders', array['Activists']),
  ('Margarita Restrepo', 'Founders', array['Activists']),
  ('Mari Mitrani', 'Physicians', array['Health Experts']),
  ('Gwenna Hunter', 'Activists', array['Founders']),
  ('Dotsie Bausch', 'Athletes', array['Founders', 'Activists']),
  ('Honey LaBronx', 'Activists', array['Content Creators']),
  ('Maxime Sigouin', 'Health Experts', array['Athletes']),
  ('Chris Moore', 'Athletes', array['Activists'])
) v(name, cat, extra)
where l.crawl_source = 'people' and l.name = v.name;

update public.listings l set slug = s.new_slug, updated_at = now()
from (select id, lower(btrim(regexp_replace(translate(name, 'ćĆ', 'cC'), '[^a-zA-Z0-9]+', '-', 'g'), '-')) as new_slug from public.listings
      where crawl_source = 'people' and details -> 'person' ->> 'added' like '%May import%') s
where l.id = s.id and l.slug <> s.new_slug and not exists (select 1 from public.listings x where x.slug = s.new_slug);

insert into public.ve_listing_edits (listing_id, member_id, field, old_value, new_value, meta)
select id, null, 'logo', to_jsonb(logo_url), null, '{"by": "ops", "where": "people photo check"}'::jsonb
from public.listings where crawl_source = 'people' and name in ('Sailesh Rao', 'Feldi', 'James Wildman', 'Tim James') and logo_url is not null;
update public.listings set logo_url = null,
  details = jsonb_set(details, '{person,photo_removed}', to_jsonb('Not them, checked by eye 2026-10-28: ' || coalesce(details -> 'person' ->> 'photo_source', ''))),
  updated_at = now()
where crawl_source = 'people' and name in ('Sailesh Rao', 'Feldi', 'James Wildman', 'Tim James') and logo_url is not null;
