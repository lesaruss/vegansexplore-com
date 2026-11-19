-- The position dashboard (/dashboard/position), built from the locked mock /mocks/kj-dashboard (Sean, 2026-11-19: "lock it").
-- Data from the database, never hard-coded: the role list (ve_position_duties), the weekly briefs (ve_position_briefs), Sean's asks
-- (ve_position_asks, with each holder's ticks in ve_position_ask_done) and the Ask Kai thread (ve_position_kai). Served only by the
-- ve-positions function (service role): RLS on, no policies. Conversations come from ve_reach_inbound and ve-reach (reused), Your people
-- from ve_links / ve_link_clicks, the record from ve_position_payouts and ve_reach_log.

create table if not exists public.ve_position_duties (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.ve_positions(id) on delete cascade,
  kind text not null default 'duty' check (kind in ('duty', 'never', 'short')),
  grp text,                       -- the group heading ("Your people and your audience: the biggest part")
  grp_sort int not null default 0,
  grp_tag text,                   -- the tag words ("Biggest part")
  tone text not null default 'tip' check (tone in ('need', 'new', 'tip', 'done', 'flag')),
  sort int not null default 0,
  body text not null check (char_length(body) <= 1000),
  step text check (step in ('agreement', 'payouts', 'access', 'link', 'pages')),  -- a one-time item ticked from the holder's own record
  status text not null default 'live' check (status in ('live', 'draft', 'retired')),
  created_at timestamptz not null default now()
);
create index if not exists ve_position_duties_pos on public.ve_position_duties (position_id, kind, grp_sort, sort);
alter table public.ve_position_duties enable row level security;

create table if not exists public.ve_position_briefs (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.ve_positions(id) on delete cascade,
  week_of date not null,
  title text not null check (char_length(title) <= 200),
  from_line text not null default 'From Sean and Kai',
  where_text text check (char_length(where_text) <= 3000),
  next_text text check (char_length(next_text) <= 3000),
  question text check (char_length(question) <= 1000),
  status text not null default 'draft' check (status in ('draft', 'published', 'retired')),
  published_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_position_briefs_pos on public.ve_position_briefs (position_id, status, week_of desc);
alter table public.ve_position_briefs enable row level security;

create table if not exists public.ve_position_asks (
  id uuid primary key default gen_random_uuid(),
  position_id uuid not null references public.ve_positions(id) on delete cascade,
  brief_id uuid references public.ve_position_briefs(id) on delete set null,
  title text not null check (char_length(title) <= 300),
  body text check (char_length(body) <= 2000),
  link text check (char_length(link) <= 500),
  due_text text check (char_length(due_text) <= 60),
  sort int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'open', 'retired')),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_position_asks_pos on public.ve_position_asks (position_id, status, sort);
alter table public.ve_position_asks enable row level security;

create table if not exists public.ve_position_ask_done (
  ask_id uuid not null references public.ve_position_asks(id) on delete cascade,
  person_id uuid not null references public.ve_position_people(id) on delete cascade,
  done_at timestamptz not null default now(),
  primary key (ask_id, person_id)
);
alter table public.ve_position_ask_done enable row level security;

-- The Ask Kai thread. The holder writes; Kai answers what he is sure of (a Claude call in ve-positions); anything unsure, or about money,
-- contracts, access, policy or promises, waits for Sean (needs_sean) and his answer posts as Kai (author 'sean', shown as Kai). Asks replies,
-- brief answers and ideas always go to Sean, with Kai acknowledging.
create table if not exists public.ve_position_kai (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.ve_position_people(id) on delete cascade,
  author text not null check (author in ('holder', 'kai', 'sean')),
  topic text not null default 'chat' check (topic in ('chat', 'ask', 'brief', 'idea')),
  ref_id uuid,                    -- the ask or brief it answers
  body text not null check (char_length(body) <= 6000),
  sure boolean,                   -- Kai's own answer: was he sure
  needs_sean boolean not null default false,
  answered_at timestamptz,        -- when Sean (or Kai) answered a holder message
  reply_to uuid references public.ve_position_kai(id) on delete set null,
  emailed_at timestamptz,
  model text,
  created_at timestamptz not null default now()
);
create index if not exists ve_position_kai_person on public.ve_position_kai (person_id, created_at);
create index if not exists ve_position_kai_waiting on public.ve_position_kai (needs_sean, answered_at) where needs_sean;
alter table public.ve_position_kai enable row level security;

-- Each holder's region (the dashboard's eyebrow: "Community Manager, Northeast"); set when Sean assigns them.
alter table public.ve_position_people add column if not exists region text check (char_length(region) <= 60);

-- ---- Seed: the locked role (mock /mocks/kj-dashboard, Sean "lock it" 2026-11-19), the Philly Vegan Social Club ask (locked), and the
-- first brief and its three asks as DRAFTS (Sean publishes them from the Reach console's Team part). Safe to run twice.
do $$
declare pid uuid; bid uuid;
begin
  select id into pid from public.ve_positions where slug = 'social-media-manager-instagram';
  if pid is null then return; end if;
  if not exists (select 1 from public.ve_position_duties where position_id = pid) then
    insert into public.ve_position_duties (position_id, kind, grp, grp_sort, grp_tag, tone, sort, body, step) values
      (pid, 'duty', 'One time, to get started', 1, 'One time', 'need', 1, 'Sign the agreement.', 'agreement'),
      (pid, 'duty', 'One time, to get started', 1, 'One time', 'need', 2, 'Set up payouts with Stripe.', 'payouts'),
      (pid, 'duty', 'One time, to get started', 1, 'One time', 'need', 3, 'Accept the Business Suite invite.', 'access'),
      (pid, 'duty', 'One time, to get started', 1, 'One time', 'need', 4, 'Read the five group pages, so you know where people land.', 'pages'),
      (pid, 'duty', 'One time, to get started', 1, 'One time', 'need', 5, 'Save your link.', 'link'),
      (pid, 'duty', 'Your people and your audience: the biggest part', 2, 'Biggest part', 'new', 1, 'Invite the people you know personally, with your link.', null),
      (pid, 'duty', 'Your people and your audience: the biggest part', 2, 'Biggest part', 'new', 2, 'One post or reel a week on your own account about Vegans Explore in your city, posted as a collab with @vegansexplore. Your creator kit has a reel, story and carousel ready.', null),
      (pid, 'duty', 'Out in the Northeast', 3, 'Northeast', 'new', 1, 'At events, markets and Vegan spots, sign people up in person.', null),
      (pid, 'duty', 'Out in the Northeast', 3, 'Northeast', 'new', 2, 'Tell owners their page is free to claim.', null),
      (pid, 'duty', 'Out in the Northeast', 3, 'Northeast', 'new', 3, 'Send us events, places and people to spotlight.', null),
      (pid, 'duty', 'Community, about 15 minutes a day', 4, '15 min a day', 'tip', 1, 'Answer comments and messages on @vegansexplore, as Vegans Explore.', null),
      (pid, 'duty', 'Community, about 15 minutes a day', 4, '15 min a day', 'tip', 2, 'Send each person their own link.', null),
      (pid, 'duty', 'Community, about 15 minutes a day', 4, '15 min a day', 'tip', 3, 'Welcome new followers.', null),
      (pid, 'duty', 'Community, about 15 minutes a day', 4, '15 min a day', 'tip', 4, 'Tap what happened on each conversation: Replied, Link sent, Joined.', null),
      (pid, 'duty', 'Every week', 5, 'Every week', 'tip', 1, 'Read Monday''s brief and answer its question.', null),
      (pid, 'duty', 'Every week', 5, 'Every week', 'tip', 2, 'Do this week''s asks.', null),
      (pid, 'duty', 'Any time', 6, 'Any time', 'done', 1, 'Report anything that looks off (Report something, on every part).', null),
      (pid, 'duty', 'Any time', 6, 'Any time', 'done', 2, 'Share ideas with Kai.', null),
      (pid, 'duty', 'Any time', 6, 'Any time', 'done', 3, 'Ask the people you bring in to tell us what to fix.', null),
      (pid, 'never', 'Never', 9, 'Never', 'flag', 1, 'Post or change anything on @vegansexplore, touch its profile, settings or password, or start cold messages from @vegansexplore.', null),
      (pid, 'short', null, 0, null, 'need', 1, 'One time: agreement, Stripe payouts, Business Suite invite, the five group pages, your link.', null),
      (pid, 'short', null, 0, null, 'need', 2, 'Your people and your audience, the biggest part: invite people you know with your link; one collab post or reel a week on your own account.', null),
      (pid, 'short', null, 0, null, 'need', 3, 'Out in the Northeast: sign people up at events, markets and Vegan spots; tell owners their page is free to claim; send us what to spotlight.', null),
      (pid, 'short', null, 0, null, 'need', 4, 'Community, about 15 minutes a day: answer @vegansexplore as Vegans Explore, with each person''s link.', null),
      (pid, 'short', null, 0, null, 'need', 5, 'Every week: the brief and the asks. Any time: report what looks off, share ideas with Kai.', null);
  end if;
  if not exists (select 1 from public.ve_position_asks where position_id = pid and title like 'The Philly Vegan Social Club%') then
    insert into public.ve_position_asks (position_id, title, body, link, due_text, sort, status) values
      (pid, 'The Philly Vegan Social Club: do you run it, or are you part of it?',
       'We would love it to be one of the first community groups on Vegans Explore. If you run it, Kai will walk you through what that looks like. If not, could you connect us with whoever does? Your reply goes to Kai.',
       '/directory/philly-vegan-social-club', 'any time', 0, 'open');
  end if;
  if not exists (select 1 from public.ve_position_briefs where position_id = pid and week_of = '2026-11-23') then
    insert into public.ve_position_briefs (position_id, week_of, title, where_text, next_text, question, status) values
      (pid, '2026-11-23', 'This week''s brief: Monday, November 23',
       'We are at 84 members on the way to 250 by December 31. All five group pages are live, and every place in the Directory has its own link.',
       'Your people and the Northeast come first: invite the people you know with your own link, post your first collab reel, and find where to sign people up in person. Keep @vegansexplore answered in about 15 minutes a day.',
       'Which kind of post gets the most comments from businesses so far, and why do you think that is?', 'draft')
      returning id into bid;
    insert into public.ve_position_asks (position_id, brief_id, title, due_text, sort, status) values
      (pid, bid, 'Invite ten people you know with your link, and ask them to tell us if anything looks off.', 'Fri Nov 27', 1, 'draft'),
      (pid, bid, 'Post your first collab reel with @vegansexplore from your creator kit.', 'Fri Nov 27', 2, 'draft'),
      (pid, bid, 'Tell us one Northeast event or market this month where you could sign people up.', 'Fri Nov 27', 3, 'draft');
  end if;
end $$;
