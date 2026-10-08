-- What visitors do on a Directory listing (Sean, 2026-10-08): the numbers behind a brand's dashboard
-- ("a tab that's locked just for the brand to see the opportunities and performance of their page").
-- Applied 2026-10-08 through the connector, create-only.
--
--   ve_listing_events      view | product (ref = product slug) | store (ref = store slug) | video (ref = YouTube id) | gallery
--   ve_listing_track()     the only way in (anon): one count per visitor, listing, action and item every 30 minutes
--   ve_listing_stats()     the only way out (service role): what ve-claims brand_stats returns to the owner or a super admin
-- via: page, guide (inside a Guide's frame), link (arrived on a /go/ tracked link), test (left out of the stats).

create table if not exists public.ve_listing_events (
  id bigserial primary key,
  listing_id uuid not null references public.listings(id) on delete cascade,
  kind text not null check (kind in ('view','product','store','video','gallery')),
  ref text,
  visitor text,
  via text,
  created_at timestamptz not null default now()
);
create index if not exists ve_listing_events_listing_idx on public.ve_listing_events (listing_id, created_at desc);
alter table public.ve_listing_events enable row level security;

create or replace function public.ve_listing_track(p_listing uuid, p_kind text, p_ref text default null, p_visitor text default null, p_via text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kind not in ('view','product','store','video','gallery') then return; end if;
  if p_visitor is not null and length(p_visitor) > 64 then return; end if;
  if not exists (select 1 from listings where id = p_listing and status = 'approved') then return; end if;
  if p_visitor is not null and exists (select 1 from ve_listing_events where listing_id = p_listing and kind = p_kind and coalesce(ref,'') = coalesce(p_ref,'')
       and visitor = p_visitor and created_at > now() - interval '30 minutes') then return; end if;
  insert into ve_listing_events (listing_id, kind, ref, visitor, via) values (p_listing, p_kind, left(p_ref, 120), p_visitor, left(p_via, 20));
end $$;
revoke all on function public.ve_listing_track(uuid, text, text, text, text) from public;
grant execute on function public.ve_listing_track(uuid, text, text, text, text) to anon, authenticated;

create or replace function public.ve_listing_stats(p_listing uuid, p_days int default 30)
returns jsonb language sql security definer set search_path = public as $$
  with e as (select * from ve_listing_events where listing_id = p_listing and via is distinct from 'test' and created_at > now() - make_interval(days => greatest(1, least(p_days, 365))))
  select jsonb_build_object(
    'days', greatest(1, least(p_days, 365)),
    'since', (select min(created_at) from ve_listing_events where listing_id = p_listing and via is distinct from 'test'),
    'totals', (select coalesce(jsonb_object_agg(kind, n), '{}'::jsonb) from (select kind, count(*) n from e group by kind) t),
    'visitors', (select count(distinct visitor) from e where visitor is not null),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', d, 'views', v) order by d), '[]'::jsonb) from (select date_trunc('day', created_at)::date d, count(*) filter (where kind = 'view') v from e group by 1) t),
    'products', (select coalesce(jsonb_agg(jsonb_build_object('ref', ref, 'n', n) order by n desc), '[]'::jsonb) from (select ref, count(*) n from e where kind = 'product' group by ref) t),
    'stores', (select coalesce(jsonb_agg(jsonb_build_object('ref', ref, 'n', n) order by n desc), '[]'::jsonb) from (select ref, count(*) n from e where kind = 'store' group by ref) t),
    'videos', (select coalesce(jsonb_agg(jsonb_build_object('ref', ref, 'n', n) order by n desc), '[]'::jsonb) from (select ref, count(*) n from e where kind = 'video' group by ref) t),
    'via', (select coalesce(jsonb_object_agg(coalesce(via, 'page'), n), '{}'::jsonb) from (select via, count(*) n from e where kind = 'view' group by via) t)
  );
$$;
revoke all on function public.ve_listing_stats(uuid, int) from public, anon, authenticated;
grant execute on function public.ve_listing_stats(uuid, int) to service_role;
