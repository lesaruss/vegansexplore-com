-- Communities as cards with votes and saves (Sean, 2026-11-01: "The community should be set up like they're in a directory
-- listing... you can vote for them, you could save them"). A vote for a chapter is once every 24 hours per member, like a
-- listing's; saving a chapter is joining it (member_communities, ve-auth join/leave). Read through ve-votes.
create table if not exists public.ve_chapter_votes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  chapter text not null,
  vote_date date not null default ((now() at time zone 'America/New_York')::date),
  created_at timestamptz not null default now()
);
create unique index if not exists ve_chapter_votes_once_a_day on public.ve_chapter_votes (member_id, chapter, vote_date);
create index if not exists ve_chapter_votes_chapter on public.ve_chapter_votes (chapter);
alter table public.ve_chapter_votes enable row level security;

-- Each chapter's numbers for its card: votes and voters, members who saved it, open places in it (by address or the chapters
-- a listing serves; LESARUSS.ai's own listings left out), and upcoming Vegans Explore events in it.
create or replace function public.ve_chapter_stats()
returns table (chapter text, votes bigint, voters bigint, members bigint, places bigint, events bigint)
language sql stable security definer set search_path = public as $$
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
  )
  select ch.chapter, coalesce(v.votes,0), coalesce(v.voters,0), coalesce(m.members,0), coalesce(l.places,0), coalesce(e.events,0)
  from ch left join v using (chapter) left join m using (chapter) left join l using (chapter) left join e using (chapter);
$$;
revoke all on function public.ve_chapter_stats() from public, anon, authenticated;
