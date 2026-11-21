-- 2026-11-21: comment-to-DM on @vegansexplore, built in-house (Sean: "Is there a way to automate that, like ManyChat, without using
-- ManyChat?" ... "you can go ahead and build it"). Edge function ve-ig-comments receives Instagram comment webhooks; a comment with a keyword
-- (B12, ...) gets one private reply (Meta's private reply, one per comment) carrying a personal tracked /go/ link, and a short public reply.
-- Service role only (RLS on, no policies). Safe to run twice.

create table if not exists ve_ig_keywords (
  id bigserial primary key,
  brand_slug text not null default 'vegans-explore',
  keyword text not null,                       -- matched as a whole word, case-insensitive
  media_id text,                               -- null: any post; set: only that post
  dm_text text not null,                       -- {link} is replaced with the commenter's personal tracked link
  destination text not null,                   -- where the tracked link goes (site path)
  initiative_slug text not null default 'doctor-tips',
  public_replies text[] not null default array['Sent! Check your DMs 🌱', 'Just sent it to your DMs.', 'On its way to your DMs.'],
  active boolean not null default true,
  note text,
  created_at timestamptz not null default now()
);
create unique index if not exists ve_ig_keywords_kw_media on ve_ig_keywords (upper(keyword), coalesce(media_id, ''));

create table if not exists ve_ig_comment_events (
  id bigserial primary key,
  comment_id text not null unique,
  media_id text,
  from_id text,
  from_username text,
  text text,
  keyword_id bigint references ve_ig_keywords(id),
  status text not null default 'received',     -- received, no_match, own, repeat, dm_sent, dm_failed
  link_code text,
  dm_error text,
  public_reply_id text,
  created_at timestamptz not null default now(),
  dm_sent_at timestamptz
);
create index if not exists ve_ig_comment_events_from_kw on ve_ig_comment_events (from_id, keyword_id);

create table if not exists ve_ig_oauth_state (
  state text primary key,
  created_at timestamptz not null default now()
);

alter table ve_ig_keywords enable row level security;
alter table ve_ig_comment_events enable row level security;
alter table ve_ig_oauth_state enable row level security;

-- First keyword: B12, from the doctor's tips (Barnard B12 v5 mock). The Nutrition Guide's B12 part is free.
insert into ve_ig_keywords (keyword, dm_text, destination, note)
select 'B12',
  E'Here''s your free B12 guide 🌱 How much, how often and which kind, from the Vegans Explore Nutrition Guide: {link}',
  '/guides/nutrition-guide',
  'Doctor''s tips series (Barnard, Klaper), 2026-11-21'
where not exists (select 1 from ve_ig_keywords where upper(keyword) = 'B12' and media_id is null);

-- Weekly token refresh (Instagram long-lived tokens last 60 days). Applied 2026-11-21.
-- select cron.schedule('ve-ig-token-refresh', '23 13 * * 1', $c$select net.http_post(url:='https://fwbhwfxpncrsfhttimna.supabase.co/functions/v1/ve-ig-comments?action=refresh', headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select value from lesaruss_secrets where key='LESARUSS_ADMIN_TOKEN')), body:='{}'::jsonb, timeout_milliseconds:=30000)$c$);
-- The webhook verify token IG_WEBHOOK_VERIFY_TOKEN was generated into lesaruss_secrets (random, not in the repo).
-- Key Room requests (Sean fills them in hq.lesaruss.ai/keys, never the Supabase dashboard). Applied 2026-11-21.
insert into lesaruss_secrets (key, value) values ('INSTAGRAM_APP_ID','pending'), ('INSTAGRAM_APP_SECRET','pending') on conflict (key) do nothing;
insert into secret_rotation_plan (key, provider, tier, dashboard_url, label, requested_at, request_note) values
('INSTAGRAM_APP_ID','Meta','manual','https://developers.facebook.com/apps/','Instagram app ID (Vegans Explore comment-to-DM)', now(), 'See docs/plans/2026-11-21-ig-comment-dm-setup.md'),
('INSTAGRAM_APP_SECRET','Meta','manual','https://developers.facebook.com/apps/','Instagram app secret (Vegans Explore comment-to-DM)', now(), 'See docs/plans/2026-11-21-ig-comment-dm-setup.md')
on conflict (key) do nothing;
