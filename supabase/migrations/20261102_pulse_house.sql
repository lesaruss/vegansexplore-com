-- From Vegans Explore, in every city's Daily Pulse (Sean, 2026-11-01: "at least 5 to 10 stories in there. And then we can intermix
-- some of our content... point them to some podcast episodes, some interviews... spotlight a restaurant and send them to their directory
-- listings... nominate somebody in your community that we should interview... share some new bounties... let them know what new
-- listings have been created in their chapter"). Built from our own data when the briefing publishes, so a city always has something.

-- When a listing went live (a quarantined import approved later is new then, not when it was imported).
alter table public.listings add column if not exists listed_at timestamptz;
update public.listings set listed_at = created_at where listed_at is null and status = 'approved';
create or replace function public.ve_listing_listed_at() returns trigger language plpgsql as $$
begin
  if new.status = 'approved' and (tg_op = 'INSERT' or old.status is distinct from 'approved') then new.listed_at := now(); end if;
  return new;
end $$;
drop trigger if exists trg_ve_listing_listed_at on public.listings;
create trigger trg_ve_listing_listed_at before insert or update of status on public.listings for each row execute function public.ve_listing_listed_at();

-- What the Pulse has spotlighted, so it rotates.
create table if not exists public.ve_pulse_house_log (
  id bigserial primary key,
  community_slug text not null,
  kind text not null,          -- spotlight | episode | ask
  ref text not null,
  post_id uuid,
  used_at timestamptz not null default now()
);
create index if not exists ve_pulse_house_log_c on public.ve_pulse_house_log (community_slug, kind, used_at desc);
alter table public.ve_pulse_house_log enable row level security;

-- Whether a listing is in a chapter: its address, or the chapters it serves (never "every chapter", which is national).
create or replace function public.ve_listing_in_chapter(l public.listings, p_city text) returns boolean language sql stable as $$
  select p_city = any(coalesce(l.communities, '{}')) or ve_chapter_of(l.address_city, l.address_state) = p_city;
$$;

-- The section. p_record true (at publish) logs the spotlight, episode and ask so they rotate; false is a preview.
create or replace function public.ve_pulse_house(p_city text, p_post uuid default null, p_record boolean default false)
 returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  since timestamptz; out jsonb := '{}'; nl jsonb; nl_count int; b jsonb; sp record; ep record; ask boolean;
  ours constant text[] := array['lesaruss-ai-directory','lesaruss-ai-directory-candidate','lesaruss-ai-business-member'];
  food constant text[] := array['Restaurants','Bakeries & Cafes','Food Trucks','Vendors','Catering','Meal Prep'];
begin
  if p_city like 'lr-%' or p_city = 'national' then return null; end if;
  select max(published_at) into since from ve_board_posts where kind = 'topic' and community_slug = p_city and status in ('open','resolved') and published_at is not null;
  since := least(coalesce(since, now() - interval '2 days'), now() - interval '20 hours');

  -- New in the chapter since the last Pulse: public listings only (a Vegan-options place waits on member votes first).
  with x as (
    select l.name, l.slug, l.category, l.address_city, l.listed_at from listings l
    where l.status = 'approved' and l.listed_at > since and l.parent_id is null
      and not (coalesce(l.tags, '{}') && ours) and not ('all' = any(coalesce(l.communities, '{}')))
      and (l.business_status is null or l.business_status = 'OPERATIONAL')
      and not (l.category = any(food) and l.vegan_status in ('vegan_options','vegan_friendly') and l.vetted_at is null and coalesce(l.voter_count,0) < 10 and coalesce(l.claim_status,'') <> 'approved')
      and ve_listing_in_chapter(l, p_city))
  select (select count(*) from x), (select coalesce(jsonb_agg(jsonb_build_object('name', name, 'kind', category, 'city', address_city, 'url', '/directory/' || slug) order by listed_at desc), '[]') from (select * from x order by listed_at desc limit 5) y)
  into nl_count, nl;
  if nl_count > 0 then out := out || jsonb_build_object('new_listings', nl, 'new_count', nl_count, 'new_url', '/communities/' || p_city || '?tab=directory'); end if;

  -- New bounties in the chapter since the last Pulse.
  select coalesce(jsonb_agg(jsonb_build_object('title', title, 'points', points) order by created_at desc), '[]') into b
    from (select title, points, created_at from ve_bounties where community_slug = p_city and status = 'open' and created_at > since and (due_at is null or due_at > now()) order by created_at desc limit 3) z;
  if jsonb_array_length(b) > 0 then out := out || jsonb_build_object('bounties', b, 'bounties_url', '/bounties?community=' || p_city); end if;

  -- A spotlight: a 100% Vegan food place in the chapter with a logo and its own words, most voted, not spotlighted here in 60 days.
  select l.id, l.name, l.slug, l.category, l.address_city, coalesce(nullif(l.tagline, ''), l.description) as line into sp from listings l
  where l.status = 'approved' and l.category = any(food) and l.vegan_status in ('fully_vegan','vegan') and l.logo_url is not null
    and length(coalesce(nullif(l.tagline, ''), l.description, '')) > 40 and (l.business_status is null or l.business_status = 'OPERATIONAL')
    and not (coalesce(l.tags, '{}') && ours) and ve_listing_in_chapter(l, p_city)
    and not exists (select 1 from ve_pulse_house_log g where g.community_slug = p_city and g.kind = 'spotlight' and g.ref = l.id::text and g.used_at > now() - interval '60 days')
  order by coalesce(l.vote_count, 0) desc, random() limit 1;
  if sp.id is not null then
    out := out || jsonb_build_object('spotlight', jsonb_build_object('name', sp.name, 'kind', sp.category, 'city', sp.address_city,
      'line', left(regexp_replace(sp.line, '\s+', ' ', 'g'), 220), 'url', '/directory/' || sp.slug));
    if p_record then insert into ve_pulse_house_log (community_slug, kind, ref, post_id) values (p_city, 'spotlight', sp.id::text, p_post); end if;
  end if;

  -- One of our episodes or interviews, not used here in 120 days.
  select c.id, c.title, left(coalesce(c.summary, ''), 220) as summary, l.slug as show_slug, l.name as show, m.guid into ep
  from ve_pulse_content c join ve_pulse_episode_map m on m.content_id = c.id and m.guid is not null
  join listings l on l.id = m.show_listing_id and l.slug in ('vegans-explore-podcast','soflo-vegans-podcast','vegans-who-lift-podcast','pre-vegans-podcast')
  where c.status = 'published'
    and not exists (select 1 from ve_pulse_house_log g where g.community_slug = p_city and g.kind = 'episode' and g.ref = c.id::text and g.used_at > now() - interval '120 days')
  order by random() limit 1;
  if ep.id is not null then
    -- Titles lose a trailing " | Ep 017 | Show" and both lose emoji; the guid is encoded (SoundCloud's are tag:soundcloud,2010:tracks/...).
    out := out || jsonb_build_object('episode', jsonb_build_object(
      'title', btrim(regexp_replace(regexp_replace(ep.title, '\s*\|.*$', ''), '[\U0001F000-\U0001FFFF\u2600-\u27BF\uFE0F]', '', 'g')),
      'show', ep.show,
      'summary', btrim(regexp_replace(regexp_replace(ep.summary, '[\U0001F000-\U0001FFFF\u2600-\u27BF\uFE0F]', '', 'g'), '\s+', ' ', 'g')),
      'url', '/listen?show=' || ep.show_slug || '&ep=' || replace(replace(replace(replace(ep.guid, '%', '%25'), ':', '%3A'), '/', '%2F'), ',', '%2C')));
    if p_record then insert into ve_pulse_house_log (community_slug, kind, ref, post_id) values (p_city, 'episode', ep.id::text, p_post); end if;
  end if;

  -- Once a week (Mondays, Eastern): who should we interview?
  ask := extract(isodow from (now() at time zone 'America/New_York')) = 1;
  if ask then
    out := out || jsonb_build_object('ask', jsonb_build_object('title', 'Who should we interview?',
      'text', 'Know someone in your community doing great things for Vegans or the animals? Tell us, and they could be on our podcast.',
      'label', 'Nominate someone', 'url', '/pulse/suggest?city=' || p_city));
    if p_record then insert into ve_pulse_house_log (community_slug, kind, ref, post_id) values (p_city, 'ask', 'interview', p_post); end if;
  end if;

  return case when out = '{}'::jsonb then null else out end;
end $$;
revoke all on function public.ve_pulse_house(text, uuid, boolean) from public, anon, authenticated;

-- Applied with the featured items: when the draft publishes, briefing.house is (re)built and recorded.
create or replace function public.ve_pulse_features_apply(p_post uuid default null)
 returns int language plpgsql security definer set search_path to 'public' as $$
declare n int := 0; r record; f record; h jsonb;
begin
  for r in select id, community_slug, briefing, auto_publish_at from ve_board_posts
    where kind = 'topic' and status = 'draft' and auto_publish_at is not null and briefing is not null
      and community_slug not like 'lr-%' and (p_post is null or id = p_post) and auto_publish_at > now() - interval '12 hours'
  loop
    for f in select * from ve_pulse_features
      where (r.auto_publish_at at time zone 'America/New_York')::date between starts_on and ends_on
        and (communities is null or r.community_slug = any(communities)) order by created_at
    loop
      -- Never twice: not when it is already there, and not when the writer already wrote the same link as a story.
      if not exists (select 1 from jsonb_array_elements(coalesce(r.briefing->'stories','[]')) s
                     where s->>'feature_id' = f.id::text or (f.story->>'url' is not null and s->>'url' = f.story->>'url')) then
        r.briefing := jsonb_set(r.briefing, '{stories}', jsonb_build_array(f.story || jsonb_build_object('feature_id', f.id::text)) || coalesce(r.briefing->'stories','[]'));
        n := n + 1;
      end if;
    end loop;
    if p_post is not null then
      h := ve_pulse_house(r.community_slug, r.id, true);
      r.briefing := case when h is null then r.briefing - 'house' else jsonb_set(r.briefing, '{house}', h) end;
    elsif not (r.briefing ? 'house') then
      h := ve_pulse_house(r.community_slug, r.id, false);
      if h is not null then r.briefing := jsonb_set(r.briefing, '{house}', h); end if;
    end if;
    update ve_board_posts set briefing = r.briefing, updated_at = now() where id = r.id;
  end loop;
  return n;
end $$;
revoke all on function public.ve_pulse_features_apply(uuid) from public, anon, authenticated;

-- The writer's rules (lesaruss_dispatch_sources pulse_topic_write) were changed the same night in place: 5 to 10 stories, national ones
-- to fill, never fail a city for lack of news, and leave From Vegans Explore and featured stories to the publish step.
