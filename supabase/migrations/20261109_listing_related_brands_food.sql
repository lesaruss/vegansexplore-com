-- ve-community-directory: other shows now name brands and food places too, under a stricter rule (Sean approved 2026-11-08:
-- "Go on the name rule"; proposal docs/proposals/listing-related-name-rule.md). Applied through the one-time ve-once-related-names.
-- 1. Exact match as the business writes it (case-sensitive, whole words; an all-capitals name also matches its title case: PLANTA, Planta).
-- 2. A name of two or more words and 9+ letters counts unless every word is generic (Good Karma, Cool Beans, Grass Fed).
--    One-word and generic names count only from details.match_names, a list the team checks by hand.
-- 3. Food places (Restaurants ... Markets) also need their city in the same episode. A name on the checked list counts in an
--    episode title without the city (Vedge and V Street), never in the notes alone.
-- 4. Their website domain or @handle in the show notes counts on its own.
-- 5. A name in the notes of 5+ episodes of one show, never in a title, is a sponsor read: shown once, how 'sponsor'.
--    (Stricter than the proposal's 30% share: ad reads on long-running shows, such as Complement's, stay under 30%.)
--    A website matches only as a whole domain (kos.com never inside miyokos.com).
-- 7. A show whose own name contains the name never counts for it (Vedge Your Best Podcast is not Vedge).
-- 6. Locations are left to their main listing. The longer-name blank list still applies (Vedge Nutrition never counts as Vedge).

-- step: helpers
drop function if exists public.ve_listing_related_strict_names(uuid);
create or replace function public.ve_listing_related_strict_names(p_listing uuid)
returns table(phrase text, blank text[], need_city text, listed boolean) language sql stable security definer set search_path = public as $$
  with l as (select id, name, category, details, address_city from listings where id = p_listing),
  base as (select btrim(regexp_replace(regexp_replace(regexp_replace(l.name, '\s*\(.*\)\s*', '', 'g'), '\s+-\s+.*$', ''), '^the\s+', '', 'i')) b,
           l.details, l.address_city,
           l.category in ('Restaurants','Bakeries & Cafes','Food Trucks','Vendors','Catering','Meal Prep','Markets') is_food from l),
  cand as (
    select btrim(a) p, true listed from base, jsonb_array_elements_text(coalesce(base.details->'match_names', '[]'::jsonb)) a
    union select b, false from base
    union select btrim(a), false from base, jsonb_array_elements_text(coalesce(base.details->'aka', '[]'::jsonb)) a),
  ok as (select distinct on (p) p, listed from cand
    where p <> '' and (listed or (p ~ '\S\s+\S' and length(p) >= 9 and exists (select 1 from regexp_split_to_table(lower(p), '\s+') w
      where w not in ('the','of','and','a','an','in','on','my','our','your','so','co','co.','company','inc','inc.','llc','brand','brands',
        'vegan','vegans','plant','plants','based','plant-based','power','kitchen','cafe','café','food','foods','grill','juice','bar','bakery',
        'deli','house','garden','green','greens','fresh','healthy','good','kind','cool','beans','life','love','cuisine','eats','tasty','sweet',
        'organic','natural','raw','burger','burgers','pizza','taco','tacos','soul','thai','world','planet','vibes','something','sky','pie',
        'wild','fed','grass','future','karma','point','turning','project','nutrition','delicious','simply','real','true','pure','whole',
        'market','compassion','spot','place','joint','table','street','truck','catering','meals','meal','prep','co-op','shop','store'))))
    order by p, listed desc)
  select ok.p,
    coalesce((select array_agg(distinct x) from listings o,
        lateral (values (lower(regexp_replace(o.name, '\s*\(.*\)\s*', '', 'g'))),
                        (lower(regexp_replace(regexp_replace(o.name, '\s*\(.*\)\s*', '', 'g'), '\s+(podcast|show|radio)$', '', 'i')))) v(x)
      where o.status = 'approved' and o.id <> p_listing and lower(o.name) like '%' || lower(ok.p) || '%'
        and lower(btrim(regexp_replace(regexp_replace(regexp_replace(o.name, '\s*\(.*\)\s*', '', 'g'), '\s+-\s+.*$', ''), '^the\s+', '', 'i'))) <> lower(ok.p)
        and x <> lower(ok.p)), '{}'),
    case when base.is_food then nullif(btrim(base.address_city), '') end,
    ok.listed
  from ok, base
  where not (base.is_food and not ok.listed and nullif(btrim(base.address_city), '') is null);
$$;
revoke all on function public.ve_listing_related_strict_names(uuid) from public, anon, authenticated;

-- t is the episode's own text (not lower-cased). Curly apostrophes are straightened; the blank list is removed first.
create or replace function public.ve_listing_related_hit_strict(t text, phrase text, blank text[], need_city text)
returns boolean language plpgsql immutable as $$
declare b text; esc text; lt text;
begin
  if t is null or t = '' or phrase is null then return false; end if;
  t := replace(replace(t, '’', ''''), '‘', '''');
  lt := lower(t);
  if strpos(lt, lower(phrase)) = 0 then return false; end if;
  if need_city is not null and lt !~ ('\m' || regexp_replace(lower(need_city), '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\M') then return false; end if;
  foreach b in array coalesce(blank, '{}') loop
    t := regexp_replace(t, regexp_replace(b, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g'), ' ', 'gi');
  end loop;
  esc := regexp_replace(phrase, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g');
  if t ~ ('\m' || esc || '\M') then return true; end if;
  if phrase ~ '^[A-Z0-9 &''.-]+$' and phrase ~ '[A-Z]{3}' then
    return t ~ ('\m' || regexp_replace(initcap(phrase), '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\M');
  end if;
  return false;
end $$;

-- step: list
update listings set details = coalesce(details, '{}'::jsonb) || jsonb_build_object('match_names', to_jsonb(array[v.n]))
from (values ('oatly','Oatly'),('tofurky','Tofurky'),('miyokos','Miyoko''s'),('violife','Violife'),('gardein','Gardein'),('daiya','Daiya'),
  ('noshy','Noshy'),('maizly','Maizly'),('huel','Huel'),('milkadamia','Milkadamia'),('crackd','Crackd'),('nuzest','Nuzest'),
  ('so-delicious','So Delicious'),('just-egg','JUST Egg'),('vedge','Vedge'),('planta','PLANTA')) v(slug, n)
where listings.slug = v.slug and listings.status = 'approved' and not (coalesce(listings.details, '{}'::jsonb) ? 'match_names');

-- step: build
create or replace function public.ve_listing_related_strict_elsewhere(p_listing uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare l record; dom text; ig text; out jsonb;
begin
  select id, name, category, details, website, instagram, parent_id into l from listings where id = p_listing;
  if l.id is null or l.parent_id is not null then return '[]'::jsonb; end if;
  dom := lower(substring(coalesce(l.website, '') from '^(?:https?://)?(?:www\.)?([^/?#:]+)'));
  if dom is null or dom !~ '\.' or length(dom) < 6 or dom ~ '(facebook|instagram|linktr\.ee|vegansexplore|google|square\.site|wixsite|toasttab|clover|doordash|ubereats|grubhub|yelp|amazon|etsy|shopify|tiktok|youtube|linkedin|beacons|carrd)' then dom := null; end if;
  ig := lower(regexp_replace(coalesce(l.instagram, ''), '^.*instagram\.com/|^@|[/?].*$', '', 'g'));
  if length(ig) < 4 then ig := null; end if;
  with nm as (select * from ve_listing_related_strict_names(l.id)),
  showl as (select s.id, s.slug, s.name, coalesce(s.logo_url, f.image) image, f.episodes, jsonb_array_length(f.episodes) n_eps
    from listings s join ve_podcast_feeds f on f.listing_id = s.id
    where s.status = 'approved' and s.category = 'Podcasts' and s.id <> l.id
      and s.slug not in ('vegans-explore-podcast','soflo-vegans-podcast','vegans-who-lift-podcast','pre-vegans-podcast')
      and coalesce(s.details->>'family','') is distinct from coalesce(l.details->>'family','~')
      and not exists (select 1 from nm where strpos(lower(s.name), lower(nm.phrase)) > 0)),
  hits as (
    select distinct on (sl.id, e->>'guid') sl.id, sl.slug, sl.name, sl.image, sl.n_eps, e,
      exists (select 1 from nm where ve_listing_related_hit_strict(coalesce(e->>'title',''), nm.phrase, nm.blank, null)) featured
    from showl sl, jsonb_array_elements(sl.episodes) e
    where exists (select 1 from nm where ve_listing_related_hit_strict(coalesce(e->>'title','') || ' ' || coalesce(e->>'summary',''), nm.phrase, nm.blank, nm.need_city))
       or exists (select 1 from nm where nm.listed and ve_listing_related_hit_strict(coalesce(e->>'title',''), nm.phrase, nm.blank, null))
       or (dom is not null and strpos(lower(coalesce(e->>'summary','')), dom) > 0
           and lower(coalesce(e->>'summary','')) ~ ('(^|[^a-z0-9.-])' || regexp_replace(dom, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '([^a-z0-9-]|$)'))
       or (ig is not null and lower(coalesce(e->>'summary','')) ~ ('@' || regexp_replace(ig, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '([^a-z0-9._]|$)'))),
  per as (select id, count(*) filter (where not featured) notes_n, max(n_eps) n_eps from hits group by id),
  marked as (select h.*, (not h.featured and p.notes_n >= 5) sponsor from hits h join per p using (id)),
  kept as (select * from marked where not sponsor
    union all (select distinct on (id) * from marked where sponsor order by id, e->>'date' desc nulls last))
  select coalesce(jsonb_agg(j order by (j->>'how') <> 'featured', j->>'date' desc), '[]'::jsonb) into out from (
    select jsonb_build_object('title', e->>'title', 'date', e->>'date', 'guid', e->>'guid', 'audio', e->>'audio', 'image', e->>'image',
      'duration', e->'duration', 'how', case when featured then 'featured' when sponsor then 'sponsor' else 'mentioned' end,
      'show', jsonb_build_object('id', id, 'slug', slug, 'name', name, 'image', image)) j
    from kept order by featured desc, e->>'date' desc nulls last limit 40) q;
  return out;
end $$;
revoke all on function public.ve_listing_related_strict_elsewhere(uuid) from public, anon, authenticated;

-- step: wire
create or replace function public.ve_listing_related_build(p_listing uuid)
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare
  l record; is_person boolean; is_org boolean; ours jsonb; elsewhere jsonb := '[]'; people jsonb := '[]'; orgs jsonb := '[]'; pnames text[] := '{}';
  ppl_cats text[] := array['Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders','Promoters'];
  org_cats text[] := array['Nonprofits','Rescues','Sanctuaries','Groups'];
  strict_cats text[] := array['Food Brands','Nutrition & Supplements','Clothing and Fashion','Beauty and Personal Care',
    'Restaurants','Bakeries & Cafes','Food Trucks','Vendors','Catering','Meal Prep','Markets'];
begin
  select id, slug, name, category, details, status into l from listings where id = p_listing;
  if l.id is null or l.status <> 'approved' then return '{}'::jsonb; end if;
  is_person := l.category = any(ppl_cats);
  is_org := l.category = any(org_cats);

  -- Our shows: the episodes that name it, each matched to its feed episode (ve_pulse_episode_map) so it plays on the page.
  select coalesce(jsonb_agg(jsonb_build_object(
      'title', coalesce(m.episode->>'title', x.title), 'date', coalesce(m.episode->>'date', x.published_at::text),
      'guid', m.guid, 'audio', m.episode->>'audio', 'image', m.episode->>'image', 'duration', m.episode->'duration', 'pulse_slug', x.slug,
      'show', jsonb_build_object('id', s.id, 'slug', s.slug, 'name', s.name, 'image', coalesce(s.logo_url, f.image)))
    order by coalesce(m.episode->>'date', x.published_at::text) desc), '[]'::jsonb)
  into ours
  from ve_content_mentions c join ve_pulse_content x on x.id = c.content_id and x.podcast_show is not null and x.status = 'published'
  join ve_pulse_episode_map m on m.content_id = x.id and m.guid is not null
  join listings s on s.id = m.show_listing_id left join ve_podcast_feeds f on f.listing_id = s.id
  where c.listing_id = l.id and c.status = 'shown' and not is_person;

  if is_org then
    -- People whose title or bio names it.
    with nm as (select * from ve_listing_related_names(l.id))
    select coalesce(jsonb_agg(jsonb_build_object('slug', p.slug, 'role', p.details->'person'->>'title') order by not exists (select 1 from nm n2 where ve_listing_related_hit(lower(coalesce(p.details->'person'->>'title','')), n2.phrase, n2.blank)), p.voter_count desc nulls last, p.name), '[]'::jsonb)
    into people
    from listings p where p.status = 'approved' and p.category = any(ppl_cats)
      and exists (select 1 from nm where ve_listing_related_hit(lower(coalesce(p.details->'person'->>'title','') || ' ' || coalesce(p.description,'')), nm.phrase, nm.blank));
    select coalesce(array_agg(lower(regexp_replace(regexp_replace(p.name, '\s*\(.*\)\s*', '', 'g'), '^(Dr\.?|Chef)\s+', '', 'i'))), '{}') into pnames
    from listings p join jsonb_array_elements(people) j on j->>'slug' = p.slug where p.status = 'approved';
    -- Other Directory podcasts that name it, newest first, 40 at most; never the listing's own show.
    with nm as (select * from ve_listing_related_names(l.id)),
    showl as (select s.id, s.slug, s.name, coalesce(s.logo_url, f.image) image, f.episodes from listings s join ve_podcast_feeds f on f.listing_id = s.id
      where s.status = 'approved' and s.category = 'Podcasts' and s.id <> l.id
        and s.slug not in ('vegans-explore-podcast','soflo-vegans-podcast','vegans-who-lift-podcast','pre-vegans-podcast')
        and coalesce(s.details->>'family','') is distinct from coalesce(l.details->>'family','~')),
    -- 'featured' when the episode's title names it or one of its people, 'mentioned' when only its show notes do; featured first.
    hits as (
      select distinct on (sl.id, e->>'guid') sl.id, sl.slug, sl.name, sl.image, e,
        (exists (select 1 from nm where ve_listing_related_hit(lower(coalesce(e->>'title','')), nm.phrase, nm.blank))
          or exists (select 1 from unnest(pnames) pn where lower(coalesce(e->>'title','')) like '%' || pn || '%')) as featured
      from showl sl, jsonb_array_elements(sl.episodes) e
      where exists (select 1 from nm where ve_listing_related_hit(lower(coalesce(e->>'title','') || ' ' || coalesce(e->>'summary','')), nm.phrase, nm.blank))
    )
    select coalesce(jsonb_agg(j order by (j->>'how') = 'mentioned', j->>'date' desc), '[]'::jsonb) into elsewhere from (
      select jsonb_build_object('title', e->>'title', 'date', e->>'date', 'guid', e->>'guid', 'audio', e->>'audio', 'image', e->>'image',
        'duration', e->'duration', 'how', case when featured then 'featured' else 'mentioned' end,
        'show', jsonb_build_object('id', id, 'slug', slug, 'name', name, 'image', image)) j
      from hits order by featured desc, e->>'date' desc nulls last limit 40) q;

  end if;

  -- Brands and food places: other shows under the stricter rule (20261109_listing_related_brands_food.sql).
  if not is_org and not is_person and l.category = any(strict_cats) then elsewhere := ve_listing_related_strict_elsewhere(l.id); end if;

  if is_person then
    -- The organizations and groups its title or bio names.
    select coalesce(jsonb_agg(jsonb_build_object('slug', o.slug) order by o.voter_count desc nulls last, o.name), '[]'::jsonb) into orgs
    from listings o where o.status = 'approved' and o.category = any(org_cats)
      and exists (select 1 from ve_listing_related_names(o.id) nm
        where ve_listing_related_hit(lower(coalesce(l.details->'person'->>'title','') || ' ' || coalesce((select description from listings where id = l.id),'')), nm.phrase, nm.blank));
  end if;

  return jsonb_build_object('ours', ours, 'elsewhere', elsewhere, 'people', people, 'orgs', orgs);
end $$;

create or replace function public.ve_listing_related_refresh(p_n int default 15)
returns int language plpgsql security definer set search_path = public as $$
declare r record; k int := 0;
begin
  for r in
    select l.id from listings l left join ve_listing_related_cache c on c.listing_id = l.id
    where l.status = 'approved' and (
      l.category in ('Nonprofits','Rescues','Sanctuaries','Groups','Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders','Promoters')
      or exists (select 1 from ve_content_mentions m where m.listing_id = l.id and m.status = 'shown')
      or (l.parent_id is null and l.category in ('Food Brands','Nutrition & Supplements','Clothing and Fashion','Beauty and Personal Care',
            'Restaurants','Bakeries & Cafes','Food Trucks','Vendors','Catering','Meal Prep','Markets')
          and not (coalesce(l.tags, '{}') && array['ve-grocery-store','lesaruss-ai-directory','lesaruss-ai-directory-candidate'])))
      and (c.built_at is null or c.built_at < now() - interval '1 day')
    order by c.built_at nulls first limit p_n
  loop
    insert into ve_listing_related_cache(listing_id, data, built_at) values (r.id, ve_listing_related_build(r.id), now())
      on conflict (listing_id) do update set data = excluded.data, built_at = excluded.built_at;
    k := k + 1;
  end loop;
  return k;
end $$;
revoke all on function public.ve_listing_related_refresh(int) from public, anon, authenticated;

-- step: cron
-- About 2,000 listings now, about half a second each: every 15 minutes, 25 at a time, so each is rebuilt about once a day.
select cron.alter_job((select jobid from cron.job where jobname = 've-listing-related'), schedule := '7,22,37,52 * * * *');
