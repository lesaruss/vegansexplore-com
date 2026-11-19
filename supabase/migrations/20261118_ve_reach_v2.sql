-- Directory Reach console v2: the panel's improved plan (docs/plans/2026-11-18-directory-reach-panel.md; Sean: "let's do this") and the
-- locked goal (Sean: "250, lock it in"). Openers gain a kind (outreach with no link, the page follow-up with the link, the follower
-- welcome); inbound people (new followers and anyone who writes) get their own list ahead of outreach. All words stay draft until Sean
-- locks them. Safe to run twice.

alter table ve_reach_messages add column if not exists kind text not null default 'outreach';
alter table ve_reach_messages drop constraint if exists ve_reach_messages_kind_check;
alter table ve_reach_messages add constraint ve_reach_messages_kind_check check (kind in ('outreach', 'page', 'welcome'));
alter table ve_reach_messages drop constraint if exists ve_reach_messages_grp_check;
alter table ve_reach_messages add constraint ve_reach_messages_grp_check check (grp in ('restaurants', 'businesses', 'nonprofits', 'creators', 'all'));
alter table ve_reach_messages drop constraint if exists ve_reach_messages_grp_lane_version_key;
create unique index if not exists ve_reach_messages_key on ve_reach_messages (grp, lane, kind, version);

-- v1 openers carried the link in the first message; the panel: the first cold DM carries no link.
update ve_reach_messages set status = 'retired' where lane = 'dm' and kind = 'outreach' and version = 1 and status = 'draft';
insert into ve_reach_messages (grp, lane, kind, version, body) values
 ('restaurants', 'dm', 'outreach', 2, 'Hi! I''m KJ with Vegans Explore. [One thing you noticed on their feed.] {name} is already in our Vegan Directory. Want me to send you the page?'),
 ('businesses', 'dm', 'outreach', 2, 'Hi! I''m KJ with Vegans Explore. [One thing you noticed on their feed.] {name} is already in our Vegan Directory. Want me to send you the page?'),
 ('nonprofits', 'dm', 'outreach', 2, 'Hi! I''m KJ with Vegans Explore. [One thing you noticed on their feed.] {name} is already listed with us, free, so our community can find and support you. Want me to send you the listing?'),
 ('creators', 'dm', 'outreach', 2, 'Hi! I''m KJ with Vegans Explore. [One thing you noticed on their feed.] We''d love to feature {name} in our Vegan Directory. Want me to send you the page?'),
 ('all', 'dm', 'page', 1, 'Here it is: {link} It''s free. Claiming it takes a short free survey to join, and Liz, our Guide, walks you through the rest.'),
 ('all', 'dm', 'welcome', 1, 'Thanks for the follow! Are you here as a Vegan explorer, or do you run a business, group or page?')
on conflict (grp, lane, kind, version) do nothing;

alter table ve_reach_log drop constraint if exists ve_reach_log_kind_check;
alter table ve_reach_log add constraint ve_reach_log_kind_check check (kind in ('follow', 'followed_back', 'dm', 'replied', 'cant_reach', 'note', 'checkin', 'pin', 'unpin', 'tagged', 'page_sent'));

create table if not exists ve_reach_inbound (
  id uuid primary key default gen_random_uuid(),
  handle text not null,
  grp text not null check (grp in ('explorer', 'restaurants', 'businesses', 'nonprofits', 'creators')),
  listing_id uuid references listings(id) on delete set null,
  kind text not null default 'follower' check (kind in ('follower', 'message', 'comment')),
  status text not null default 'open' check (status in ('open', 'welcomed', 'done')),
  note text,
  added_by uuid,
  welcomed_by uuid, welcomed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists ve_reach_inbound_open on ve_reach_inbound (status, created_at);
alter table ve_reach_inbound enable row level security;
