-- 2026-11-21: An's second Spotlight email, sending her to her featured page (locked by Sean 2026-11-21: "Lock it.") and correcting the post time
-- (Friday's email said Monday; the page and the schedule say Tuesday, November 24 at 12 PM Eastern). DRAFT until Sean approves. Sends Monday
-- Nov 23 from 9 AM Eastern (weekday sending hours). {link} becomes her personal tracked link to /featured/sen-saigon-e509ca. Safe to run twice.
insert into ve_outreach_campaigns (slug, name, note, status, audience, start_on, link_path, email_count, daily_pace, program_slug, sender_brand, footer_reason, cities, categories, vegan_only)
select 'spotlight-an-sen-saigon-page', 'Spotlight: An, Sen Saigon (Ep 147), her page',
  'Second email to An: her featured page (locked by Sean 2026-11-21), and the post time corrected to Tue Nov 24, 12 PM Eastern (Friday''s email said Monday). DRAFT until Sean approves; sends Mon Nov 23 from 9 AM Eastern.',
  'draft', 'people', '2026-11-23', 'https://vegansexplore.com/featured/sen-saigon-e509ca', 1, 5, 'podcast-spotlight', 'vegans-explore', 'you were a guest on the Vegans Explore Podcast', '{}', '{}', false
where not exists (select 1 from ve_outreach_campaigns where slug = 'spotlight-an-sen-saigon-page');

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset)
select 'spotlight-an-sen-saigon-page', 1, 'Sen Saigon on the podcast: your page and one quick question',
$b$Hi An,

Your Spotlight is out: Episode 147 of the Vegans Explore Podcast came out on Sunday. Your reel goes up tomorrow, Tuesday, November 24 at 12 PM Eastern (a day later than I first wrote).

We made a page just for you. It shows the post exactly as it will look, with the caption, plus your whole segment from the episode and your Sen Saigon listing:
{link}

There's one question on it: would you like the reel on your Instagram too? Either answer is fine, and it takes a few seconds.

Thank you again for sharing your story.

Sean A. Russell
Vegans Explore$b$, 0
where not exists (select 1 from ve_outreach_campaign_emails where campaign_slug = 'spotlight-an-sen-saigon-page' and step = 1);

insert into ve_outreach_campaign_members (campaign_slug, listing_id, person_key, person_name, step, send_status)
select 'spotlight-an-sen-saigon-page', null, 'sensaigon.nyc@gmail.com', 'An', 0, 'waiting'
where not exists (select 1 from ve_outreach_campaign_members where campaign_slug = 'spotlight-an-sen-saigon-page');
