-- signal: old links never land on a broken page (Sean, 2026-11-06: "let's fix it so that there's no one goes to a broken site, and if
-- they do go to a page that's not redirected somewhere, let's redirect them to the Explorer page... That way, they're all going through
-- that intake, and then we can monitor that over time").
--
-- Every old address (the WordPress site's /project/<slug>, its articles, categories, showcases, page/N) is sent to /api/gone, which
-- asks signal_resolve_old(path) where it should go:
--   1. signal_redirects, a hand-kept map (from_path -> to_path), first.
--   2. A listing: the slug (showcase suffixes and page/N stripped) as an approved listing, a merged copy's listing, or the closest
--      approved slug that starts with it, or the closest by trigram (0.64 or more) -> /directory/<slug>, 301.
--   3. A Pulse article with that slug, or the closest (0.6 or more) -> /pulse/<slug>, 301.
--   4. Anything else -> the Explorer intake, /passport?from=old-link (302), which says the page moved.
-- Every visit is a signal_old_hits row (bots flagged), so Signal can show how many people came through old links and where they went.

create table if not exists public.signal_redirects (
  from_path text primary key,          -- lower case, no host, no query, no trailing slash
  to_path text not null,
  note text,
  created_at timestamptz not null default now()
);
alter table public.signal_redirects enable row level security;

create table if not exists public.signal_old_hits (
  id bigint generated always as identity primary key,
  path text not null,
  target text not null,
  kind text not null,                 -- map | listing | pulse | explorer
  is_bot boolean not null default false,
  referrer_host text,
  at timestamptz not null default now()
);
alter table public.signal_old_hits enable row level security;
create index if not exists signal_old_hits_at on public.signal_old_hits (at desc);

create or replace function public.signal_map_lookup(p_path text) returns text language sql stable security definer set search_path = public as $f$
  select to_path from signal_redirects where from_path = p_path or from_path = regexp_replace(p_path, '/page/[0-9]+$', '') order by length(from_path) desc limit 1
$f$;
revoke all on function public.signal_map_lookup(text) from public;

create or replace function public.signal_resolve_old(p_path text, p_referrer text default null, p_bot boolean default false, p_log boolean default true)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_path text; v_seg text; v_slug text; v_hit text; v_kind text := 'explorer'; v_target text := '/passport?from=old-link';
  v_ref text;
begin
  v_path := lower(coalesce(p_path, ''));
  v_path := regexp_replace(v_path, '^https?://[^/]+', '');
  v_path := split_part(split_part(v_path, '?', 1), '#', 1);
  v_path := regexp_replace(v_path, '/+$', '');
  if v_path = '' then v_path := '/'; end if;
  if left(v_path, 1) <> '/' then v_path := '/' || v_path; end if;
  v_path := left(v_path, 400);

  -- 1. hand map
  v_hit := signal_map_lookup(v_path);  -- also tries the path without a trailing /page/N
  if v_hit is not null then v_kind := 'map'; v_target := v_hit; end if;

  -- the slug: last segment, with page/N and showcase suffixes taken off
  if v_kind = 'explorer' then
    v_seg := regexp_replace(v_path, '/page/[0-9]+$', '');
    v_seg := regexp_replace(v_seg, '^.*/', '');
    v_slug := regexp_replace(v_seg, '-(lifestyle-)?showcase-on-vegans?-explore$', '');
    v_slug := regexp_replace(v_slug, '[^a-z0-9-]', '', 'g');
  end if;

  -- 2. a listing (old directory pages, showcases, or any slug that is a listing)
  if v_kind = 'explorer' and length(v_slug) >= 3 then
    select slug into v_hit from listings where slug = v_slug and status = 'approved' limit 1;
    if v_hit is null then v_hit := ve_listing_merged_to(v_slug); end if;
    if v_hit is null and (v_path like '/project/%' or v_seg like '%showcase%') then
      if length(v_slug) >= 6 then
        select slug into v_hit from listings where status = 'approved' and slug like v_slug || '-%' order by length(slug), coalesce(vote_count, 0) desc limit 1;
      end if;
      if v_hit is null then
        select slug into v_hit from listings where status = 'approved' and similarity(slug, v_slug) >= 0.64
          order by similarity(slug, v_slug) desc, coalesce(vote_count, 0) desc limit 1;
      end if;
    end if;
    if v_hit is not null then v_kind := 'listing'; v_target := '/directory/' || v_hit; end if;
  end if;

  -- 3. a Pulse article
  if v_kind = 'explorer' and length(v_slug) >= 8 and v_path not like '/project/%' then
    select slug into v_hit from ve_pulse_content where slug = v_slug and status = 'published' limit 1;
    if v_hit is null then
      select slug into v_hit from ve_pulse_content where status = 'published' and similarity(slug, v_slug) >= 0.6
        order by similarity(slug, v_slug) desc limit 1;
    end if;
    if v_hit is not null then v_kind := 'pulse'; v_target := '/pulse/' || v_hit; end if;
  end if;

  if p_log then
    v_ref := nullif(lower(substring(coalesce(p_referrer, '') from '^https?://([^/:]+)')), '');
    insert into signal_old_hits (path, target, kind, is_bot, referrer_host) values (v_path, v_target, v_kind, coalesce(p_bot, false), left(v_ref, 120));
  end if;
  return jsonb_build_object('path', v_path, 'target', v_target, 'kind', v_kind, 'permanent', v_kind <> 'explorer');
end $$;

revoke all on function public.signal_resolve_old(text, text, boolean, boolean) from public;
grant execute on function public.signal_resolve_old(text, text, boolean, boolean) to anon, authenticated, service_role;

-- The hand map, seeded 2026-11-06: old city categories and regions to their chapter, old podcast categories to the show,
-- and the top old article (72,655 Google impressions) to our Pulse article on the same topic.
insert into public.signal_redirects (from_path, to_path, note)
select '/project_category/'||c, '/communities/south-florida', 'old city category' from unnest(array['boca-raton','boynton-beach','broward','cooper-city','coral-gables','dania-beach','davie','delray-beach','fort-lauderdale','hallandale','hollywood','kendall','lake-worth','miami-beach','miami-dade','miami','miramar','north-lauderdale','palm-beach-gardens','palm-beach','pompano-beach','riviera-beach','south-florida','tequesta','west-palm-beach','vendors-south-florida']) c
union all select '/project_category/'||c, '/communities/central-florida', 'old city category' from unnest(array['altamonte-springs','central-florida','orlando','st-petersburg','tampa']) c
union all select '/project_category/'||c, '/communities/new-york', 'old city category' from unnest(array['manhattan','new-york']) c
union all select * from (values
 ('/category/regions/atlanta','/communities/atlanta','old region'),
 ('/category/regions/los-angeles','/communities/los-angeles','old region'),
 ('/category/regions/new-york-city','/communities/new-york','old region'),
 ('/category/regions/north-america/florida/central-florida','/communities/central-florida','old region'),
 ('/category/regions/north-america/florida/north-florida','/communities/north-florida','old region'),
 ('/category/regions/north-america/florida/south-florida','/communities/south-florida','old region'),
 ('/category/regions/north-america/pennsylvania','/communities/philadelphia','old region'),
 ('/category/regions/north-america/pennsylvania/philadelphia','/communities/philadelphia','old region'),
 ('/category/podcasts','/media','old category'),
 ('/category/podcasts/pre-vegans-podcast','/directory/pre-vegans-podcast','old category'),
 ('/category/podcasts/soflo-vegans-podcast','/directory/soflo-vegans-podcast','old category'),
 ('/category/podcasts/vegans-who-lift','/directory/vegans-who-lift-podcast','old category'),
 ('/5-vegan-restaurants-with-michelin-star-ratings','/pulse/michelin-stars-vegan-fine-dining-rise','same topic, our Pulse article')) v(a,b,c)
on conflict (from_path) do nothing;

