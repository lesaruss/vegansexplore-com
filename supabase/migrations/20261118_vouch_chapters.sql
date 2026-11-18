-- Vouch, once, for everything: chapters and "Where should we go next?" places (Sean, 2026-11-18, LOCKED, canon
-- canon-ve-vouch-everything: "If people know that people only can vote for things once, then it makes it a little bit easier to trust
-- the rankings"). A chapter or next-place vote is now a vouch: one per member, kept until they take it back (ve-votes chapter_unvote /
-- next_unvote), like a listing's since 2026-11-15 (20261115_votes_are_vouches.sql). votes = the number of people, the same as voters;
-- older repeat rows stay for the record and count once. Bodies copied from the live definitions read 2026-11-18 (the live chapter list
-- includes seattle to london, newer than 20261109_chapter_traffic_ranks.sql). Safe to run twice.

create or replace function public.ve_chapter_stats()
 returns table(chapter text, votes bigint, voters bigint, members bigint, places bigint, events bigint, traffic integer)
 language sql stable security definer set search_path to 'public' as $function$
  with ch as (
    select unnest(array['south-florida','central-florida','north-florida','atlanta','washington-dc','delaware','maryland',
      'virginia','west-virginia','new-york','philadelphia','los-angeles','seattle','portland','san-francisco','austin','denver','boston','paris','london']) as chapter
  ),
  v as (select chapter, count(distinct member_id) votes, count(distinct member_id) voters from ve_chapter_votes group by chapter),
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
$function$;
revoke all on function public.ve_chapter_stats() from public, anon, authenticated;
grant execute on function public.ve_chapter_stats() to service_role;

create or replace function public.ve_next_chapter_stats()
 returns table(slug text, name text, sub text, sort integer, votes bigint, voters bigint, traffic integer)
 language sql stable security definer set search_path to 'public' as $function$
  with base as (
    select c.slug, c.name, c.sub, c.sort, coalesce(v.votes,0) votes, coalesce(v.voters,0) voters,
      coalesce((c.listens->>'downloads')::int, 0) downloads, ve_next_chapter_mentions(c.slug) mentions
    from ve_next_chapters c
    left join (select place, count(distinct member_id) votes, count(distinct member_id) voters from ve_next_chapter_votes group by place) v on v.place = c.slug
    where c.status = 'open'
  )
  select slug, name, sub, sort, votes, voters,
    case when downloads > 0 or mentions > 0 then (rank() over (order by downloads desc, mentions desc))::int end
  from base;
$function$;
revoke all on function public.ve_next_chapter_stats() from public, anon, authenticated;
grant execute on function public.ve_next_chapter_stats() to service_role;

-- The database backstop for one vouch per member: a unique (member, item) index, added only when no repeat rows exist (read
-- 2026-11-18: 5 chapter votes from 5 member-chapter pairs, no next-place votes, so both indexes go on). If repeats exist the index
-- is skipped and ve-votes still refuses a second vouch.
do $$
begin
  if not exists (select 1 from public.ve_chapter_votes group by member_id, chapter having count(*) > 1) then
    create unique index if not exists ve_chapter_votes_one_vouch on public.ve_chapter_votes (member_id, chapter);
  end if;
  if not exists (select 1 from public.ve_next_chapter_votes group by member_id, place having count(*) > 1) then
    create unique index if not exists ve_next_chapter_votes_one_vouch on public.ve_next_chapter_votes (member_id, place);
  end if;
end $$;
