-- LESARUSS.ai's Pulse by topic (Sean, locked 2026-10-29, canon canon-lesaruss-ai-front-door, playbook lesaruss-ai-front-door:
-- "Pulse: business RSS sources, the banner picks a topic (AI, Funding, Marketing, Leadership, Creators, Business operations,
-- Events) where Vegans Explore picks a city"). One engine: the same ve_board_posts topics, ve-board, pulse_auto and the
-- Background writer (pulse_topic_write). A topic scope is community_slug 'lr-<topic>'; its stories are ve_news_leads with
-- brand_slug 'lesaruss-ai' and city_slug the topic, pulled by ve-news-desk from ve_news_feeds scope 'topic'.
-- Every step is safe to run twice.

-- 1. A feed scope for another brand's topic outlets.
alter table ve_news_feeds drop constraint if exists ve_news_feeds_scope_check;
alter table ve_news_feeds add constraint ve_news_feeds_scope_check check (scope = any (array['local', 'vegan', 'search', 'topic']));

-- 2. The business sources, each checked from the database server on 2026-10-30 (pg_net: HTTP 200 with items).
insert into ve_news_feeds (brand_slug, scope, city_slug, feed_name, feed_url, search_query, locale, is_active, notes)
select 'lesaruss-ai', 'topic', t, n, u, q, 'US', true, 'LESARUSS.ai Pulse source (2026-10-30)'
from (values
  ('lr-ai', 'TechCrunch AI', 'https://techcrunch.com/category/artificial-intelligence/feed/', null),
  ('lr-ai', 'The Verge AI', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml', null),
  ('lr-ai', 'ZDNET AI', 'https://www.zdnet.com/topic/artificial-intelligence/rss.xml', null),
  ('lr-funding', 'Crunchbase News', 'https://news.crunchbase.com/feed/', null),
  ('lr-funding', 'TechCrunch Venture', 'https://techcrunch.com/category/venture/feed/', null),
  ('lr-funding', 'Sifted', 'https://sifted.eu/feed', null),
  ('lr-funding', 'Grants and accelerators (Google News)', 'google-news', '"small business grant" OR "startup accelerator" OR "pitch competition" OR "grant program for entrepreneurs"'),
  ('lr-marketing', 'Marketing Dive', 'https://www.marketingdive.com/feeds/news/', null),
  ('lr-marketing', 'Social Media Today', 'https://www.socialmediatoday.com/feeds/news/', null),
  ('lr-marketing', 'Adweek', 'https://www.adweek.com/feed/', null),
  ('lr-leadership', 'Fast Company Leadership', 'https://www.fastcompany.com/leadership/rss', null),
  ('lr-leadership', 'Inc.', 'https://www.inc.com/rss/', null),
  ('lr-leadership', 'Entrepreneur', 'https://www.entrepreneur.com/latest.rss', null),
  ('lr-creators', 'Tubefilter', 'https://www.tubefilter.com/feed/', null),
  ('lr-creators', 'Passionfruit', 'https://www.passionfru.it/feed', null),
  ('lr-creators', 'Creator Economy', 'https://creatoreconomy.so/feed', null),
  ('lr-operations', 'Small Business Trends', 'https://smallbiztrends.com/feed', null),
  ('lr-operations', 'CNBC Small Business', 'https://www.cnbc.com/id/44877279/device/rss/rss.html', null),
  ('lr-operations', 'CIO', 'https://www.cio.com/feed/', null),
  ('lr-events', 'BizBash', 'https://www.bizbash.com/rss.xml', null),
  ('lr-events', 'Event Marketer', 'https://www.eventmarketer.com/feed/', null)
) v(t, n, u, q)
where not exists (select 1 from ve_news_feeds f where f.brand_slug = 'lesaruss-ai' and f.feed_name = v.n);

-- 3. Tomorrow's briefing for each topic, queued with the cities at 6 PM Eastern and out at 7 AM (ve_pulse_tz: New York).
create or replace function public.ve_pulse_auto_queue()
 returns jsonb
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  cfg jsonb := coalesce((select value::jsonb from lesaruss_dispatch_settings where key = 'pulse_auto'), '{}');
  c text; tz text; at timestamptz; queued text[] := '{}';
  who uuid := (cfg ->> 'member_id')::uuid;
  hhmm time := coalesce(cfg ->> 'publish_local', '07:00')::time;
  names jsonb := '{"national":"Daily Pulse","south-florida":"South Florida Pulse","central-florida":"Central Florida Pulse","north-florida":"North Florida Pulse","atlanta":"Atlanta Pulse","washington-dc":"Washington, D.C. Pulse","delaware":"Delaware Pulse","maryland":"Maryland Pulse","virginia":"Virginia Pulse","west-virginia":"West Virginia Pulse","new-york":"New York Pulse","philadelphia":"Philadelphia Pulse","los-angeles":"Los Angeles Pulse","london":"London Pulse","lr-ai":"AI Pulse","lr-funding":"Funding Pulse","lr-marketing":"Marketing Pulse","lr-leadership":"Leadership Pulse","lr-creators":"Creators Pulse","lr-operations":"Operations Pulse","lr-events":"Events Pulse"}';
begin
  if who is null then return jsonb_build_object('queued', queued, 'reason', 'no member_id in pulse_auto'); end if;
  for c in select jsonb_array_elements_text(coalesce(cfg -> 'communities', '[]')) loop
    tz := ve_pulse_tz(c);
    at := (((now() at time zone tz)::date + 1) + hhmm) at time zone tz;
    if exists (select 1 from ve_board_posts where kind = 'topic' and community_slug = c and auto_publish_at = at) then continue; end if;
    insert into ve_board_posts (community_slug, member_id, kind, category, status, title, body, question, write_status, write_marked_at, write_note, auto_publish_at)
    values (c, who, 'topic', 'pulse', 'draft', coalesce(names ->> c, 'Daily Pulse'), 'The Background writer is building tomorrow''s briefing.', '',
      'queued', now(), 'Auto: tomorrow''s briefing. It goes out on its own at ' || to_char(at at time zone tz, 'FMHH12:MI AM') || ' ' || to_char(at at time zone tz, 'Dy, Mon FMDD') || ' unless someone discards it. Write the first reply too.', at);
    queued := queued || c;
  end loop;
  if array_length(queued, 1) > 0 then perform lesaruss_dispatch_tick(); end if;
  return jsonb_build_object('queued', queued);
end $function$;

update lesaruss_dispatch_settings
set value = jsonb_set(value::jsonb, '{communities}', (value::jsonb -> 'communities') ||
      (select coalesce(jsonb_agg(t), '[]'::jsonb) from unnest(array['lr-ai', 'lr-funding', 'lr-marketing', 'lr-leadership', 'lr-creators', 'lr-operations', 'lr-events']) t
       where not (value::jsonb -> 'communities') ? t))::text,
    updated_at = now()
where key = 'pulse_auto';

-- 4. The writer: how a LESARUSS.ai topic briefing differs from a city's.
update lesaruss_dispatch_sources
set instructions = instructions || $w$

LESARUSS.ai topics (Sean, 2026-10-29, canon canon-lesaruss-ai-front-door). A community_slug that starts with lr- is a LESARUSS.ai Pulse briefing for business owners and creators, by topic instead of city, shown on lesaruss.ai/pulse:
   lr-ai (AI for business), lr-funding (grants, loans, accelerators, pitch competitions, funding rounds), lr-marketing, lr-leadership, lr-creators (the creator economy), lr-operations (running the business: tools, hiring, money, small business policy), lr-events (conferences, summits, pitch nights, workshops, traveling tours).
   For these, everything above about Vegans, cities, chapters, Community Managers, bounties, the Board and member suggestions does not apply. Instead:
   a. Stories, last 7 days, not already used: select id, title, url, source_name, summary, published_at from ve_news_leads
      where brand_slug = 'lesaruss-ai' and city_slug = '<topic>' and status <> 'dismissed' and topic_post_id is null and coalesce(published_at, created_at) > now() - interval '7 days'
      order by coalesce(published_at, created_at) desc limit 30;
      Pick up to 5 that matter most to a small business owner or creator building with AI: real news they can use or act on. Skip rumor, listicles, sponsored posts, celebrity gossip and repeats. Read each with WebFetch (as above) and use only what it says.
   b. Events: none until the LESARUSS.ai Events calendar exists, except an event a story you read names, with its official page as the url.
   c. One action. The best is often a story's own official page (a grant's or accelerator's Apply page with its deadline as the source states it, a conference's registration). Otherwise a page on lesaruss.ai, as a path: /directory (studios, media, venues, services and tools), /guides, /passport (the $11 LESARUSS Passport: vote and comment), /join (become a Diplomat).
   Title: "<Topic> Pulse: " plus the two or three things, under 90 characters (AI Pulse, Funding Pulse, Marketing Pulse, Leadership Pulse, Creators Pulse, Operations Pulse, Events Pulse).
   Voice: LESARUSS.ai, "your guides in the new AI world": plain, practical and encouraging, for owners who are busy: what happened, why it matters to your business, what to do about it. The first reply is in the voice of the LESARUSS team.
   The same rules: no em or en dashes, no emoji, hashtags or markdown, never invent names, dates, amounts or deadlines, attribute claims, and no financial, legal or tax advice. Read the last three published briefings for that topic first and do not repeat them. With no real news for a topic in 7 days, a shorter briefing from one story is fine; with none at all, mark it failed with "No new stories this week" (a failed draft does not go out).$w$,
    updated_at = now()
where key = 'pulse_topic_write' and instructions not like '%LESARUSS.ai topics (Sean, 2026-10-29%';
