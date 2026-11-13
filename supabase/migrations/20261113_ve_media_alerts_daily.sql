-- Media list upkeep (Sean, 2026-11-13; playbook ve-newsroom). Applied 2026-11-13.
-- 1. Our own site is not a media outlet (it came in from our own News Desk stories). ve-media-alerts leaves out
--    vegansexplore.com and lesaruss.com from now on.
delete from public.ve_media_outlets where domain in ('vegansexplore.com', 'lesaruss.com');

-- 2. News Desk stories (Vegans Explore only) whose link is a news.google.com redirect: the real site is not in the link,
--    so they are filed under an outlet whose name matches the story's source name. Unmatched ones stay out.
insert into public.ve_media_coverage (outlet_id, url, title, snippet, source_name, published_on, origin, news_lead_id)
select o.id, l.url, left(l.title, 500), left(regexp_replace(coalesce(l.summary, ''), '<[^>]+>', ' ', 'g'), 600), l.source_name,
       coalesce(l.published_at, l.created_at)::date, 'news_desk', l.id
from public.ve_news_leads l
join lateral (
  select id from public.ve_media_outlets o
  where lower(o.name) = lower(trim(l.source_name)) order by o.articles_count desc limit 1
) o on true
where l.brand_slug = 'vegans-explore' and l.url like '%news.google.com%' and l.title is not null
on conflict (url) do nothing;

-- 3. Daily at 12:17 UTC (7:17 AM Eastern in winter, 8:17 AM in summer), after the evening alert has landed.
select cron.schedule('ve-media-alerts-daily', '17 12 * * *', $$
  select net.http_post(url := 'https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-media-alerts',
    headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',(select value from public.lesaruss_secrets where key='CRON_SECRET')),
    body := jsonb_build_object('days', 3), timeout_milliseconds := 150000);
$$);
