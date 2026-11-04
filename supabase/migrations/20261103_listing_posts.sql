-- The Social tab on every listing (Sean, 2026-11-03: "a Social tab on every Directory listing... Featured by us, pinned first... Their top
-- posts from their own Instagram"; then "get unlocked once somebody claims their profile... if there's a way for them to input the
-- information, and then it does it").
--
-- Logan's defaults, Sean's to change:
--   1. One row a post a listing (ve_listing_posts). source 'ours' = a post on @vegansexplore or @soflovegans that features the listing
--      (matched from ve_instagram_posts by ve_listing_posts_build); source 'theirs' = a post from the listing's own Instagram, fetched
--      only for a CLAIMED listing, from the handle its owner gives us (ve-listing-posts), and only while listing_social.scrape_on is true.
--   2. Matching copies ve_content_mentions_build: a tagged handle, a post by the listing's own handle (a collab), the listing's website
--      linked in the caption, then its full name as whole words (never a one-word name, a stop list). A removed or owner-hidden row is
--      never rebuilt. Our own shows and hosts are left out (their posts are the feed itself).
--   3. "Top" is the top of the recent posts the scraper returns (about 30 to 50), by likes plus comments. Views only where a source
--      gives them (view_count null otherwise).
--   4. Instagram picture links expire, so every thumbnail is copied into our storage (vegan-media/media/social-posts/); a tile with no
--      copy yet shows the caption and numbers, never a broken picture. The May 2026 scan's links had all expired by 2026-05-13.
-- RLS on. Anyone reads the shown rows; everything else goes through the service role. Safe to run twice.

create or replace function ve_ig_handle(t text) returns text
language sql immutable as $$
  select case when h ~ '^[a-z0-9._]{1,30}$' then h else null end
  from (select lower(regexp_replace(regexp_replace(ltrim(trim(coalesce(t, '')), '@'), '^.*instagram\.com/+', ''), '[/?#@\s].*$', '')) as h) x
$$;

create table if not exists ve_listing_posts (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  network text not null default 'instagram' check (network in ('instagram')),
  shortcode text not null,
  post_url text not null,
  post_type text,
  caption text,
  src_thumb_url text,
  thumb_url text,
  thumb_checked_at timestamptz,
  thumb_error text,
  posted_at timestamptz,
  like_count int not null default 0,
  comment_count int not null default 0,
  view_count int,
  source text not null check (source in ('ours', 'theirs')),
  match_reason text check (match_reason in ('tag', 'owner', 'link', 'name', 'handle')),
  matched text,
  status text not null default 'shown' check (status in ('shown', 'hidden', 'removed')),
  pinned boolean not null default false,
  scraped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, shortcode)
);
create index if not exists ve_listing_posts_listing_idx on ve_listing_posts (listing_id, source) where status = 'shown';
create index if not exists ve_listing_posts_thumb_idx on ve_listing_posts (thumb_checked_at nulls first) where thumb_url is null and status = 'shown';
alter table ve_listing_posts enable row level security;
drop policy if exists "shown posts are public" on ve_listing_posts;
create policy "shown posts are public" on ve_listing_posts for select using (status = 'shown');

-- The handle a claimed owner gave us, and when we last fetched their posts.
create table if not exists ve_listing_social (
  listing_id uuid primary key references listings(id) on delete cascade,
  instagram_handle text not null,
  set_by uuid,
  set_at timestamptz not null default now(),
  last_fetch_at timestamptz,
  last_fetch_note text,
  last_manual_refresh_at timestamptz,
  fetch_fails int not null default 0
);
alter table ve_listing_social enable row level security;

insert into ve_site_settings (key, value) values
  ('listing_social', '{"scrape_on": false, "per_page": 10, "refresh_days": 7, "max_posts": 40, "daily_listing_cap": 20, "manual_refresh_hours": 24}'::jsonb)
on conflict (key) do nothing;

-- The matcher: ve_instagram_posts -> ve_listing_posts (source 'ours'). One row a post and listing, the strongest reason wins.
create or replace function ve_listing_posts_build() returns int
language plpgsql security definer set search_path = public as $$
declare
  n int;
  c_skip_slug constant text[] := array['vegans-explore-podcast', 'soflo-vegans-podcast', 'vegans-who-lift-podcast', 'pre-vegans-podcast', 'sean-russell'];
  c_skip_handle constant text[] := array['vegansexplore', 'soflovegans', 'seanarussell82'];
  c_stop constant text[] := array['the top', 'turning point', 'good karma', 'my vegan', 'vegan deli', 'vegan delights', 'pure kitchen', 'the game changers', 'what the health'];
  c_host constant text[] := array['youtube.com', 'youtu.be', 'instagram.com', 'facebook.com', 'tiktok.com', 'open.spotify.com', 'spotify.com',
    'podcasts.apple.com', 'apple.com', 'amazon.com', 'vegansexplore.com', 'lesaruss.com', 'lesaruss.ai', 'linktr.ee', 'beacons.ai', 'bit.ly',
    'squarespace.com', 'wixsite.com', 'wordpress.com', 'shopify.com', 'google.com', 'eventbrite.com', 'meetup.com'];
begin
  create temp table _lp_hit on commit drop as
  with l as (
    select id, ve_ig_handle(instagram) as h,
           lower(regexp_replace(coalesce(website, ''), '^https?://(www\.)?([^/?#]+).*$', '\2')) as host,
           trim(regexp_replace(lower(name), '[^a-z0-9]+', ' ', 'g')) as nm
      from listings
     where status = 'approved' and slug <> all (c_skip_slug)
  ), p as (
    select id, shortcode, lower(coalesce(owner_username, '')) as owner, mentions, lower(coalesce(caption, '')) as cap,
           ' ' || regexp_replace(lower(coalesce(caption, '')), '[^a-z0-9]+', ' ', 'g') || ' ' as capn
      from ve_instagram_posts where shortcode is not null
  ), hit as (
    select p.id as pid, l.id as lid, 'tag'::text as r, '@' || l.h as m, 1 as pri
      from p join l on l.h is not null and l.h <> all (c_skip_handle) and exists (select 1 from unnest(p.mentions) x where lower(x) = l.h)
    union all
    select p.id, l.id, 'owner', '@' || l.h, 2
      from p join l on l.h is not null and l.h <> all (c_skip_handle) and p.owner = l.h
    union all
    select p.id, l.id, 'link', l.host, 3
      from p join l on length(l.host) >= 6 and l.host like '%.%' and l.host <> all (c_host) and position(l.host in p.cap) > 0
    union all
    select p.id, l.id, 'name', l.nm, 4
      from p join l on l.nm like '% %' and length(l.nm) >= 8 and l.nm <> all (c_stop) and l.nm !~ '^(my |the |a )?(vegan|plant based|plantbased) [a-z]+$' and position(' ' || l.nm || ' ' in p.capn) > 0
  )
  select distinct on (pid, lid) pid, lid, r, m from hit order by pid, lid, pri;

  insert into ve_listing_posts (listing_id, shortcode, post_url, post_type, caption, src_thumb_url, posted_at, like_count, comment_count,
                                source, match_reason, matched, scraped_at)
  select h.lid, p.shortcode, p.post_url, p.post_type, left(p.caption, 2200), p.thumbnail_url, p.posted_at,
         coalesce(p.like_count, 0), coalesce(p.comment_count, 0), 'ours', h.r, left(h.m, 200), p.scraped_at
    from _lp_hit h join ve_instagram_posts p on p.id = h.pid
  on conflict (listing_id, shortcode) do update
     set match_reason = excluded.match_reason, matched = excluded.matched,
         like_count = excluded.like_count, comment_count = excluded.comment_count, caption = excluded.caption, updated_at = now()
   where ve_listing_posts.status = 'shown' and ve_listing_posts.source = 'ours';
  get diagnostics n = row_count;

  -- A shown 'ours' row the scan no longer supports goes. Hidden and removed rows stay.
  delete from ve_listing_posts lp
   where lp.source = 'ours' and lp.status = 'shown'
     and not exists (select 1 from _lp_hit h join ve_instagram_posts p on p.id = h.pid where h.lid = lp.listing_id and p.shortcode = lp.shortcode);
  return n;
end $$;
revoke all on function ve_listing_posts_build() from public, anon, authenticated;

-- Daily: rebuild the matches (08:37 UTC, 3:37 AM Eastern). The thumbnails are copied by ve-listing-posts (`thumbs`), the weekly
-- fetch of claimed owners' posts by its `weekly`; both do nothing while listing_social.scrape_on is false and nothing needs copying.
select cron.schedule('ve-listing-posts-build', '37 8 * * *', $$ select ve_listing_posts_build() $$);
select cron.schedule('ve-listing-posts-thumbs', '*/10 * * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-listing-posts',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"thumbs"}'::jsonb, timeout_milliseconds := 120000)
$$);
select cron.schedule('ve-listing-posts-weekly', '17 7 * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-listing-posts',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', (select value from public.lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"weekly"}'::jsonb, timeout_milliseconds := 150000)
$$);
