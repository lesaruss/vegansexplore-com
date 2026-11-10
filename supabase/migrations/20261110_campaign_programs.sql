-- Campaigns as programs (Sean, 2026-11-10): "I would like to see the campaigns organized a little bit cleaner and be grouped by the actual
-- campaign. So this campaign is the launch campaign. And it's gonna run for 2 weeks... when you click into that campaign, it shows the
-- different groups, it shows the different messages, the trail of messages from the initial email to the landing page... to the
-- confirmation page if they register... to the follow-up email... I should be able to track it almost in the same way that we have the
-- lookbook... if one of the steps is it goes to the page, I would want to be able to see what the page looks like... when we do launch
-- another campaign... it needs to follow suit... and then we should see like a schedule."
-- A program is the campaign; its groups are the existing ve_outreach_campaigns (each still sends on its own approval, pace and rules);
-- its steps are the numbered trail (emails, pages, posts), each on a day of the program, shown as the lookbook and the schedule in HQ.

create table if not exists public.ve_campaign_programs (
  slug text primary key check (slug ~ '^[a-z0-9-]{1,60}$'),
  name text not null,
  goal text,
  start_on date not null,
  end_on date not null,
  status text not null default 'draft' check (status in ('draft','live','done')),
  note text,
  created_at timestamptz not null default now()
);
create table if not exists public.ve_campaign_program_steps (
  id uuid primary key default gen_random_uuid(),
  program_slug text not null references public.ve_campaign_programs(slug) on delete cascade,
  n int not null,
  day_offset int not null default 0,
  kind text not null check (kind in ('email','page','post','signup','confirmation')),
  channel text not null default 'email' check (channel in ('email','web','meetup','facebook','whatsapp','instagram')),
  title text not null,
  who text,
  outreach_campaign text,
  outreach_step int,
  url text,
  body text,
  status text not null default 'draft' check (status in ('draft','approved','live','not_written')),
  note text,
  unique (program_slug, n)
);
alter table public.ve_outreach_campaigns add column if not exists program_slug text references public.ve_campaign_programs(slug);
alter table public.ve_campaign_programs enable row level security;
alter table public.ve_campaign_program_steps enable row level security;

-- 1. Founding cohort 1 (sent Mon Nov 9), made a program from what already exists.
insert into public.ve_campaign_programs (slug, name, goal, start_on, end_on, status, note) values
 ('founding-cohort-1', 'Founding cohort 1', 'Our strongest supporters join early as Founding Members, walk the Welcome Guide and send feedback.', '2026-11-09', '2026-11-20', 'live', 'Approved by Sean 2026-11-08.')
on conflict (slug) do nothing;
update public.ve_outreach_campaigns set program_slug = 'founding-cohort-1' where slug in ('founding-cohort-1-2026-11','founding-cohort-1-wed-clicked','founding-cohort-1-wed-opened','founding-cohort-1-wed-quiet');
insert into public.ve_campaign_program_steps (program_slug, n, day_offset, kind, channel, title, who, outreach_campaign, outreach_step, url, status) values
 ('founding-cohort-1', 1, 0, 'email', 'email', 'The invitation from Sean', 'Everyone in the cohort', 'founding-cohort-1-2026-11', 1, null, 'live'),
 ('founding-cohort-1', 2, 0, 'page', 'web', 'The Welcome Guide', 'Who clicks', null, null, '/passport?guide=welcome', 'live'),
 ('founding-cohort-1', 3, 0, 'signup', 'web', 'Founding Member sign-up (the Explorer survey)', 'Who joins', null, null, '/survey?s=explorer', 'live'),
 ('founding-cohort-1', 4, 1, 'confirmation', 'email', 'Welcome to the community', 'Who joins', 'welcome-community', 1, null, 'live'),
 ('founding-cohort-1', 5, 2, 'email', 'email', 'Holiday Guide follow-up: clicked', 'Clicked the invitation', 'founding-cohort-1-wed-clicked', 1, null, 'draft'),
 ('founding-cohort-1', 6, 2, 'email', 'email', 'Holiday Guide follow-up: opened, no click', 'Opened, did not click', 'founding-cohort-1-wed-opened', 1, null, 'draft'),
 ('founding-cohort-1', 7, 2, 'email', 'email', 'Holiday Guide follow-up: no open yet', 'Did not open', 'founding-cohort-1-wed-quiet', 1, null, 'draft'),
 ('founding-cohort-1', 8, 2, 'page', 'web', 'The Holiday Guide', 'Who clicks a follow-up', null, null, '/guides/holiday-guide', 'live')
on conflict (program_slug, n) do nothing;

-- 2. The Holiday Guide launch (two weeks from Tue Nov 10). Its groups are made when Sean approves the words (wave 1 today).
insert into public.ve_campaign_programs (slug, name, goal, start_on, end_on, status, note) values
 ('holiday-launch-2026', 'Holiday Guide launch', 'Everyone we know hears Vegans Explore is back, launching January 1: join free as a Founding Member, take the Welcome tour, open the free Holiday Guide. Then we follow up with what they act on.', '2026-11-10', '2026-11-24', 'draft', 'Plan: docs/proposals/2026-11-10-holiday-launch-blast.md. Buckets: members, business, nonprofit, creator, foodie-fest, explore; posts to Meetup (3), the Facebook group and WhatsApp.')
on conflict (slug) do nothing;
insert into public.ve_campaign_program_steps (program_slug, n, day_offset, kind, channel, title, who, url, body, status) values
 ('holiday-launch-2026', 1, 0, 'email', 'email', 'We''re back: the email from Sean', 'Every group, one line changes by group', null,
  E'Subject: We''re back, and I''d love you to be a Founding Member\n\nHi {first_name},\n\nVegans Explore is back. We launch on January 1, and I''d love for you to be one of our Founding Members. It''s free.\n\n{group line}\n\nAs a thank-you, we made a free Holiday Guide for the season. I recorded a short note to tell you about it.\n\n[ Hear it and open the Holiday Guide ]\n\nSean', 'approved'),
 ('holiday-launch-2026', 2, 0, 'post', 'meetup', 'Meetup message (Miami, Broward, Palm Beach)', 'Our three Meetup groups', null, null, 'draft'),
 ('holiday-launch-2026', 3, 0, 'post', 'facebook', 'Facebook group post (pinned for the week)', 'Our Facebook group', null, null, 'draft'),
 ('holiday-launch-2026', 4, 0, 'post', 'whatsapp', 'WhatsApp announcement', 'Our WhatsApp group', null, null, 'draft'),
 ('holiday-launch-2026', 5, 0, 'page', 'web', 'Sean''s landing page with his voice note', 'Everyone who clicks', '/hello', null, 'draft'),
 ('holiday-launch-2026', 6, 0, 'signup', 'web', 'Founding Member sign-up (the Explorer survey)', 'Who joins', '/survey?s=explorer', null, 'live'),
 ('holiday-launch-2026', 7, 0, 'page', 'web', 'The Welcome Guide', 'Who takes the tour', '/passport?guide=welcome', null, 'live'),
 ('holiday-launch-2026', 8, 0, 'page', 'web', 'The free Holiday Guide', 'Everyone who clicks', '/guides/holiday-guide', null, 'live'),
 ('holiday-launch-2026', 9, 1, 'confirmation', 'email', 'Welcome to the community', 'Who joins', null, null, 'live'),
 ('holiday-launch-2026', 10, 4, 'email', 'email', 'Follow-up: what they did (clicked, opened, quiet)', 'By what each person did', null, null, 'not_written'),
 ('holiday-launch-2026', 11, 9, 'email', 'email', 'Last call before ThanksLiving', 'Who has not joined yet', null, null, 'not_written')
on conflict (program_slug, n) do nothing;
update public.ve_campaign_program_steps set outreach_campaign = 'welcome-community', outreach_step = 1 where program_slug = 'holiday-launch-2026' and n = 9;
