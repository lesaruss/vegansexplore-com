-- ve-outreach-buckets: founding cohort email. The Wednesday Nov 11 Holiday Guide follow-ups to cohort 1, split by how each person engaged
-- (clicked, opened only, nothing). Drafts with no people: people are added Wednesday morning from founding-cohort-1-2026-11's opens and
-- clicks, and nothing sends until Sean approves each in BrandDesk.
insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace, sender_brand, link_path, footer_reason)
values ('founding-cohort-1-wed-clicked', 'Founding cohort 1, Wednesday: clicked', null, '{}', false, 'The Wednesday Holiday Guide follow-up to founding cohort 1, for those who clicked their link. People are added Wednesday morning from cohort 1 by how they engaged. Draft. Playbook ve-outreach-buckets.',
 'draft', '2026-11-11', '{}', 'people', 1, 160, 'lesaruss', '/guides/holiday-guide?from=founding-cohort', 'we have been in touch over the years about the Vegan community')
on conflict (slug) do nothing;
insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset) values ('founding-cohort-1-wed-clicked', 1, 'ThanksLiving is coming, {first_name}', 'Hi {first_name},

Thank you for taking a look at Vegans Explore this week. It means a lot that you were one of the first.

With ThanksLiving two weeks out, we just opened the Holiday Guide. Theo walks you through it: recipes for the whole table, what to pick up at the store, holiday menus from Vegan places as they come in, and ways to give back to the sanctuaries and rescues that carry our community all year.

Take a look, and share it with anyone planning their table:
{link}

If you haven''t yet, the Founding Member survey takes about two minutes. And anything you notice, the Feedback button on every page comes straight to me.

Thank you,
Sean', 0) on conflict (campaign_slug, step) do nothing;
insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace, sender_brand, link_path, footer_reason)
values ('founding-cohort-1-wed-opened', 'Founding cohort 1, Wednesday: opened, no click', null, '{}', false, 'The Wednesday Holiday Guide follow-up to founding cohort 1, for those who opened but did not click. People are added Wednesday morning from cohort 1 by how they engaged. Draft. Playbook ve-outreach-buckets.',
 'draft', '2026-11-11', '{}', 'people', 1, 160, 'lesaruss', '/guides/holiday-guide?from=founding-cohort', 'we have been in touch over the years about the Vegan community')
on conflict (slug) do nothing;
insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset) values ('founding-cohort-1-wed-opened', 1, 'Something for your ThanksLiving table', 'Hi {first_name},

I wrote to you a few days ago about becoming one of our first Founding Members. Whether or not you''ve had time to look, I wanted to share something you can use right now.

The Holiday Guide is open: recipes for the whole table, what to pick up at the store, holiday menus from Vegan places as they come in, and ways to give back to sanctuaries and rescues this season. ThanksLiving is Thursday, November 26.

{link}

And the invitation stands: becoming a Founding Member is free, a two-minute survey, open until midnight Eastern on January 1, 2027.

Thank you,
Sean', 0) on conflict (campaign_slug, step) do nothing;
insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace, sender_brand, link_path, footer_reason)
values ('founding-cohort-1-wed-quiet', 'Founding cohort 1, Wednesday: no open yet', null, '{}', false, 'The Wednesday Holiday Guide follow-up to founding cohort 1, for those who have not opened yet. People are added Wednesday morning from cohort 1 by how they engaged. Draft. Playbook ve-outreach-buckets.',
 'draft', '2026-11-11', '{}', 'people', 1, 160, 'lesaruss', '/guides/holiday-guide?from=founding-cohort', 'we have been in touch over the years about the Vegan community')
on conflict (slug) do nothing;
insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset) values ('founding-cohort-1-wed-quiet', 1, 'Planning your ThanksLiving table?', 'Hi {first_name},

ThanksLiving is Thursday, November 26, and we just opened a free Holiday Guide for it: recipes for the whole table, what to pick up at the store, holiday menus from Vegan places as they come in, and ways to give back to sanctuaries and rescues.

Here it is:
{link}

You''ve been part of this community for a long time, so I''d also love for you to be one of our first Founding Members. It''s free, a two-minute survey, open until midnight Eastern on January 1, 2027, and the Welcome Guide on the site shows you around.

Thank you,
Sean', 0) on conflict (campaign_slug, step) do nothing;
