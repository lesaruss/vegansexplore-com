-- Stage 6 of the locked claims system: Sean's Day 2 note (playbook ve-claims-onboarding). Sean, 2026-11-13, on the draft from
-- /mocks/claims slide 6: "Just make this sure the spacing is correct on it. And also maybe for next level, we mentioned... that they
-- were featured in our Vegans Explore podcast on Sunday." (Episode 146 airs Sun Nov 15, 7 AM Eastern; Liz features Next Level Veggie
-- Grill.) People campaign claims-day2-sean in program claims-approved-2026-11, from Sean (email-send, replies to contact@lesaruss.com),
-- each with its own tracked link to /dashboard/business. Held as stopped until a one-time cron releases it Monday Nov 16 at 9:55 AM
-- Eastern, so the 10:00 AM send run takes it.
insert into ve_outreach_campaigns (slug, name, note, status, audience, start_on, link_path, daily_pace, approved_at, approved_by, email_count, program_slug, sender_brand, footer_reason, cities, categories, vegan_only)
values ('claims-day2-sean', 'Day 2 note from Sean', 'Stage 6: a short personal note from Sean the second business day after Liz''s approval email.', 'active', 'people',
  '2026-11-16', '/dashboard/business', 10, now(), '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 1, 'claims-approved-2026-11', 'vegans-explore',
  'you claimed your page on Vegans Explore', '{}', '{}', false)
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, day_offset, subject, body, locked_at, locked_by)
values ('claims-day2-sean', 1, 0, 'Help me build this', $b$Hi {first_name},

I'm building a platform that brings all of us together, so we can do the things we've always wanted to do. It comes from more than 10 years on the ground and conversations with hundreds of business owners, activists, creators and nonprofits.

We launch January 1. Until then, all I'm asking is this: tell me how to make it better. What would make it something you'd want to come back to every day? Just reply. It comes straight to me.

If thousands of us do that, by launch we'll have a platform everyone wants to be part of, because the network is already built. I hope you see it too.

Your post is in your dashboard when you're ready to share it:
{link}

Sean
Sean A. Russell
Founder, Vegans Explore$b$, now(), '72712a4a-ea0e-4ef4-a29e-d382496ef8da')
on conflict do nothing;

insert into ve_campaign_program_steps (program_slug, n, kind, channel, title, who, note, status, day_offset, outreach_campaign, outreach_step)
select 'claims-approved-2026-11', 2, 'email', 'email', 'Day 2: a note from Sean', 'Every business whose claim is approved, the second business day after Liz''s email',
  'Sean approved 2026-11-13 with his edits (spacing; Next Level Veggie Grill hears about Episode 146).', 'approved', 3, 'claims-day2-sean', 1
where not exists (select 1 from ve_campaign_program_steps where program_slug = 'claims-approved-2026-11' and n = 2);

insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status, stop_reason, personal_emails, personal_at)
select 'claims-day2-sean', v.email, v.name, 0, 'stopped', 'scheduled: Monday Nov 16, 10 AM Eastern', jsonb_build_object('1', jsonb_build_object('subject', 'Help me build this', 'body', v.body)), now()
from (values
 ('chaska@chaskaatl.com', 'Rajendra Jain', $b$Hi Rajendra,

I'm building a platform that brings all of us together, so we can do the things we've always wanted to do. It comes from more than 10 years on the ground and conversations with hundreds of business owners, activists, creators and nonprofits.

We launch January 1. Until then, all I'm asking is this: tell me how to make it better. What would make it something you'd want to come back to every day? Just reply. It comes straight to me.

If thousands of us do that, by launch we'll have a platform everyone wants to be part of, because the network is already built. I hope you see it too.

Your post is in your dashboard when you're ready to share it:
{link}

Sean
Sean A. Russell
Founder, Vegans Explore$b$),
 ('marketing@nextlevelvg.com', 'Next Level Veggie Grill', $b$Hi Next Level Veggie Grill team,

I'm building a platform that brings all of us together, so we can do the things we've always wanted to do. It comes from more than 10 years on the ground and conversations with hundreds of business owners, activists, creators and nonprofits.

We launch January 1. Until then, all I'm asking is this: tell me how to make it better. What would make it something you'd want to come back to every day? Just reply. It comes straight to me.

If thousands of us do that, by launch we'll have a platform everyone wants to be part of, because the network is already built. I hope you see it too.

You were also featured on Sunday's Vegans Explore Podcast, Episode 146.

Your posts are in your dashboard when you're ready to share them:
{link}

Sean
Sean A. Russell
Founder, Vegans Explore$b$)) v(email, name, body)
where not exists (select 1 from ve_outreach_campaign_members m where m.campaign_slug = 'claims-day2-sean' and m.person_key = v.email and m.removed_at is null);

-- Release Monday Nov 16 at 9:55 AM Eastern (14:55 UTC), then the job removes itself.
select cron.schedule('ve-claims-day2-release', '55 14 16 11 *', $c$
  update public.ve_outreach_campaign_members set send_status = 'waiting', stop_reason = null
  where campaign_slug = 'claims-day2-sean' and send_status = 'stopped' and stop_reason = 'scheduled: Monday Nov 16, 10 AM Eastern' and removed_at is null;
  select cron.unschedule('ve-claims-day2-release');
$c$);
