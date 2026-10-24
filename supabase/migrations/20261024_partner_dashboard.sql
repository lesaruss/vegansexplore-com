-- The business dashboard (Sean, 2026-10-24, Love Life Cafe as the prototype): "basic information, like how many views in
-- the past 30 days... They should be able to sort through the analytics. If they have ads running, it should show the
-- ads... as we release new features, new tools, we can have different wizards. It will automatically be shown to them in
-- this one place." Read through ve-claims owner_dashboard; the owner (an active member) or a super admin.

-- 1. What a visitor does next on a listing, besides opening it: a call, directions, the website, an order, a social
--    link, the menu or the photos (directory/listing.html trackActions).
create or replace function public.ve_listing_track(p_listing uuid, p_kind text, p_ref text default null, p_visitor text default null, p_via text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if p_kind not in ('view','product','store','video','gallery','menu','photos','call','directions','website','order','social') then return; end if;
  if p_visitor is not null and length(p_visitor) > 64 then return; end if;
  if not exists (select 1 from listings where id = p_listing and status = 'approved') then return; end if;
  -- One count per visitor, listing, action and item every 30 minutes.
  if p_visitor is not null and exists (select 1 from ve_listing_events where listing_id = p_listing and kind = p_kind and coalesce(ref,'') = coalesce(p_ref,'')
       and visitor = p_visitor and created_at > now() - interval '30 minutes') then return; end if;
  insert into ve_listing_events (listing_id, kind, ref, visitor, via) values (p_listing, p_kind, left(p_ref, 120), p_visitor, left(p_via, 20));
end $$;

-- 2. The numbers. Same shape as before (totals, visitors, daily views, products, stores, videos, via), plus each day's
--    visitors and actions, and the period before for the change. Days run in Eastern time.
create or replace function public.ve_listing_stats(p_listing uuid, p_days integer default 30)
returns jsonb language sql security definer set search_path to 'public' as $$
  with d as (select greatest(1, least(p_days, 365)) n),
  e as (select *, (created_at at time zone 'America/New_York')::date dd from ve_listing_events
        where listing_id = p_listing and via is distinct from 'test' and created_at > now() - make_interval(days => (select n from d))),
  prev as (select * from ve_listing_events where listing_id = p_listing and via is distinct from 'test'
        and created_at <= now() - make_interval(days => (select n from d)) and created_at > now() - make_interval(days => 2 * (select n from d))),
  acts as (select unnest(array['call','directions','website','order','social','menu','photos']) k)
  select jsonb_build_object(
    'days', (select n from d),
    'since', (select min(created_at) from ve_listing_events where listing_id = p_listing and via is distinct from 'test'),
    'totals', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (select kind, count(*) n from e group by kind) t),
    'visitors', (select count(distinct visitor) from e where visitor is not null),
    'previous', jsonb_build_object('views', (select count(*) from prev where kind = 'view'), 'visitors', (select count(distinct visitor) from prev where visitor is not null),
      'actions', (select count(*) from prev where kind in (select k from acts))),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', dd, 'views', v, 'visitors', vi, 'actions', a) order by dd), '[]'::jsonb) from (
      select dd, count(*) filter (where kind = 'view') v, count(distinct visitor) vi, count(*) filter (where kind in (select k from acts)) a from e group by dd) t),
    'products', (select coalesce(jsonb_agg(jsonb_build_object('ref', ref, 'n', n) order by n desc), '[]'::jsonb) from (select ref, count(*) n from e where kind = 'product' group by ref) t),
    'stores', (select coalesce(jsonb_agg(jsonb_build_object('ref', ref, 'n', n) order by n desc), '[]'::jsonb) from (select ref, count(*) n from e where kind = 'store' group by ref) t),
    'videos', (select coalesce(jsonb_agg(jsonb_build_object('ref', ref, 'n', n) order by n desc), '[]'::jsonb) from (select ref, count(*) n from e where kind = 'video' group by ref) t),
    'via', (select coalesce(jsonb_object_agg(coalesce(via, 'page'), n), '{}'::jsonb) from (select via, count(*) n from e where kind = 'view' group by via) t)
  );
$$;

-- 3. What's new: cards a dashboard shows its people, newest first (a new tool, a wizard, an offer). `audience` says whose
--    dashboard: business (a listing's owner), member, coach, pre_vegan, or all. Live between starts_at and ends_at.
create table if not exists public.ve_dashboard_cards (
  id uuid primary key default gen_random_uuid(),
  audience text not null default 'all' check (audience ~ '^[a-z_]+$'),
  kind text not null default 'new' check (kind in ('new', 'wizard', 'offer', 'tip')),
  title text not null,
  body text not null default '',
  cta_label text,
  cta_url text check (cta_url is null or cta_url ~ '^(/|https://|\?)'),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  sort int not null default 100,
  created_at timestamptz not null default now()
);
alter table public.ve_dashboard_cards enable row level security;
drop policy if exists ve_dashboard_cards_read on public.ve_dashboard_cards;
create policy ve_dashboard_cards_read on public.ve_dashboard_cards for select using (starts_at <= now() and (ends_at is null or ends_at > now()));

insert into public.ve_dashboard_cards (audience, kind, title, body, cta_label, cta_url, sort)
select * from (values
  ('business', 'wizard', 'Check your restaurant for free', 'Ten things Google, your website and your Instagram tell a hungry visitor, with what to fix first.', 'Run the free check', '/guides/vegan-restaurant-survival-guide#/audit', 10),
  ('business', 'new', 'Your menu, on your page', 'Add your menu and keep it current. Menus are one of the first things people open.', 'Edit your menu', '?pd=menu', 20),
  ('business', 'new', 'The Restaurant Survival Guide', 'Liz walks you through getting found, getting featured and filling seats. $11 or 1 Guide credit.', 'Open the Guide', '/guides/vegan-restaurant-survival-guide', 30)
) v(audience, kind, title, body, cta_label, cta_url, sort)
where not exists (select 1 from public.ve_dashboard_cards);
