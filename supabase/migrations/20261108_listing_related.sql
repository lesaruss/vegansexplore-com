-- ve-community-directory: every organization's page shows what connects to it (Sean, 2026-11-08: "the directory listing is designed for
-- discovery. So anytime we can have something that's related or connected, it needs to be there").
-- ve_listing_related(listing) returns, from a cache rebuilt by cron:
--   ours      our four shows' episodes that name the listing (ve_content_mentions, shown), each matched to its feed episode so it plays
--   elsewhere other Directory podcasts' episodes whose title or show notes name it (organizations and groups only)
--   people    People listings whose title or bio names it (organizations and groups only)
--   orgs      on a People listing: the organizations and groups its title or bio names (the reverse of people)
-- Names: the listing's name without "The" or a parenthesis, plus the same without a trailing Sanctuary / Rescue / Inc / Foundation /
-- Society, plus details.aka; two words and 9 letters or more, or an all-capitals name of 4 letters or more (PETA). Before matching, any
-- other listing's longer name that contains the phrase is blanked out, so "Farm Sanctuary" does not match "Woodstock Farm Sanctuary".

create table if not exists public.ve_listing_related_cache (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  built_at timestamptz not null default now()
);
alter table public.ve_listing_related_cache enable row level security;

create or replace function public.ve_listing_related_names(p_listing uuid)
returns table(phrase text, blank text[]) language sql stable security definer set search_path = public as $$
  with l as (select id, name, details from listings where id = p_listing),
  base as (select regexp_replace(btrim(regexp_replace(l.name, '\s*\(.*\)\s*', '', 'g')), '^the\s+', '', 'i') b, l.name, l.details from l),
  cand as (
    select lower(b) n, b orig from base
    union select lower(regexp_replace(b, '\s+(animal sanctuary|farm sanctuary|sanctuary|animal rescue|rescue|inc\.?|foundation|society|organization|org)$', '', 'i')),
                 regexp_replace(b, '\s+(animal sanctuary|farm sanctuary|sanctuary|animal rescue|rescue|inc\.?|foundation|society|organization|org)$', '', 'i') from base
    union select lower(a), a from base, jsonb_array_elements_text(coalesce(base.details->'aka', '[]'::jsonb)) a
  ),
  -- An all-capitals name counts only when it is the whole name (PETA, not the AVOCADO in "The AVOCADO Foundation"). A name made only of
  -- generic words ("animal advocates") is dropped, unless it is the full name and three words or more
  -- (Best Friends Animal Society) or an organization that goes by "The" (The Humane League).
  ok as (select distinct n from cand, base where ((n ~ '\S\s+\S' and length(n) >= 9) or (orig ~ '^[A-Z]{4,}$' and orig = base.b))
    and (exists (select 1 from regexp_split_to_table(n, '\s+') w where w not in ('animal','animals','welfare','rescue',
      'humane','farm','pet','pets','dog','dogs','cat','cats','wildlife','league','society','care','friends','best','house','home','hope','new',
      'life','love','vegan','vegans','the','of','and','for','center','project','alliance','coalition','network','fund','county','city','kind',
      'compassion','compassionate','action','rights','protection','shelter','haven','paws','plant','based','food','advocates','advocacy','people'))
      or (n = lower(base.b) and (base.name ~* '^the\s' or n ~ '\S+\s+\S+\s+\S'))))
  select ok.n, coalesce((select array_agg(distinct lower(regexp_replace(o.name, '\s*\(.*\)\s*', '', 'g')))
      from listings o where o.status = 'approved' and o.id <> p_listing
       and lower(o.name) like '%' || ok.n || '%' and lower(regexp_replace(regexp_replace(o.name, '\s*\(.*\)\s*', '', 'g'), '^the\s+', '', 'i')) <> ok.n), '{}')
  from ok;
$$;

-- Does a text name the listing? t is lower-cased; the blank list is removed first.
create or replace function public.ve_listing_related_hit(t text, phrase text, blank text[])
returns boolean language plpgsql immutable as $$
declare b text;
begin
  if t is null or t = '' then return false; end if;
  foreach b in array coalesce(blank, '{}') loop t := replace(t, b, ' '); end loop;
  return t ~ ('\m' || regexp_replace(phrase, '([.^$*+?()\[\]{}|\\])', '\\\1', 'g') || '\M');
end $$;

create or replace function public.ve_listing_related_build(p_listing uuid)
returns jsonb language plpgsql stable security definer set search_path = public, extensions as $$
declare
  l record; is_person boolean; is_org boolean; ours jsonb; elsewhere jsonb := '[]'; people jsonb := '[]'; orgs jsonb := '[]'; pnames text[] := '{}';
  ppl_cats text[] := array['Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders','Promoters'];
  org_cats text[] := array['Nonprofits','Rescues','Sanctuaries','Groups'];
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

  if is_person then
    -- The organizations and groups its title or bio names.
    select coalesce(jsonb_agg(jsonb_build_object('slug', o.slug) order by o.voter_count desc nulls last, o.name), '[]'::jsonb) into orgs
    from listings o where o.status = 'approved' and o.category = any(org_cats)
      and exists (select 1 from ve_listing_related_names(o.id) nm
        where ve_listing_related_hit(lower(coalesce(l.details->'person'->>'title','') || ' ' || coalesce((select description from listings where id = l.id),'')), nm.phrase, nm.blank));
  end if;

  return jsonb_build_object('ours', ours, 'elsewhere', elsewhere, 'people', people, 'orgs', orgs);
end $$;

create or replace function public.ve_listing_related(p_listing uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce((select data from ve_listing_related_cache where listing_id = p_listing), '{}'::jsonb);
$$;
grant execute on function public.ve_listing_related(uuid) to anon, authenticated;
revoke all on function public.ve_listing_related_build(uuid) from public, anon, authenticated;
revoke all on function public.ve_listing_related_names(uuid) from public, anon, authenticated;

-- Oldest first; organizations, groups and people first, then every listing our episodes name.
create or replace function public.ve_listing_related_refresh(p_n int default 15)
returns int language plpgsql security definer set search_path = public as $$
declare r record; k int := 0;
begin
  for r in
    select l.id from listings l left join ve_listing_related_cache c on c.listing_id = l.id
    where l.status = 'approved' and (
      l.category in ('Nonprofits','Rescues','Sanctuaries','Groups','Activists','Content Creators','Athletes','Physicians','Health Experts','Chefs','Founders','Promoters')
      or exists (select 1 from ve_content_mentions m where m.listing_id = l.id and m.status = 'shown'))
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

select cron.schedule('ve-listing-related', '*/5 * * * *', 'select public.ve_listing_related_refresh(15)');
