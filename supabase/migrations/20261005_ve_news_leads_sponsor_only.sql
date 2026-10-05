-- No city news (Sean, 2026-10-05): "We're doing the Daily Pulse ... We may do an article if it's a
-- sponsor." The Inbox feeds the Pulse; writing a story up as an article, or sharing it to a hub, is
-- for sponsor stories only, and records which sponsor (ve-news-desk lead_write / lead_share).
alter table public.ve_news_leads add column if not exists sponsor_name text;

-- A story a Pulse topic already used is done, not waiting on a decision.
create or replace function public.ve_news_inbox_stats(p_brand text default null)
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'counts', (select jsonb_build_object(
        'decide', count(*) filter (where status = 'new' and topic_post_id is null),
        'writing', count(*) filter (where status in ('write','drafting')),
        'ready', count(*) filter (where status = 'drafted'),
        'done', count(*) filter (where status in ('published','shared','dismissed') or (status = 'new' and topic_post_id is not null)))
      from ve_news_leads where p_brand is null or brand_slug = p_brand),
    'by_source', coalesce((select jsonb_agg(t) from (
        select coalesce(feed_id::text, origin) as key, count(*) as sent,
          count(*) filter (where status in ('write','drafting','drafted','published','shared') or topic_post_id is not null) as approved,
          count(*) filter (where status = 'dismissed') as denied,
          count(*) filter (where status = 'new' and topic_post_id is null) as untouched
        from ve_news_leads where p_brand is null or brand_slug = p_brand group by 1) t), '[]'::jsonb),
    'by_brand', coalesce((select jsonb_object_agg(brand_slug, n) from (
        select brand_slug, count(*) filter (where status = 'new' and topic_post_id is null) as n from ve_news_leads group by 1) b), '{}'::jsonb));
$function$;
