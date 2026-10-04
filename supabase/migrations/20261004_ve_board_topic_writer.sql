-- Daily Pulse topics are written by the Background writer (Sean, 2026-10-04): the drafting runs as
-- the dispatcher's 'pulse_topic_write' job on Sean's Claude subscription (a station routine), not
-- on the Anthropic API key, which is out of credit and pay-per-use. The desk queues a draft; the
-- next dispatcher run writes the headline, intro and question into it; a person still approves.
--
-- write_status on a topic draft:
--   queued   waiting for the writer      writing  a run has it (stale after 20 minutes)
--   written  the writer filled it in     failed   the writer could not (write_error says why)
--   null     a person is finishing it by hand (saving or publishing takes it off the writer)

alter table public.ve_board_posts
  add column if not exists write_status text check (write_status in ('queued', 'writing', 'written', 'failed')),
  add column if not exists write_note text check (char_length(write_note) <= 500),
  add column if not exists write_error text check (char_length(write_error) <= 500),
  add column if not exists write_marked_at timestamptz;

create index if not exists ve_board_posts_topic_write_idx on public.ve_board_posts (write_status, write_marked_at)
  where kind = 'topic' and status = 'draft';

insert into public.lesaruss_dispatch_sources (key, label, enabled, batch, sort, instructions, notes)
values ('pulse_topic_write', 'Daily Pulse: write queued topic drafts', true, 5,
  coalesce((select max(sort) from public.lesaruss_dispatch_sources where key = 'news_desk_write'), 0) + 1,
$i$
Vegans Explore Daily Pulse. A Community Manager (or Sean) picked a story for today's Daily Pulse topic. Fill in the draft; never publish it.
The Daily Pulse is not an article: it is one conversation starter a day on the Community Board, for one city (community_slug) or for every city (community_slug 'national'). Members read it and talk about it underneath.
1. Load up to BATCH drafts:
   select id, community_slug, title, body, source_name, source_url, write_note from ve_board_posts
   where kind = 'topic' and status = 'draft' and (write_status = 'queued' or (write_status = 'writing' and write_marked_at < now() - interval '20 minutes'))
   order by write_marked_at nulls first limit BATCH;
2. For each: update ve_board_posts set write_status = 'writing', write_marked_at = now(), write_error = null where id = '<id>' and status = 'draft' and write_status in ('queued', 'writing');
   Read source_url with WebFetch. Google News links (news.google.com/rss/articles/...) usually will not open: WebSearch the headline plus outlet, then fetch the original. title and body hold what the Inbox knew about the story; write_note is the desk's own line about it (follow it).
3. Write three things:
   - title: a plain, specific headline in your own words, under 90 characters. Not the outlet's headline.
   - intro (goes in body): two to four neutral sentences, under 600 characters, on what happened, using only facts from the source or confirmed by a search. Your own words; never copy sentences. If something is unconfirmed, say so ("according to the owner").
   - question: one real question, under 160 characters, that invites members to share their own experience or view, for example "Would you go?", "Has your city tried this?", "What would you order?". Never a loaded or bait question.
   Rules: always capitalize Vegan, Vegans and Veganism. No em dashes or en dashes. No emoji, hashtags or markdown. No health or tax claims. Never invent names, dates, prices, addresses, quotes or numbers. Stay neutral on controversies and attribute claims to their source. A local topic is for Vegans in that city; a national one for Vegans anywhere.
   If the outlet name in source_name is a bare web address, set it to the outlet's real name (for example "Miami New Times").
4. Save it, only if a person has not taken it over meanwhile (dollar-quote text values, $b$...$b$):
   update ve_board_posts set title = <title>, body = <intro>, question = <question>, source_name = <outlet name>, write_status = 'written', write_error = null, updated_at = now()
   where id = '<id>' and status = 'draft' and write_status = 'writing';
   If it cannot be written (source gone, not about Vegan life, nothing to ask): update ve_board_posts set write_status = 'failed', write_error = <short reason> where id = '<id>' and write_status = 'writing'; and move on.
Do not publish, do not reply, do not touch any other post.
$i$,
'Replaces the ve-board topic_draft call to the Anthropic API (out of credit, pay-per-use). Sean, 2026-10-04.')
on conflict (key) do nothing;

-- Count queued topic drafts alongside the dispatcher's other jobs.
create or replace function public.lesaruss_dispatch_pending()
 returns jsonb
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select jsonb_build_object(
    'news_desk_write', (select count(*) from ve_news_leads where status = 'write' or (status = 'drafting' and marked_at < now() - interval '20 minutes')),
    'pulse_topic_write', (select count(*) from ve_board_posts where kind = 'topic' and status = 'draft' and (write_status = 'queued' or (write_status = 'writing' and write_marked_at < now() - interval '20 minutes'))),
    'fieldy_topicizer', (select count(*) from fieldy_transcripts where received_at > coalesce((select last_processed_through from fieldy_topicizer_state where id = 1), '2026-04-15') and received_at < now() - interval '30 minutes'),
    'room_work_orders', (select count(*) from room_work_orders where status = 'queued'),
    'agent_tasks_logan', (select count(*) from agent_tasks where status = 'pending' and lower(to_agent) = 'logan'),
    'fieldy_v_requests', (select count(*) from fieldy_transcripts where is_command and coalesce(command_status, 'pending') not in ('completed', 'done', 'dismissed', 'failed')),
    'personal_ideas_raw', (select count(*) from personal_ideas where status = 'raw'),
    'brand_features_to_build', (select count(*) from brand_dashboard_features where planned and not live),
    'playbook_orders_due', (select count(*) from playbook_records where applied = false),
    'people_tasks', (select count(*) from people_profile_queue where status not in ('profiled', 'skipped'))
  );
$function$;
