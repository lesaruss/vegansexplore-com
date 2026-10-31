-- Guide tab numbers for Depot > Analytics > Guide tabs (Sean, 2026-10-31: "build the Depot view for the Guide tab numbers").
-- Reads ve_promo_events rows the listing page's Guide tab writes (promo gt-<guide slug>, cta tab, steps view and click).
-- People are counted once each (distinct visitor) per Guide, or per Guide and listing.
create or replace function public.ve_guide_tab_stats(p_from date, p_to date, p_prev_from date, p_prev_to date)
returns jsonb language sql stable security definer set search_path = public as $$
  with rng as (select p_from::timestamptz a, (p_to + 1)::timestamptz b, p_prev_from::timestamptz pa, (p_prev_to + 1)::timestamptz pb),
  ev as (
    select substr(e.promo, 4) guide, e.step, e.visitor, e.listing_id,
           (e.created_at >= rng.a and e.created_at < rng.b) cur
    from ve_promo_events e, rng
    where e.promo like 'gt-%' and e.cta = 'tab' and e.step in ('view', 'click')
      and ((e.created_at >= rng.a and e.created_at < rng.b) or (e.created_at >= rng.pa and e.created_at < rng.pb))
  ),
  g as (
    select guide,
      count(distinct visitor) filter (where cur and step = 'view') views,
      count(distinct visitor) filter (where cur and step = 'click') clicks,
      count(distinct visitor) filter (where not cur and step = 'view') views_prev,
      count(distinct visitor) filter (where not cur and step = 'click') clicks_prev,
      count(distinct listing_id) filter (where cur and step = 'view') listings
    from ev group by guide
  ),
  l as (
    select ev.guide, ev.listing_id,
      count(distinct visitor) filter (where step = 'view') views,
      count(distinct visitor) filter (where step = 'click') clicks
    from ev where cur and listing_id is not null group by 1, 2
  )
  select jsonb_build_object(
    'guides', coalesce((select jsonb_agg(to_jsonb(g) order by g.views desc) from g), '[]'),
    'listings', coalesce((select jsonb_agg(jsonb_build_object('guide', l.guide, 'listing_id', l.listing_id, 'name', li.name,
        'slug', li.slug, 'category', li.category, 'views', l.views, 'clicks', l.clicks) order by l.views desc)
      from (select * from l order by views desc limit 1000) l join listings li on li.id = l.listing_id), '[]'));
$$;
revoke all on function public.ve_guide_tab_stats(date, date, date, date) from public, anon, authenticated;
grant execute on function public.ve_guide_tab_stats(date, date, date, date) to service_role;
