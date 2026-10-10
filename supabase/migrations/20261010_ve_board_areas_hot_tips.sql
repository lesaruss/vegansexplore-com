-- Community Board areas and hot tips (Sean, 2026-10-10). A post is for one area of its city
-- (VE_HUBS[].page.boardAreas in public/ve-hubs.js, kept in ve_board_posts.area) or the whole city,
-- and readers filter by area (ve-board list `area`). Hot tips ("a way for people to leave news, hot tips,
-- letting us know what's going on in their cities") are a Suggest a Topic type the Pulse writer reads
-- alongside Daily Pulse ideas.

alter table public.ve_board_posts drop constraint if exists ve_board_posts_category_check;
alter table public.ve_board_posts add constraint ve_board_posts_category_check
  check (category in ('rescue', 'transport', 'fostering', 'food', 'services', 'volunteers', 'other', 'pulse',
    'hiring', 'seeking', 'for_sale', 'free', 'wanted', 'trade', 'foster_needed', 'foster_offered',
    'rescue_urgent', 'rescue_needed', 'rescue_update', 'hot_tip', 'pulse_idea', 'talk_idea', 'board_idea', 'guide'));

-- The pinned Suggest a Topic guide in each city explains hot tips.
update public.ve_board_posts set body = replace(replace(body,
  'then pick For the Daily Pulse, Something to talk about, or An idea for the board.',
  'then pick A hot tip, For the Daily Pulse, Something to talk about, or An idea for the board.'),
  E'\n\nFor the Daily Pulse:',
  E'\n\nA hot tip: something happening in your area right now, like an opening, a closing, or an event this week. Pick your area so people nearby see it.\nFor the Daily Pulse:'),
  updated_at = now()
where kind = 'suggestion' and pinned and position('A hot tip' in body) = 0;

-- The Pulse writer reads hot tips with the Daily Pulse ideas (applied base64-encoded through the connector,
-- error registry SUPABASE-MCP-SQL-TIMEOUT-LONG-INSTRUCTIONS):
-- update lesaruss_dispatch_sources set instructions = replace(instructions,
--   'and category = ''pulse_idea'' and status = ''open''', 'and category in (''pulse_idea'', ''hot_tip'') and status = ''open''')
-- where key = 'pulse_topic_write';
