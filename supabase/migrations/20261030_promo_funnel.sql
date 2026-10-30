-- The creator ad and "Is this you?" on every People page, tracked from the page it was clicked on (Sean, 2026-10-30: "on the people
-- directory, we can have an ad for content creators to register using the animated style... see who's clicking on it, how many people
-- click through, follow their journey... which channels are showing up the most... see that somebody signed up because they went
-- through Brooke's page and became a creator on her page").
--
-- One table for any promotion (promo 'creator-register' first), one row per step a visitor takes:
--   view      the card came on screen on a page            (the page, browser)
--   click     they clicked it                               (the page, browser)
--   landed    they opened the walkthrough (/gigs/sample)    (browser)
--   started   they opened the application's first step      (browser)
--   sent      the application was saved                     (ve-ambassador creator_apply, server)
--   accepted  the team marked it Accepted                   (ve-ambassador creator_status, server)
-- page and listing_id are where the card was clicked (last click, kept in the browser 30 days), so a sent application counts for
-- Brooke's page when it started there. channel is how the visitor first came to the site in that visit (nav.js keeps it:
-- Instagram, Google, a tracked /go/ link by its code, "Direct or an app" for WhatsApp and texts, which send no referrer).
-- RLS on, no policies: the browser writes only through ve_promo_track, the Depot reads through ve-ambassador. Safe to run twice.

create table if not exists ve_promo_events (
  id bigserial primary key,
  promo text not null check (promo ~ '^[a-z0-9-]{2,40}$'),
  step text not null check (step in ('view', 'click', 'landed', 'started', 'sent', 'accepted')),
  visitor text check (visitor ~ '^[A-Za-z0-9-]{8,64}$'),
  page text check (char_length(page) <= 200),
  listing_id uuid references listings(id) on delete set null,
  cta text check (cta ~ '^[a-z0-9-]{1,30}$'),
  channel text check (char_length(channel) <= 80),
  ref_id uuid,
  member_id uuid references members(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists ve_promo_events_promo_idx on ve_promo_events (promo, created_at desc);
create index if not exists ve_promo_events_visitor_idx on ve_promo_events (visitor, promo, step, created_at desc);
alter table ve_promo_events enable row level security;
revoke all on ve_promo_events from anon, authenticated;

-- Where a creator application came from, and the People profile it claims ("Is this you?").
alter table ve_creator_applications add column if not exists source_page text check (char_length(source_page) <= 200);
alter table ve_creator_applications add column if not exists source_listing_id uuid references listings(id) on delete set null;
alter table ve_creator_applications add column if not exists source_cta text check (source_cta ~ '^[a-z0-9-]{1,30}$');
alter table ve_creator_applications add column if not exists source_channel text check (char_length(source_channel) <= 80);
alter table ve_creator_applications add column if not exists source_visitor text check (source_visitor ~ '^[A-Za-z0-9-]{8,64}$');
alter table ve_creator_applications add column if not exists claim_listing_id uuid references listings(id) on delete set null;

-- The browser's steps. Once per visitor, step and page every 30 minutes; at most 300 rows a visitor a day; a tracked-link landing
-- (?vl=<click id>) is named by its link's code.
create or replace function ve_promo_track(p_promo text, p_step text, p_visitor text, p_page text, p_listing uuid default null,
  p_cta text default null, p_channel text default null, p_vl uuid default null)
returns boolean language plpgsql security definer set search_path = public as $$
declare v_channel text := nullif(left(btrim(coalesce(p_channel, '')), 80), ''); v_code text; v_listing uuid;
begin
  if p_promo !~ '^[a-z0-9-]{2,40}$' or p_step not in ('view', 'click', 'landed', 'started')
     or p_visitor is null or p_visitor !~ '^[A-Za-z0-9-]{8,64}$' then return false; end if;
  if p_cta is not null and p_cta !~ '^[a-z0-9-]{1,30}$' then p_cta := null; end if;
  if exists (select 1 from ve_promo_events where visitor = p_visitor and promo = p_promo and step = p_step
             and page is not distinct from left(p_page, 200) and created_at > now() - interval '30 minutes') then return false; end if;
  if (select count(*) from ve_promo_events where visitor = p_visitor and created_at > now() - interval '1 day') >= 300 then return false; end if;
  if p_vl is not null then
    select l.code into v_code from ve_link_clicks c join ve_links l on l.id = c.link_id where c.id = p_vl;
    if v_code is not null then v_channel := 'Link: ' || v_code; end if;
  end if;
  if p_listing is not null then select id into v_listing from listings where id = p_listing; end if;
  insert into ve_promo_events (promo, step, visitor, page, listing_id, cta, channel)
  values (p_promo, p_step, p_visitor, left(p_page, 200), v_listing, p_cta, v_channel);
  return true;
end $$;
revoke all on function ve_promo_track(text, text, text, text, uuid, text, text, uuid) from public;
grant execute on function ve_promo_track(text, text, text, text, uuid, text, text, uuid) to anon, authenticated, service_role;

-- The funnel since a date: by page (with the listing's name), by channel, and the totals. Each step counts different visitors
-- (a sent or accepted application counts once each). The team only, through ve-ambassador.
create or replace function ve_promo_funnel(p_promo text, p_since timestamptz)
returns jsonb language sql stable security definer set search_path = public as $$
  with e as (
    select step, coalesce(page, '(none)') as page, listing_id, coalesce(channel, 'Unknown') as channel,
           coalesce(visitor, 'ref:' || ref_id::text, 'row:' || id::text) as who
    from ve_promo_events where promo = p_promo and created_at >= p_since
  ),
  agg as (
    select g.key, g.kind,
      count(distinct e.who) filter (where e.step = 'view') as views,
      count(distinct e.who) filter (where e.step = 'click') as clicks,
      count(distinct e.who) filter (where e.step = 'landed') as landed,
      count(distinct e.who) filter (where e.step = 'started') as started,
      count(distinct e.who) filter (where e.step = 'sent') as sent,
      count(distinct e.who) filter (where e.step = 'accepted') as accepted
    from e cross join lateral (values ('page', e.page), ('channel', e.channel), ('all', 'all')) as g(kind, key)
    group by g.kind, g.key
  ),
  names as (
    select distinct on (e.page) e.page, l.name, l.slug from e left join listings l on l.id = e.listing_id
    order by e.page, l.name nulls last
  )
  select jsonb_build_object(
    'since', p_since,
    'totals', (select to_jsonb(a) - 'kind' - 'key' from agg a where kind = 'all'),
    'pages', coalesce((select jsonb_agg(to_jsonb(a) - 'kind' || jsonb_build_object('name', n.name, 'slug', n.slug) order by a.sent desc, a.clicks desc, a.views desc)
                       from agg a left join names n on n.page = a.key where a.kind = 'page'), '[]'::jsonb),
    'channels', coalesce((select jsonb_agg(to_jsonb(a) - 'kind' order by a.sent desc, a.clicks desc, a.landed desc)
                          from agg a where a.kind = 'channel'), '[]'::jsonb));
$$;
revoke all on function ve_promo_funnel(text, timestamptz) from public, anon, authenticated;
grant execute on function ve_promo_funnel(text, timestamptz) to service_role;
