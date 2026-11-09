-- ve-chapter-rankings: traffic ranks, numbers kept internal (Sean, 2026-11-09: "I don't necessarily want to show the downloads on there.
-- I just want these to be ranked based off of the algorithm"; "another sortable field where we can go most votes, or we can go traffic").
-- The public reads only a rank. The numbers stay in the tables and on BrandDesk > Vegans Explore > Insights > Chapters (super admins).
--   ve_chapter_traffic: one row a chapter, written daily by branddesk-insights `chapter_traffic` (cron ve-chapter-traffic): podcast downloads
--   from the chapter over the last 365 days (our four shows, Captivate) plus Google visitors from it over the last 90 days. score = the sum.
--   ve_chapter_stats() gains traffic (1 = most), ve_next_chapter_stats() swaps downloads, listen_top, listens_at and mentions for traffic
--   (by downloads, then mentions). Safe to run twice.

create table if not exists public.ve_chapter_traffic (
  chapter text primary key,
  downloads int not null default 0,
  web_users int not null default 0,
  score int not null default 0,
  by_show jsonb,
  at timestamptz not null default now()
);
alter table public.ve_chapter_traffic enable row level security;

drop function if exists public.ve_chapter_stats();
create function public.ve_chapter_stats()
returns table(chapter text, votes bigint, voters bigint, members bigint, places bigint, events bigint, traffic int)
language sql stable security definer set search_path to 'public' as $$
  with ch as (
    select unnest(array['south-florida','central-florida','north-florida','atlanta','washington-dc','delaware','maryland',
      'virginia','west-virginia','new-york','philadelphia','los-angeles','london']) as chapter
  ),
  v as (select chapter, count(*) votes, count(distinct member_id) voters from ve_chapter_votes group by chapter),
  m as (select community_slug chapter, count(distinct member_id) members from member_communities group by community_slug),
  l as (
    select c.chapter, count(*) places
    from listings x
    cross join lateral (
      select distinct y from unnest(
        coalesce(x.communities, '{}')::text[] || array[ve_chapter_of(x.address_city, x.address_state)]
      ) y where y is not null and y <> 'all' and y <> 'none'
    ) c(chapter)
    where x.status = 'approved' and coalesce(x.business_status, '') <> 'CLOSED_PERMANENTLY'
      and not (coalesce(x.tags, '{}') && array['lesaruss-ai-directory','lesaruss-ai-directory-candidate','lesaruss-ai-business-member'])
    group by c.chapter
  ),
  e as (
    select ve_chapter_of(city, state) chapter, count(*) events from events
    where status = 'approved' and tenant_id = '00000000-0000-4000-a000-000000000002'
      and coalesce(ends_at, starts_at) >= now()
    group by 1
  ),
  t as (select chapter, (rank() over (order by score desc))::int traffic from ve_chapter_traffic where score > 0)
  select ch.chapter, coalesce(v.votes,0), coalesce(v.voters,0), coalesce(m.members,0), coalesce(l.places,0), coalesce(e.events,0), t.traffic
  from ch left join v using (chapter) left join m using (chapter) left join l using (chapter) left join e using (chapter) left join t using (chapter);
$$;
revoke all on function public.ve_chapter_stats() from public;
revoke all on function public.ve_chapter_stats() from anon, authenticated;
grant execute on function public.ve_chapter_stats() to service_role;

drop function if exists public.ve_next_chapter_stats();
create function public.ve_next_chapter_stats()
returns table(slug text, name text, sub text, sort integer, votes bigint, voters bigint, traffic int)
language sql stable security definer set search_path to 'public' as $$
  with base as (
    select c.slug, c.name, c.sub, c.sort, coalesce(v.votes,0) votes, coalesce(v.voters,0) voters,
      coalesce((c.listens->>'downloads')::int, 0) downloads, ve_next_chapter_mentions(c.slug) mentions
    from ve_next_chapters c
    left join (select place, count(*) votes, count(distinct member_id) voters from ve_next_chapter_votes group by place) v on v.place = c.slug
    where c.status = 'open'
  )
  select slug, name, sub, sort, votes, voters,
    case when downloads > 0 or mentions > 0 then (rank() over (order by downloads desc, mentions desc))::int end
  from base;
$$;
revoke all on function public.ve_next_chapter_stats() from public, anon, authenticated;
grant execute on function public.ve_next_chapter_stats() to service_role;

-- Daily, 08:51 UTC, after ve-next-places.
select cron.unschedule('ve-chapter-traffic') where exists (select 1 from cron.job where jobname = 've-chapter-traffic');
select cron.schedule('ve-chapter-traffic', '51 8 * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/branddesk-insights',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select value from lesaruss_secrets where key='CRON_SECRET')),
    body := '{"action":"chapter_traffic"}'::jsonb, timeout_milliseconds := 140000);
$$);
