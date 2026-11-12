-- Welcome versions by path (Sean, 2026-11-10: "you could start with welcome versions of each one of those as well"). Drafts with the stopped
-- sample person; nothing sends until Sean approves each in HQ. From Sean, same core as welcome-community (free, value first, share your link),
-- with what that kind of member should do first. Routing (who gets which instead of the general one) is built once they are approved.
-- Also: invitations carry Sean's picture with a play button for his voice note, not a video (Sean, 2026-11-10), noted on the master copy.
update ve_outreach_campaigns set note = note || ' Invitation page (Sean, 2026-11-10, locked): Sean''s picture as a still with a play button for his voice note under it, not a video.'
where slug = 'creator-invitation' and note not like '%locked): Sean''s picture%';

insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace, sender_brand, link_path, footer_reason)
values
 ('welcome-creator', 'Welcome: creators', null, '{}', false, 'From Sean to a new creator (creator application or creator survey). Draft for Sean.', 'draft', null, '{}', 'people', 1, 160, 'lesaruss', '/guides/creator-guide?from=welcome', 'you joined Vegans Explore as a creator'),
 ('welcome-restaurant', 'Welcome: restaurants', null, '{}', false, 'From Sean to a new restaurant owner (restaurant survey). Draft for Sean.', 'draft', null, '{}', 'people', 1, 160, 'lesaruss', '/guides/vegan-restaurant-guide?from=welcome', 'you joined Vegans Explore as a restaurant'),
 ('welcome-business', 'Welcome: businesses', null, '{}', false, 'From Sean to a new business owner (business survey). Draft for Sean.', 'draft', null, '{}', 'people', 1, 160, 'lesaruss', '/guides/pre-vegan-business-guide?from=welcome', 'you joined Vegans Explore as a business'),
 ('welcome-nonprofit', 'Welcome: nonprofits', null, '{}', false, 'From Sean to a new nonprofit, rescue or sanctuary (nonprofit survey). Draft for Sean.', 'draft', null, '{}', 'people', 1, 160, 'lesaruss', '/guides/nonprofit-guide?from=welcome', 'you joined Vegans Explore for your organization'),
 ('welcome-events', 'Welcome: event hosts', null, '{}', false, 'From Sean to a new event host (events survey). Draft for Sean.', 'draft', null, '{}', 'people', 1, 160, 'lesaruss', '/guides/vegan-events-guide?from=welcome', 'you joined Vegans Explore as an event host'),
 ('welcome-group-leader', 'Welcome: group leaders', null, '{}', false, 'From Sean to a group organizer. The Group leader path is Coming, so this one says so. Draft for Sean.', 'draft', null, '{}', 'people', 1, 160, 'lesaruss', '/paths?from=welcome', 'you joined Vegans Explore as a group leader')
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset) values
('welcome-creator', 1, 'Welcome to Vegans Explore, {first_name}', 'Hi {first_name},

Welcome to Vegans Explore, and welcome to the creator side of it. Your membership is free.

Here''s what we''re building. Between now and January 1, we''re bringing every Vegan business, organization and person we can find onto the platform. Come January 1, we hit the ground running, city by city, with partners, sponsors and campaigns. Our goal right now is to give the community as much value as we can, so word spreads and bigger opportunities open up for all of us.

That''s where creators come in. When a campaign needs someone to shoot content at a local Vegan spot, I want to be able to call on you, or on the creators you know in your city. Three things to do this week:

1. Open the Creator Guide and make your profile in the Directory yours: your photo, what you make and where you post: {link}

2. Share your link with as many people as you can. Press Share on any page while you''re signed in, and you get 111 points for every friend who joins.

3. Tell me who''s missing in your city, and which creators near you should be part of this. Just reply to this email.

Graphics and short videos you can share as an official creator are coming soon.

Thank you for being here early,
Sean', 0),
('welcome-restaurant', 1, 'Welcome to Vegans Explore, {first_name}', 'Hi {first_name},

Welcome to Vegans Explore. Your membership is free, and so is claiming your restaurant''s page.

Here''s what we''re building. Between now and January 1, we''re bringing every Vegan business, organization and person we can find onto the platform. Come January 1, we hit the ground running, city by city, with partners, sponsors and campaigns that send people to places like yours. Right now our goal is to give as much value as we can, so the community knows where to eat and keeps coming back.

Three things to do this week:

1. Open the Vegan Restaurant Guide and claim your page: your photos, your menu and your hours, so people find the real you: {link}

2. Ask your regulars to vote for you. Votes are how a place rises in your city''s Directory, once a day each.

3. Share your link with as many people as you can. Press Share on any page while you''re signed in, and you get 111 points for every friend who joins.

If something on your page is wrong, just reply to this email and we''ll fix it.

Thank you for being here early,
Sean', 0),
('welcome-business', 1, 'Welcome to Vegans Explore, {first_name}', 'Hi {first_name},

Welcome to Vegans Explore. Your membership is free, and so is claiming your business''s page.

Here''s what we''re building. Between now and January 1, we''re bringing every Vegan business, organization and person we can find onto the platform. Come January 1, we hit the ground running, city by city, with partners, sponsors and campaigns that put customers in front of businesses like yours. Right now our goal is to give as much value as we can, early.

Three things to do this week:

1. Open your Guide and claim your page, so people find what you offer, including your plant-based (Pre-Vegan) options if you are not fully Vegan yet: {link}

2. Share your link with as many people as you can. Press Share on any page while you''re signed in, and you get 111 points for every friend who joins.

3. Tell me which Vegan businesses you work with or buy from, so we can bring them in too. Just reply to this email.

Thank you for being here early,
Sean', 0),
('welcome-nonprofit', 1, 'Welcome to Vegans Explore, {first_name}', 'Hi {first_name},

Welcome to Vegans Explore. Your membership is free, and so is your organization''s page.

Here''s what we''re building. Between now and January 1, we''re bringing every Vegan business, organization and person we can find onto the platform. Come January 1, we hit the ground running, city by city, and the organizations doing the work are at the heart of it. Right now our goal is to give the community as much value as we can, so people find you when they are ready to help.

Three things to do this week:

1. Open the Nonprofit Guide and make your organization''s page yours: who you help, how to volunteer and how to give: {link}

2. Put your next event on our calendar, so people in your city see it.

3. Share your link with as many people as you can. Press Share on any page while you''re signed in, and you get 111 points for every friend who joins.

If there are other rescues, sanctuaries or organizations we should bring in, just reply to this email.

Thank you for the work you do,
Sean', 0),
('welcome-events', 1, 'Welcome to Vegans Explore, {first_name}', 'Hi {first_name},

Welcome to Vegans Explore. Your membership is free.

Here''s what we''re building. Between now and January 1, we''re bringing every Vegan business, organization and person we can find onto the platform. Come January 1, we hit the ground running, city by city, and events are how a community actually meets. Right now our goal is to give as much value as we can, so people find your events and keep showing up.

Three things to do this week:

1. Open the Vegan Events Guide and put your next event on the calendar: {link}

2. Share your link with as many people as you can. Press Share on any page while you''re signed in, and you get 111 points for every friend who joins.

3. Tell me which vendors, venues and creators you work with, so we can bring them in too. Just reply to this email.

Thank you for bringing people together,
Sean', 0),
('welcome-group-leader', 1, 'Welcome to Vegans Explore, {first_name}', 'Hi {first_name},

Welcome to Vegans Explore. Your membership is free.

Here''s what we''re building. Between now and January 1, we''re bringing every Vegan business, organization and person we can find onto the platform. Come January 1, we hit the ground running, city by city, and the groups that already bring people together are a big part of that. A path made just for group leaders is coming soon, and you''ll be among the first to hear.

Until then, three things to do this week:

1. Make sure your group is in your city''s Directory, and tell me if anything about it is wrong. Just reply to this email.

2. Share your link with your members and as many people as you can. Press Share on any page while you''re signed in, and you get 111 points for every friend who joins.

3. See the paths we have today, in case one fits you too: {link}

Thank you for bringing people together,
Sean', 0)
on conflict (campaign_slug, step) do nothing;

insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, step, send_status, stop_reason)
select s, 'contact@lesaruss.com', 'Sample Member', 0, 'stopped', 'Sample for previews and tests; never sends'
from unnest(array['welcome-creator','welcome-restaurant','welcome-business','welcome-nonprofit','welcome-events','welcome-group-leader']) s
where not exists (select 1 from ve_outreach_campaign_members m where m.campaign_slug = s and m.person_key = 'contact@lesaruss.com');

-- HQ lists only campaigns with a start day (readDoorCampaigns), so the drafts get today's; a draft never sends before approval. Keya's
-- retired invitation draft is finished, so it leaves the list. Applied 2026-11-10.
update ve_outreach_campaigns set start_on = '2026-11-10'
where slug in ('creator-invitation','welcome-creator','welcome-restaurant','welcome-business','welcome-nonprofit','welcome-events','welcome-group-leader') and start_on is null and approved_at is null;
update ve_outreach_campaigns set status = 'finished' where slug = 'creator-welcome-keya' and approved_at is null;
