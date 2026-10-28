-- The About line and cuisines reader (edge function ve-listing-about; Sean, 2026-10-28: every listing people click into has to
-- show something). Its queue is the Background writer's: ve_listing_essentials rows still queued (or stuck writing for a day),
-- open food places missing an about or a cuisine, the restaurant search's new listings first, then most voted.
create or replace function public.ve_listing_about_due(p_limit int default 6)
returns table(listing_id uuid)
language sql stable security definer set search_path to 'public' as $$
  select q.listing_id
  from ve_listing_essentials q
  join listings l on l.id = q.listing_id
  join ve_restaurant_essentials e on e.id = q.listing_id
  where l.status = 'approved'
    and (not e.has_about or not e.has_cuisine)
    and (q.write_status = 'queued' or (q.write_status = 'writing' and q.write_marked_at < now() - interval '1 day'))
  order by (l.crawl_source = 'restaurant-search') desc, l.vote_count desc nulls last, l.created_at desc
  limit greatest(1, least(p_limit, 40));
$$;
revoke all on function public.ve_listing_about_due(int) from public, anon, authenticated;

-- Every 5 minutes, six at a time (about 70 an hour); with nothing queued it costs nothing.
select cron.schedule('ve-listing-about', '*/5 * * * *', $c$
  select net.http_post(
    url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-listing-about',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select value from lesaruss_secrets where key = 'CRON_SECRET')),
    body := '{"action":"sweep","limit":6}'::jsonb, timeout_milliseconds := 30000);
$c$);
