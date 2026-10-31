-- One Daily Pulse per city, the national news inside it (Sean, 2026-10-31: "wouldn't it make more sense just to
-- include the national news in the Philadelphia [Pulse]? Maybe feature the Philadelphia news first, then the
-- national, so it's all in one pulse"). The separate national briefing stops being queued (pulse_auto loses
-- 'national'); published national topics stay readable. Each city briefing adds up to 3 national stories after
-- its own, marked "national": true in briefing.stories; a national story may run in every city, so it is limited
-- by that city's own last 10 days of briefings, not by topic_post_id.

update public.lesaruss_dispatch_settings
set value = jsonb_set(value::jsonb, '{communities}', (select coalesce(jsonb_agg(c), '[]'::jsonb) from jsonb_array_elements(value::jsonb->'communities') c where c <> '"national"'::jsonb))::text
where key = 'pulse_auto' and value::jsonb->'communities' ? 'national';

update public.lesaruss_dispatch_sources set instructions =
  replace(replace(replace(replace(instructions,
    'community_slug is the city (south-florida, central-florida, atlanta, dmv, new-york, philadelphia, los-angeles, london) or ''national'' (every city; national news and national actions).',
    'community_slug is the city (south-florida, central-florida, north-florida, atlanta, washington-dc, maryland, virginia, delaware, west-virginia, new-york, philadelphia, los-angeles, london). Since 2026-10-31 there is no separate national briefing: each city''s briefing carries the day''s national news after its own (step 3d). An older draft with community_slug ''national'' is still written as before.'),
    E'\n\n4. Write:',
    E'\n   d. National news (Sean, 2026-10-31: one Pulse per city, the city''s news first, then the national). After the city''s own stories, add up to 3 national stories:\n      select id, title, url, source_name, summary, published_at from ve_news_leads\n      where brand_slug = ''vegans-explore'' and city_slug is null and status <> ''dismissed'' and coalesce(published_at, created_at) > now() - interval ''3 days''\n      and id not in (select (s->>''lead_id'')::uuid from ve_board_posts p cross join jsonb_array_elements(coalesce(p.briefing->''stories'', ''[]''::jsonb)) s\n        where p.kind = ''topic'' and p.community_slug = ''<city>'' and p.published_at > now() - interval ''10 days'' and s->>''lead_id'' ~ ''^[0-9a-f-]{36}$'')\n      order by coalesce(published_at, created_at) desc limit 40;\n      Pick the up to 3 biggest for Vegans anywhere (a national policy or legal win, a major brand or product change, a recall, a big study, animal protection news), read each as in 3a, and add them after the city''s stories. A national story is not limited by topic_post_id: every city may carry the same one that day. When the city has no local news, the national stories lead and the opening says so plainly; never present a national story as local.\n\n4. Write:'),
    'lead_id (its ve_news_leads id from step 3a, or null for a story found another way).',
    'lead_id (its ve_news_leads id from step 3a or 3d, or null for a story found another way), national (true for a story from step 3d; leave it out for the city''s own).'),
    ' (national: "Daily Pulse: ...")', ''),
  notes = coalesce(notes, '') || E'\n2026-10-31: national news folded into each city briefing (step 3d); no national draft is queued (Sean).'
where key = 'pulse_topic_write' and instructions not like '%3d. National news%' and instructions not like '%d. National news (Sean, 2026-10-31%';
