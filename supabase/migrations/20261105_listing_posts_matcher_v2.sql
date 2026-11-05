-- ve-social-studio: matcher v2 for Featured by us (Sean, 2026-11-05: "go ahead and fix the matcher").
-- What was wrong in v1 (ve_listing_posts_build, 2026-11-03):
--   1. One handle or website on several listings attached the post to all of them (PLANTA's handle on its main listing and three
--      locations; a person and their YouTube listing; peta.org also on the film Meet Your Meat). Now one owner per handle and per
--      website: the main listing over its locations, a person over their channel or book, any other listing over media, then most
--      votes, then the oldest.
--   2. Name matches on plain words ("choose whole foods", "grass fed", "your Super Bowl", "a bit of a health nut") and across
--      punctuation ("lovelife_cafe. You'll" as Cafe YOU, "NBC, Miami Marlins" as NBC Miami). A name now matches only when it is
--      written as a name in the caption (its words joined by spaces, apostrophes, hyphens, & or a period, never a comma or line
--      break, and the first real word capitalized) or as a handle (@angie.sadeghi).
--   4. An @handle written in the caption counts as a tag even when Instagram's own tag list for the post is empty (older posts).
--   3. "philly vegan" joins the stop list.
-- Hidden and removed rows are never rebuilt; shown rows the new rules no longer support are deleted, as in v1.

create or replace function public.ve_lp_titled(p_span text)
returns boolean language sql immutable as $$
  -- The first word that is not a small word (the, of, an...) must start with a capital or a digit.
  select coalesce((
    select w ~ '^[A-Z0-9]'
      from regexp_split_to_table(p_span, '[ ''’‘“”"`&+.-]+') with ordinality as t(w, ord)
     where w <> '' and lower(w) not in ('a','an','the','of','and','for','in','on','by','to','at','de','la','del','y','s','n')
     order by ord limit 1), false)
$$;

-- The match itself, without writing anything: one row per post and listing, with why it matched.
create or replace function public.ve_listing_posts_hits()
returns table(pid uuid, lid uuid, r text, m text)
language plpgsql stable security definer set search_path to 'public' as $function$
declare
  c_skip_slug constant text[] := array['vegans-explore-podcast', 'soflo-vegans-podcast', 'vegans-who-lift-podcast', 'pre-vegans-podcast', 'sean-russell'];
  c_skip_handle constant text[] := array['vegansexplore', 'soflovegans', 'seanarussell82'];
  c_stop constant text[] := array['the top', 'turning point', 'good karma', 'my vegan', 'vegan deli', 'vegan delights', 'pure kitchen', 'the game changers', 'what the health', 'philly vegan'];
  c_host constant text[] := array['youtube.com', 'youtu.be', 'instagram.com', 'facebook.com', 'tiktok.com', 'open.spotify.com', 'spotify.com',
    'podcasts.apple.com', 'apple.com', 'amazon.com', 'vegansexplore.com', 'lesaruss.com', 'lesaruss.ai', 'linktr.ee', 'beacons.ai', 'bit.ly',
    'squarespace.com', 'wixsite.com', 'wordpress.com', 'shopify.com', 'google.com', 'eventbrite.com', 'meetup.com'];
  c_people constant text[] := array['Activists', 'Content Creators', 'Athletes', 'Physicians', 'Health Experts', 'Chefs', 'Founders', 'Promoters'];
  c_media constant text[] := array['Podcasts', 'YouTube', 'Books', 'Documentaries & Films', 'News Outlets', 'Radio and TV', 'Media'];
begin
  return query
  with l0 as (
    select id, ve_ig_handle(instagram) as h,
           lower(regexp_replace(coalesce(website, ''), '^https?://(www\.)?([^/?#]+).*$', '\2')) as host,
           trim(regexp_replace(lower(name), '[^a-z0-9]+', ' ', 'g')) as nm,
           -- lower sorts first: the main listing, then a person, then anything but media, then votes, then the oldest
           array[case when parent_id is null then 0 else 1 end,
                 case when category = any (c_people) then 0 when category = any (c_media) then 2 else 1 end] as k1,
           coalesce(vote_count, 0) as votes, created_at
      from listings
     where status = 'approved' and slug <> all (c_skip_slug)
  ), l as (
    select l0.*,
           row_number() over (partition by h order by k1, votes desc, created_at, id) as h_rank,
           row_number() over (partition by host order by k1, votes desc, created_at, id) as host_rank
      from l0
  ), p as (
    select id, lower(coalesce(owner_username, '')) as owner, mentions, coalesce(caption, '') as cap0, lower(coalesce(caption, '')) as cap,
           ' ' || regexp_replace(lower(coalesce(caption, '')), '[^a-z0-9]+', ' ', 'g') || ' ' as capn
      from ve_instagram_posts where shortcode is not null
  ), hit as (
    select p.id as pid, l.id as lid, 'tag'::text as r, '@' || l.h as m, 1 as pri
      from p join l on l.h is not null and l.h_rank = 1 and l.h <> all (c_skip_handle)
                   and (exists (select 1 from unnest(p.mentions) x where lower(x) = l.h)
                        -- older captions tag people in the text and Instagram's own tag list for them is empty
                        or (position('@' || l.h in p.cap) > 0 and p.cap ~ ('@' || regexp_replace(l.h, '\.', '\\.', 'g') || '($|[^a-z0-9_.]|\.($|[^a-z0-9_]))')))
    union all
    select p.id, l.id, 'owner', '@' || l.h, 2
      from p join l on l.h is not null and l.h_rank = 1 and l.h <> all (c_skip_handle) and p.owner = l.h
    union all
    select p.id, l.id, 'link', l.host, 3
      from p join l on length(l.host) >= 6 and l.host like '%.%' and l.host_rank = 1 and l.host <> all (c_host) and position(l.host in p.cap) > 0
    union all
    select p.id, l.id, 'name', l.nm, 4
      from p join l on l.nm like '% %' and length(l.nm) >= 8 and l.nm <> all (c_stop) and l.nm !~ '^(my |the |a )?(vegan|plant based|plantbased) [a-z]+$'
                   and position(' ' || l.nm || ' ' in p.capn) > 0
     where exists (
       -- written as a name: words joined by spaces, apostrophes, hyphens, & or a period (never a comma or line break),
       -- the first real word capitalized
       select 1
         from regexp_matches(p.cap0, '\m' || array_to_string(string_to_array(l.nm, ' '), '[ ''’‘“”"`&+.-]+') || '\M', 'gi') as mm(a)
        where ve_lp_titled(mm.a[1])
     ) or p.cap ~ ('@' || array_to_string(string_to_array(l.nm, ' '), '[._]?') || '($|[^a-z0-9_.]|\.($|[^a-z0-9_]))')
       -- or written as a handle, @angie.sadeghi or @keegan_kuhn
  )
  select distinct on (hit.pid, hit.lid) hit.pid, hit.lid, hit.r, hit.m from hit order by hit.pid, hit.lid, hit.pri;
end $function$;
revoke all on function public.ve_listing_posts_hits() from public, anon, authenticated;

create or replace function public.ve_listing_posts_build()
returns integer language plpgsql security definer set search_path to 'public' as $function$
declare n int;
begin
  create temp table _lp_hit on commit drop as select * from ve_listing_posts_hits();

  -- A post already saved for another listing keeps its picture: Instagram's own links from the May scan have expired.
  insert into ve_listing_posts (listing_id, shortcode, post_url, post_type, caption, src_thumb_url, thumb_url, thumb_checked_at, posted_at,
                                like_count, comment_count, source, match_reason, matched, scraped_at)
  select h.lid, p.shortcode, p.post_url, p.post_type, left(p.caption, 2200), p.thumbnail_url,
         (select x.thumb_url from ve_listing_posts x where x.shortcode = p.shortcode and x.thumb_url is not null limit 1),
         (select x.thumb_checked_at from ve_listing_posts x where x.shortcode = p.shortcode and x.thumb_url is not null limit 1),
         p.posted_at,
         coalesce(p.like_count, 0), coalesce(p.comment_count, 0), 'ours', h.r, left(h.m, 200), p.scraped_at
    from _lp_hit h join ve_instagram_posts p on p.id = h.pid
  on conflict (listing_id, shortcode) do update
     set match_reason = excluded.match_reason, matched = excluded.matched,
         like_count = excluded.like_count, comment_count = excluded.comment_count, caption = excluded.caption, updated_at = now()
   where ve_listing_posts.status = 'shown' and ve_listing_posts.source = 'ours';
  get diagnostics n = row_count;

  delete from ve_listing_posts lp
   where lp.source = 'ours' and lp.status = 'shown'
     and not exists (select 1 from _lp_hit h join ve_instagram_posts p on p.id = h.pid where h.lid = lp.listing_id and p.shortcode = lp.shortcode);
  return n;
end $function$;
