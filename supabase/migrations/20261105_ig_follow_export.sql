-- ve-outreach-buckets: who follows us on Instagram, from Instagram's own export (Sean, 2026-11-05: "Yes to the follower export, build it").
-- Instagram shows follower lists only to the logged-in account, so we never crawl them. Sean downloads Instagram's own export
-- (Accounts Center > Your information and permissions > Download your information > Followers and following, JSON), uploads it in
-- BrandDesk > Vegans Explore > Outreach > Roster > Instagram followers, and HQ reads the files in the browser and sends only the handles
-- and dates here. Each upload replaces that side of the picture: a handle in it is a follower (or someone we follow) with its date,
-- a handle missing from it is marked gone (kept, never deleted). Profiles show Follows us / We follow them by the listing's handle.
-- RLS on, no policies: HQ reads and writes with the service client.

create table if not exists ve_ig_follow_imports (
  id uuid primary key default gen_random_uuid(),
  account text not null check (account ~ '^[a-z0-9._]{1,30}$'),
  kind text not null check (kind in ('followers', 'following')),
  file_names text[] not null default '{}',
  total int not null default 0,
  added int not null default 0,
  gone int not null default 0,
  uploaded_by uuid,
  uploaded_by_name text,
  created_at timestamptz not null default now()
);
alter table ve_ig_follow_imports enable row level security;

create table if not exists ve_ig_follows (
  account text not null,
  handle text not null check (handle ~ '^[a-z0-9._]{1,30}$'),
  follows_us boolean not null default false,
  follows_us_since timestamptz,
  follows_us_gone_at timestamptz,
  we_follow boolean not null default false,
  we_follow_since timestamptz,
  we_follow_gone_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (account, handle)
);
alter table ve_ig_follows enable row level security;

create index if not exists listings_ig_handle_idx on listings (ve_ig_handle(instagram)) where instagram is not null;

-- One upload: p_rows is [{h: handle, t: unix seconds or null}]. Refuses an empty upload so a bad file can never mark everyone gone.
create or replace function ve_ig_follow_import(p_account text, p_kind text, p_rows jsonb, p_files text[], p_by uuid, p_by_name text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare imp uuid; n_total int; n_added int; n_gone int; n_listings int; acct text := ve_ig_handle(p_account);
begin
  if acct is null then return jsonb_build_object('error', 'account'); end if;
  if p_kind not in ('followers', 'following') then return jsonb_build_object('error', 'kind'); end if;
  drop table if exists _ig;
  create temp table _ig on commit drop as
    select distinct on (h) h, ts from (
      select ve_ig_handle(r->>'h') h, case when (r->>'t') ~ '^[0-9]{9,11}$' then to_timestamp((r->>'t')::bigint) end ts
      from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) r) x
    where h is not null order by h, ts nulls last;
  select count(*) into n_total from _ig;
  if n_total = 0 then drop table if exists _ig; return jsonb_build_object('error', 'empty'); end if;

  if p_kind = 'followers' then
    select count(*) into n_added from _ig i where not exists (select 1 from ve_ig_follows f where f.account = acct and f.handle = i.h and f.follows_us);
    insert into ve_ig_follows (account, handle, follows_us, follows_us_since, follows_us_gone_at, updated_at)
      select acct, h, true, ts, null, now() from _ig
    on conflict (account, handle) do update set follows_us = true, follows_us_gone_at = null, updated_at = now(),
      follows_us_since = case when ve_ig_follows.follows_us then coalesce(least(ve_ig_follows.follows_us_since, excluded.follows_us_since), ve_ig_follows.follows_us_since, excluded.follows_us_since) else coalesce(excluded.follows_us_since, now()) end;
    with g as (update ve_ig_follows f set follows_us = false, follows_us_gone_at = now(), updated_at = now()
      where f.account = acct and f.follows_us and not exists (select 1 from _ig i where i.h = f.handle) returning 1)
    select count(*) into n_gone from g;
  else
    select count(*) into n_added from _ig i where not exists (select 1 from ve_ig_follows f where f.account = acct and f.handle = i.h and f.we_follow);
    insert into ve_ig_follows (account, handle, we_follow, we_follow_since, we_follow_gone_at, updated_at)
      select acct, h, true, ts, null, now() from _ig
    on conflict (account, handle) do update set we_follow = true, we_follow_gone_at = null, updated_at = now(),
      we_follow_since = case when ve_ig_follows.we_follow then coalesce(least(ve_ig_follows.we_follow_since, excluded.we_follow_since), ve_ig_follows.we_follow_since, excluded.we_follow_since) else coalesce(excluded.we_follow_since, now()) end;
    with g as (update ve_ig_follows f set we_follow = false, we_follow_gone_at = now(), updated_at = now()
      where f.account = acct and f.we_follow and not exists (select 1 from _ig i where i.h = f.handle) returning 1)
    select count(*) into n_gone from g;
  end if;

  select count(distinct l.id) into n_listings from listings l join _ig i on ve_ig_handle(l.instagram) = i.h
    where l.instagram is not null and l.status = 'approved';
  insert into ve_ig_follow_imports (account, kind, file_names, total, added, gone, uploaded_by, uploaded_by_name)
    values (acct, p_kind, coalesce(p_files, '{}'), n_total, n_added, n_gone, p_by, left(coalesce(p_by_name, ''), 80)) returning id into imp;
  drop table if exists _ig;
  return jsonb_build_object('ok', true, 'id', imp, 'kind', p_kind, 'total', n_total, 'added', n_added, 'gone', n_gone, 'listings', n_listings);
end $$;
revoke all on function ve_ig_follow_import(text, text, jsonb, text[], uuid, text) from public, anon, authenticated;

-- What the upload screen shows: the latest upload of each side and how many listings each side covers.
create or replace function ve_ig_follow_summary(p_account text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'imports', coalesce((select jsonb_agg(to_jsonb(i) order by i.created_at desc) from (select id, kind, file_names, total, added, gone, uploaded_by_name, created_at
       from ve_ig_follow_imports where account = ve_ig_handle(p_account) order by created_at desc limit 10) i), '[]'::jsonb),
    'followers', (select count(*) from ve_ig_follows where account = ve_ig_handle(p_account) and follows_us),
    'following', (select count(*) from ve_ig_follows where account = ve_ig_handle(p_account) and we_follow),
    'listings_follow_us', (select count(distinct l.id) from listings l join ve_ig_follows f on f.handle = ve_ig_handle(l.instagram)
       where f.account = ve_ig_handle(p_account) and f.follows_us and l.instagram is not null and l.status = 'approved'),
    'listings_we_follow', (select count(distinct l.id) from listings l join ve_ig_follows f on f.handle = ve_ig_handle(l.instagram)
       where f.account = ve_ig_handle(p_account) and f.we_follow and l.instagram is not null and l.status = 'approved'),
    'listings_with_handle', (select count(*) from listings where status = 'approved' and ve_ig_handle(instagram) is not null));
$$;
revoke all on function ve_ig_follow_summary(text) from public, anon, authenticated;
