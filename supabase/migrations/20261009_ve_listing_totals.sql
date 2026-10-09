-- The brand's numbers so far, shown in its For <Brand> tour before it pays (Sean, 2026-10-09, after a panel: "show the
-- totals since the page went up to anyone on the link; keep the breakdown by day, source, product and store for partners").
-- Four counts since the first counted visit, only for listings that carry a For <Brand> door (details.brand_door).
-- The breakdown stays behind ve-claims brand_stats (owner or super admin).
create or replace function public.ve_listing_totals(p_listing uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  select case when not exists (select 1 from listings where id = p_listing and status = 'approved' and details ? 'brand_door') then null
  else (
    with e as (select * from ve_listing_events where listing_id = p_listing and via is distinct from 'test')
    select jsonb_build_object(
      'since', (select min(created_at) from e),
      'views', (select count(*) from e where kind = 'view'),
      'visitors', (select count(distinct visitor) from e where visitor is not null),
      'products', (select count(*) from e where kind = 'product'),
      'stores', (select count(*) from e where kind = 'store'))
  ) end;
$$;
grant execute on function public.ve_listing_totals(uuid) to anon, authenticated;
