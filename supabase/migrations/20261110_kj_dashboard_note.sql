-- KJ's "your creator dashboard is ready" note (Sean, 2026-11-10: "approved, set it up in BrandDesk"). One person, from Sean, a BrandDesk
-- people campaign like her welcome. Starts 2026-11-11 (one outreach email per address a day; her welcome goes out 2026-11-10). {link} is her
-- own tracked /go/ link, made by ve-outreach at the send, to /dashboard/creator. Approved by Sean; editable in HQ until it sends.
insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace,
  sender_brand, link_path, footer_reason, approved_at, approved_by)
values ('creator-dashboard-keya', 'Creator dashboard ready: KJ (VeganKween)', null, '{}', false,
  'One-to-one from Sean. Tells KJ her creator dashboard is live (/dashboard/creator, switched on 2026-11-10): reel with thumbnail and captions, story, carousel, avatar, her link and who joined, Feedback with voice messages. Sean approved the words 2026-11-10.',
  'active', '2026-11-11', '{}', 'people', 1, 5, 'lesaruss', '/dashboard/creator', 'you are an official Vegans Explore content creator',
  now(), '72712a4a-ea0e-4ef4-a29e-d382496ef8da')
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset, locked_at, locked_by)
values ('creator-dashboard-keya', 1, 'Your creator dashboard is ready, KJ', 'Hi KJ,

Your creator dashboard is live. Sign in at vegansexplore.com and open your dashboard. It''s the first thing you''ll see: {link}

Here''s what''s waiting for you:

- Your reel: Kai introduces you over Philly. It comes with a thumbnail and a few captions written in your voice, if you want them.
- Your story and a 10-slide carousel, ready to post. You can download the slides one at a time or all at once.
- Your avatar, to use on your socials too.
- Your link, vegansexplore.com/go/keya. Your dashboard shows every click and everyone who joins through it, and each friend who joins earns you 111 points.

Use any of it whenever and however you like. You post from your own account. If you add @vegansexplore as a collaborator, we''ll accept so it shows on both pages.

If anything looks off or you''d like something changed, tap Feedback in the top right of your dashboard. You can type it or leave a voice message.

I''m glad you''re here.

Sean', 0, now(), '72712a4a-ea0e-4ef4-a29e-d382496ef8da')
on conflict (campaign_slug, step) do nothing;

-- 9:05 AM Eastern on 2026-11-11 (EST, UTC-5).
insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status, next_send_at)
select 'creator-dashboard-keya', 'kyonakey@yahoo.com', 'KJ', '19f67b83-9368-40d5-af00-87084b0f3fae', 0, 'in_sequence', '2026-11-11 14:05:00+00'
where not exists (select 1 from ve_outreach_campaign_members m where m.campaign_slug = 'creator-dashboard-keya' and m.person_key = 'kyonakey@yahoo.com' and m.removed_at is null);
