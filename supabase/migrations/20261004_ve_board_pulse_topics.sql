-- Daily Pulse as discussion topics (Sean, 2026-10-04, playbook ve-daily-pulse-discussion).
-- The Pulse stops being articles and becomes one topic a day per city plus one national topic,
-- posted to the Community Board in its own lane: a short intro, one real question, and a link to
-- the source. A topic is a ve_board_posts row with kind 'topic', so it gets the Board's replies,
-- reports and moderation for free.
--
-- community_slug 'national' holds the national topic (shown in every city's Pulse lane).
-- A topic starts as a 'draft' (only moderators see it), drafted from an Inbox story or a pasted
-- link. The city's Community Manager approves it in the Pulse Desk; Sean approves the national
-- one. Approving needs a first reply, so no topic goes up to an empty room.

alter table public.ve_board_posts drop constraint if exists ve_board_posts_kind_check;
alter table public.ve_board_posts add constraint ve_board_posts_kind_check check (kind in ('request', 'offer', 'topic'));

-- Topics carry the category 'pulse'; requests and offers keep their seven.
alter table public.ve_board_posts drop constraint if exists ve_board_posts_category_check;
alter table public.ve_board_posts add constraint ve_board_posts_category_check
  check (category in ('rescue', 'transport', 'fostering', 'food', 'services', 'volunteers', 'other', 'pulse'));

alter table public.ve_board_posts drop constraint if exists ve_board_posts_status_check;
alter table public.ve_board_posts add constraint ve_board_posts_status_check check (status in ('draft', 'open', 'resolved', 'hidden'));

alter table public.ve_board_posts
  add column if not exists question text check (char_length(question) <= 300),
  add column if not exists source_name text check (char_length(source_name) <= 120),
  add column if not exists source_url text check (char_length(source_url) <= 1000),
  add column if not exists lead_id uuid references public.ve_news_leads(id) on delete set null,
  add column if not exists published_at timestamptz;

-- A topic always names its source.
alter table public.ve_board_posts drop constraint if exists ve_board_posts_topic_source_check;
alter table public.ve_board_posts add constraint ve_board_posts_topic_source_check
  check (kind <> 'topic' or (source_url is not null and source_name is not null and question is not null));

create index if not exists ve_board_posts_topics_idx on public.ve_board_posts (kind, community_slug, status, published_at desc) where kind = 'topic';

-- Which Inbox story became a topic, so the desk stops suggesting it.
alter table public.ve_news_leads add column if not exists topic_post_id uuid references public.ve_board_posts(id) on delete set null;
