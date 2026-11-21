-- The Road to the World Vegan Expo board (Sean, 2026-11-21, LOCKED: "it's not about money at this stage. It's about them doing their part";
-- the building fund picture: "it just gives people a goal every single week to see how we're going"). Read by /expo (anon). Commitments only.
create or replace function public.ve_expo_road() returns jsonb language sql stable security definer set search_path = public as $f$
  with ch(slug, name, ord) as (values
    ('south-florida','South Florida',1),('central-florida','Central Florida',2),('north-florida','North Florida',3),('atlanta','Atlanta',4),
    ('washington-dc','Washington, D.C.',5),('maryland','Maryland',6),('virginia','Virginia',7),('delaware','Delaware',8),('west-virginia','West Virginia',9),
    ('new-york','New York',10),('philadelphia','Philadelphia',11),('boston','Boston',12),('los-angeles','Los Angeles',13),('san-francisco','San Francisco',14),
    ('seattle','Seattle',15),('portland','Portland',16),('austin','Austin',17),('denver','Denver',18),('london','London',19),('paris','Paris',20)),
  biz as (
    select c.chapter, count(*) total, count(*) filter (where x.owner_member_id is not null) claimed
    from listings x
    cross join lateral (select distinct y from unnest(coalesce(x.communities, '{}')::text[] || array[ve_chapter_of(x.address_city, x.address_state)]) y
                        where y is not null and y not in ('all','none')) c(chapter)
    where x.status = 'approved' and x.vegan_status in ('fully_vegan','vegan')
      and x.category in ('Restaurants','Bakeries & Cafes','Food Trucks','Vendors','Catering','Meal Prep','Markets','Beauty and Personal Care',
                         'Health and Wellness','Clothing and Fashion','Stays','Event Venues')
    group by c.chapter),
  mem as (select community_slug chapter, count(distinct member_id) members from member_communities group by community_slug)
  select jsonb_build_object(
    'as_of', now(),
    'members', (select count(*) from members where membership_status = 'active'),
    'businesses_claimed', (select coalesce(sum(claimed),0) from biz b join ch on ch.slug = b.chapter),
    'clubs', (select count(*) from ve_group_partners),
    'nights', (select count(*) from events where title ilike 'Vegans Explore Community Night%' and starts_at < now() and status = 'approved'),
    'chapters', (select coalesce(jsonb_agg(jsonb_build_object('slug', ch.slug, 'name', ch.name, 'businesses', coalesce(b.total,0),
        'claimed', coalesce(b.claimed,0), 'members', coalesce(m.members,0)) order by ch.ord), '[]'::jsonb)
      from ch left join biz b on b.chapter = ch.slug left join mem m on m.chapter = ch.slug));
$f$;
revoke all on function public.ve_expo_road() from public;
grant execute on function public.ve_expo_road() to anon, authenticated;
