-- Two BrandDesk people campaigns, drafts until Sean approves them in HQ (Outreach > Campaigns). Sean, 2026-11-10:
-- "lock that in as the invitation and save that in the outreach somewhere where I can see it and update it" and "a follow-up email of
-- welcoming them to the community... a general one for now, and then we can make custom ones for the different types of people".
-- Each has the stopped sample person (contact@lesaruss.com) for previews and tests, as the orientation campaigns do; it never sends.
-- Enrollment for welcome-community (everyone the day they become a member, any door) is built once Sean approves the words.

-- 1. The creator invitation, the master copy (first used for Keya, VeganKween, 2026-11-10). Each creator gets their own invitation
--    (universe_invites, on us by Sean's call) and {link} is their invitation page. The voice note script lives in the note.
insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace, sender_brand, link_path, footer_reason)
values ('creator-invitation', 'Creator invitation (master copy)', null, '{}', false,
 'The invitation for an accepted content creator, from Sean. Copy it for each creator: their own invitation (membership on us, 250 points) and their own {link}. First used for Keya (VeganKween), 2026-11-10. Voice note (about 22 seconds, on the invitation page, Sean''s voice): "Hey {first_name}, it''s Sean. Congratulations, you''re officially a Vegans Explore content creator, and your membership is on us. Just press Accept, create your account with your email, and you''ll start with 250 points. Your first mission: look through our {city} page and tell me which groups, nonprofits or spots we''re missing. So glad to have you with us."',
 'draft', null, '{}', 'people', 1, 5, 'lesaruss', '/invite', 'you applied to be a Vegans Explore content creator')
on conflict (slug) do nothing;
insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset)
values ('creator-invitation', 1, 'You''re an official Vegans Explore content creator, {first_name}', 'Hi {first_name},

Congratulations! Your creator application is approved, and you''re now an official Vegans Explore content creator. Thank you for raising your hand for your city.

Your membership is on us, and it''s ready for you. To sign in the first time:

1. Open your invitation: {link}
2. Press Accept your membership.
3. Create your account with this email address and a password you choose. You''ll start with 250 points.

After that, sign in any time at vegansexplore.com with the same email and password.

Your first mission is your city. Open your city''s page (Communities, at the top of any page) and look through it like a local. Then tell me:
- Vegan groups or meetups we''re missing
- Nonprofits, rescues and sanctuaries that belong on there
- Restaurants, food spots or events that need adding or fixing

Just reply to this email with what you find. Once you confirm the page is right, we''ll go from there together.

So glad to have you with us,
Sean', 0)
on conflict (campaign_slug, step) do nothing;
insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status, stop_reason)
select 'creator-invitation', 'contact@lesaruss.com', 'Sample Member', 0, 'stopped', 'Sample for previews and tests; never sends'
where not exists (select 1 from ve_outreach_campaign_members where campaign_slug = 'creator-invitation' and person_key = 'contact@lesaruss.com');

-- 2. Welcome to the community, from Sean, the day someone becomes a member (general for now; one per kind of member later).
--    Written from Sean's voice message to Keya, 2026-11-10. The orientation notes from the team follow it.
insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace, sender_brand, link_path, footer_reason)
values ('welcome-community', 'Welcome to the community (everyone who joins)', null, '{}', false,
 'From Sean, the day someone becomes a member by any door (survey, invitation, claim). General for now; versions for creators, businesses, nonprofits, event hosts and group leaders come next. Written from Sean''s voice message to Keya, 2026-11-10. Enrollment is built once Sean approves the words.',
 'draft', null, '{}', 'people', 1, 160, 'lesaruss', '/paths?from=welcome', 'you joined Vegans Explore')
on conflict (slug) do nothing;
insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset)
values ('welcome-community', 1, 'Welcome to Vegans Explore, {first_name}', 'Hi {first_name},

Welcome to Vegans Explore. I''m really glad you''re here.

Here''s what we''re building. Between now and January 1, we''re bringing every Vegan business, organization and person we can find onto the platform. Come January 1, we hit the ground running, city by city: partners, sponsors and campaigns that put real support behind the Vegan community where you are.

To do that, we need people on the ground, and that''s you. Three things you can do this week:

1. Look at your city''s page (Communities, at the top of any page) and tell me who''s missing: groups, nonprofits, restaurants, creators, anyone who should be here. Just reply to this email.

2. Share Vegans Explore with your own link. Press Share on any page while you''re signed in, and you get 111 points for every friend who joins.

3. Find the path made for what you do, whether you run a business, host events, create content or lead an organization: {link}

You don''t have to stick to one city, either. If you know a Vegan business or organization anywhere, send it my way.

We''re laying the foundation right now, so thank you for being here early.

Sean', 0)
on conflict (campaign_slug, step) do nothing;
insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status, stop_reason)
select 'welcome-community', 'contact@lesaruss.com', 'Sample Member', 0, 'stopped', 'Sample for previews and tests; never sends'
where not exists (select 1 from ve_outreach_campaign_members where campaign_slug = 'welcome-community' and person_key = 'contact@lesaruss.com');

-- 3. Welcome v2 (Sean, 2026-11-10: share the link with as many people as they can; the welcome lets people sort themselves into the kind of
--    membership they want; say it is free; value first so they become lifelong fans; the engine behind the Vegan movement; good work rewarded
--    by word of mouth opens bigger opportunities). Applied 2026-11-10.
update ve_outreach_campaign_emails set body = 'Hi {first_name},

Welcome to Vegans Explore. I''m really glad you''re here, and I want to say it up front: your membership is free.

Here''s what we''re building. Between now and January 1, we''re bringing every Vegan business, organization and person we can find onto the platform. Come January 1, we hit the ground running, city by city: partners, sponsors and campaigns that put real support behind the Vegan community where you are.

Our goal in these early days is simple: give the community as much value as we can, so Vegans Explore becomes something you love for life. We want to be the engine behind the Vegan movement, and we earn that by doing good work for you. If we do it well, word spreads, more people use what we build, and that opens the door to bigger opportunities that can truly transform the community.

To get there, we need people on the ground, and that''s you. Three things you can do this week:

1. Pick the path made for you. Whether you run a business, host events, create content, lead an organization or just love exploring, each path has its own free Guide, opened with a short survey, so you get what fits you: {link}

2. Share your link with as many people as you can. Press Share on any page while you''re signed in, and you get 111 points for every friend who joins.

3. Look at your city''s page (Communities, at the top of any page) and tell me who''s missing: groups, nonprofits, restaurants, creators, anyone who should be here. Just reply to this email.

You don''t have to stick to one city, either. If you know a Vegan business or organization anywhere, send it my way.

Thank you for being here early.

Sean'
where campaign_slug = 'welcome-community' and step = 1;
