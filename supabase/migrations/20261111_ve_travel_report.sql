-- The Travel report (playbook ve-travel, queue C: "Start the 90-day Travel report now"). Per Travel listing and per destination: page
-- views, distinct visitors, clicks to the business's own website, and Book clicks through our tracked /go/ links (ve_links initiative
-- travel-booking, bots excluded). Read-only; service role only. Where visitors come from (outside the market) is not in these tables:
-- pair it with Google Analytics or Vercel country data for the bureau report.
create or replace function ve_travel_report(p_from date default (current_date - 90), p_to date default current_date)
returns table(destination text, listing text, category text, views bigint, visitors bigint, website_clicks bigint, book_clicks bigint)
language sql stable security definer set search_path = public as $$
  with t as (
    select l.id, l.slug, l.name, l.category, coalesce(nullif(l.address_country, ''), 'Worldwide') as destination
    from listings l
    where l.status = 'approved' and l.category in ('Cruises', 'Stays', 'Retreats', 'Airlines', 'Travel Apps')
  ), ev as (
    select e.listing_id,
      count(*) filter (where e.kind = 'view') as views,
      count(distinct e.visitor) filter (where e.kind = 'view') as visitors,
      count(*) filter (where e.kind = 'website') as website_clicks
    from ve_listing_events e
    where e.created_at >= p_from and e.created_at < p_to + 1
    group by 1
  ), bk as (
    select t.id as listing_id, count(c.id) as book_clicks
    from t join ve_links k on k.initiative_slug = 'travel-booking' and t.slug = any(k.tags)
    join ve_link_clicks c on c.link_id = k.id and not coalesce(c.is_bot, false) and c.clicked_at >= p_from and c.clicked_at < p_to + 1
    group by 1
  )
  select t.destination, t.name, t.category, coalesce(ev.views, 0), coalesce(ev.visitors, 0), coalesce(ev.website_clicks, 0),
    coalesce(bk.book_clicks, 0)
  from t left join ev on ev.listing_id = t.id left join bk on bk.listing_id = t.id
  order by t.destination, coalesce(ev.views, 0) desc, t.name;
$$;
revoke all on function ve_travel_report(date, date) from public, anon, authenticated;
