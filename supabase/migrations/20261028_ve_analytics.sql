-- Depot > Analytics (Sean, 2026-10-28: "use the same exact structure as the analytics section in BCPS Marcom... put it in our
-- depot... see what's popular, what's working, which communities are growing the most... a ranking based off certain metrics").
-- The traffic side is Google Analytics (property 432623792, read by the edge function ve-analytics with the LESARUSS analytics
-- reader, GA4_SERVICE_ACCOUNT_JSON). This file is our own side: members, chapters, the Pulse, the Directory, tracked links and ads.

-- Which chapter a city and state belong to: a chapter with a city list matches by city; one with only states matches the state.
create or replace function public.ve_chapter_of(p_city text, p_state text)
returns text language sql stable set search_path = public as $$
  select community_slug from (
    select community_slug, 1 as rank from ve_outreach_cities
      where kind = 'city' and cities is not null and lower(btrim(coalesce(p_city, ''))) = any (select lower(c) from unnest(cities) c)
    union all
    select community_slug, 2 from ve_outreach_cities
      where kind = 'city' and cities is null and states is not null and upper(btrim(coalesce(p_state, ''))) = any (states)
  ) m order by rank limit 1
$$;

-- Cached Google Analytics answers, so a page load does not call Google every time (kept 3 hours, written by ve-analytics).
create table if not exists public.ve_analytics_cache (
  key text primary key,
  data jsonb not null,
  fetched_at timestamptz not null default now()
);
alter table public.ve_analytics_cache enable row level security;

-- Everything Analytics shows from our own tables for one period and the one before it. Members are member_class 'member'
-- only: the Guides (agent), staff (internal) and test accounts (quarantined) are not counted.
create or replace function public.ve_analytics_internal(p_from date, p_to date, p_prev_from date, p_prev_to date)
returns jsonb language sql stable security definer set search_path = public as $$
with
  rng as (select p_from::timestamptz as a, (p_to + 1)::timestamptz as b, p_prev_from::timestamptz as pa, (p_prev_to + 1)::timestamptz as pb),
  mem as (
    select m.id, m.home_community, m.membership_status, coalesce(m.entry_paid_at, m.created_at) as joined
    from members m where coalesce(m.member_class, 'member') = 'member' and coalesce(m.is_superadmin, false) = false
  ),
  chap as (select community_slug as slug, name from ve_outreach_cities where kind = 'city' and community_slug <> 'brands'),
  lst as (
    select l.id, l.name, l.slug, l.category, l.created_at,
      coalesce(ve_chapter_of(l.address_city, l.address_state),
        (select c from unnest(l.communities) c where c <> 'all' limit 1)) as chapter
    from listings l where l.status = 'approved'
  ),
  lev as (select e.* from ve_listing_events e, rng where e.created_at >= rng.a and e.created_at < rng.b),
  topics as (select p.* from ve_board_posts p, rng where p.kind = 'topic' and p.status in ('open', 'resolved') and p.published_at >= rng.a and p.published_at < rng.b),
  posts as (select p.* from ve_board_posts p, rng where p.kind <> 'topic' and coalesce(p.pinned, false) = false and p.created_at >= rng.a and p.created_at < rng.b),
  replies as (select r.*, p.community_slug from ve_board_replies r join ve_board_posts p on p.id = r.post_id, rng
              where r.created_at >= rng.a and r.created_at < rng.b and r.member_id is distinct from p.member_id),
  chk as (select k.*, l.chapter from ve_checkins k join lst l on l.id = k.listing_id, rng where k.created_at >= rng.a and k.created_at < rng.b)
select jsonb_build_object(
  'members', (select jsonb_build_object(
      'active', count(*) filter (where membership_status = 'active'),
      'new', count(*) filter (where membership_status = 'active' and joined >= rng.a and joined < rng.b),
      'new_prev', count(*) filter (where membership_status = 'active' and joined >= rng.pa and joined < rng.pb),
      'by_day', coalesce((select jsonb_agg(jsonb_build_object('day', d, 'n', n) order by d) from (
          select joined::date d, count(*) n from mem, rng where membership_status = 'active' and joined >= rng.a and joined < rng.b group by 1) x), '[]'))
    from mem, rng),
  'chapters', (select coalesce(jsonb_agg(jsonb_build_object(
      'slug', c.slug, 'name', c.name,
      'members', (select count(*) from mem where home_community = c.slug and membership_status = 'active'),
      'new_members', (select count(*) from mem, rng where home_community = c.slug and membership_status = 'active' and joined >= rng.a and joined < rng.b),
      'listings', (select count(*) from lst where chapter = c.slug),
      'new_listings', (select count(*) from lst, rng where chapter = c.slug and created_at >= rng.a and created_at < rng.b),
      'listing_views', (select count(*) from lev join lst on lst.id = lev.listing_id where lst.chapter = c.slug and lev.kind = 'view'),
      'listing_actions', (select count(*) from lev join lst on lst.id = lev.listing_id where lst.chapter = c.slug and lev.kind <> 'view'),
      'pulse_posts', (select count(*) from posts where community_slug = c.slug),
      'pulse_comments', (select count(*) from replies where community_slug = c.slug),
      'checkins', (select count(*) from chk where chapter = c.slug),
      'upcoming_events', (select count(*) from events e where e.status = 'approved' and e.starts_at >= now() and ve_chapter_of(e.city, e.state) = c.slug)
    ) order by c.name), '[]') from chap c),
  'content', (select coalesce(jsonb_agg(jsonb_build_object(
      'id', t.id, 'community', t.community_slug, 'title', t.title, 'published_at', t.published_at,
      'comments', (select count(*) from ve_board_replies r where r.post_id = t.id and r.member_id is distinct from t.member_id)
    ) order by t.published_at desc), '[]') from topics t),
  'board', (select jsonb_build_object(
      'posts', (select count(*) from posts),
      'comments', (select count(*) from replies),
      'by_kind', coalesce((select jsonb_object_agg(kind, n) from (select kind, count(*) n from posts group by 1) x), '{}'))),
  'directory', (select coalesce(jsonb_agg(jsonb_build_object('name', d.name, 'slug', d.slug, 'category', d.category,
      'chapter', d.chapter, 'views', d.views, 'visitors', d.visitors, 'actions', d.actions) order by d.views desc, d.actions desc), '[]')
    from (select l.name, l.slug, l.category, l.chapter, count(*) filter (where e.kind = 'view') views,
            count(distinct e.visitor) visitors, count(*) filter (where e.kind <> 'view') actions
          from lev e join lst l on l.id = e.listing_id group by l.id, l.name, l.slug, l.category, l.chapter
          order by 5 desc, 7 desc limit 200) d),
  'directory_totals', (select jsonb_build_object('listings', (select count(*) from lst),
      'new_listings', (select count(*) from lst, rng where created_at >= rng.a and created_at < rng.b),
      'checkins', (select count(*) from chk)) ),
  'campaigns', (select coalesce(jsonb_agg(jsonb_build_object('initiative', k.ini, 'links', k.links, 'clicks', k.clicks,
      'clicks_prev', k.clicks_prev, 'members', k.members, 'codes', k.codes) order by k.clicks desc, k.clicks_prev desc), '[]')
    from (select lk.ini, count(*) links, sum(lk.clicks) clicks, sum(lk.clicks_prev) clicks_prev, sum(lk.members) members,
            jsonb_agg(jsonb_build_object('code', lk.code, 'label', lk.label, 'clicks', lk.clicks) order by lk.clicks desc) filter (where lk.clicks > 0) codes
          from (select coalesce(l.initiative_slug, '(none)') ini, l.code, l.label,
                  count(c.id) filter (where c.clicked_at >= rng.a and c.clicked_at < rng.b) clicks,
                  count(c.id) filter (where c.clicked_at >= rng.pa and c.clicked_at < rng.pb) clicks_prev,
                  count(distinct c.member_id) filter (where c.clicked_at >= rng.a and c.clicked_at < rng.b) members
                from ve_links l cross join rng left join ve_link_clicks c on c.link_id = l.id and not c.is_bot
                group by l.id, l.initiative_slug, l.code, l.label) lk
          group by lk.ini having sum(lk.clicks) + sum(lk.clicks_prev) > 0) k),
  'ads', (select coalesce(jsonb_agg(jsonb_build_object('page', p.page_name, 'page_slug', p.page_slug, 'slot', p.slot_id,
      'impressions', s.imp, 'clicks', s.clk) order by s.imp desc), '[]')
    from ad_placements p join (select i.placement_id, sum(i.impressions) imp, sum(i.clicks) clk from ad_impressions i, rng
      where i.log_date >= p_from and i.log_date <= p_to group by 1) s on s.placement_id = p.id
    where p.brand_slug = 'vegans-explore')
) from rng
$$;

revoke all on function public.ve_analytics_internal(date, date, date, date) from public, anon, authenticated;
