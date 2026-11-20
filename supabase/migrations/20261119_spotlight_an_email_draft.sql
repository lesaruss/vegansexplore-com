-- 2026-11-19: Podcast Spotlight outreach program and An's (Sen Saigon) collaboration email, DRAFT until Sean says send.
-- Sean: "send Anne an email that asks if she would like to collaborate on this post. And if there's anything that she would like to see
-- adjusted, we're more than happy to work with... that can be the format moving forward." Reel v4 locked by Sean ("lock it"). Safe to run twice.
insert into ve_campaign_programs (slug, name, goal, note, status, start_on, end_on, sort)
select 'podcast-spotlight', 'Podcast Spotlight', 'Everyone featured in a podcast Spotlight hears about it before it goes live, with the reel, a collaboration invite and room to ask for changes.',
  'Sean, 2026-11-19 standing rule: "Anytime we want to do these features, we reach out to them ahead of time to confirm the collaboration." First: An of Sen Saigon (Ep 147).',
  'live', '2026-11-19', '2027-12-31', 0
where not exists (select 1 from ve_campaign_programs where slug = 'podcast-spotlight');

insert into ve_outreach_campaigns (slug, name, note, status, audience, start_on, link_path, email_count, daily_pace, program_slug, sender_brand, footer_reason, cities, categories, vegan_only)
select 'spotlight-an-sen-saigon', 'Spotlight: An, Sen Saigon (Ep 147)',
  'One-to-one from Sean to An of Sen Saigon: her clip opens Today''s Spotlight on Vegans Explore Podcast Ep 147 (Sun Nov 22); the reel posts Mon Nov 23; asks if she would like to collaborate on the post and invites any changes. Link: the locked reel v4. Held as draft until Sean says send; goes out by Fri Nov 20.',
  'draft', 'people', '2026-11-20',
  'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/podcast/spotlight/an-sen-saigon/reel-v4.mp4',
  1, 5, 'podcast-spotlight', 'vegans-explore', 'you were a guest on the Vegans Explore Podcast', '{}', '{}', false
where not exists (select 1 from ve_outreach_campaigns where slug = 'spotlight-an-sen-saigon');

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset)
select 'spotlight-an-sen-saigon', 1, 'Your story opens our new Spotlight this Sunday',
$b$Hi An,

Thank you again for having us at Sen Saigon. This Sunday, your story opens a new segment on the Vegans Explore Podcast called Today's Spotlight. Episode 147 plays the moment where you share why you opened Sen Saigon, after you couldn't find Vegan Vietnamese food in New York City.

We also made a short video from it to share on Instagram and Facebook on Monday. You can watch it here: {link}

Would you like to collaborate with us on the post? If you say yes, we'll send a collaboration invite from @vegansexplore, so it shows on both of our pages.

And if there's anything you'd like adjusted, a different moment, a caption, anything at all, just reply and let us know. We're happy to work with you on it.

Thank you for everything you're bringing to New York.

Sean A. Russell
Vegans Explore$b$, 0
where not exists (select 1 from ve_outreach_campaign_emails where campaign_slug = 'spotlight-an-sen-saigon' and step = 1);

insert into ve_outreach_campaign_members (campaign_slug, listing_id, person_key, person_name, step, send_status)
select 'spotlight-an-sen-saigon', (select id from listings where slug = 'sen-saigon' and status = 'approved' limit 1), 'sensaigon.nyc@gmail.com', 'An', 0, 'waiting'
where not exists (select 1 from ve_outreach_campaign_members where campaign_slug = 'spotlight-an-sen-saigon');

-- Sean said "send" 2026-11-19. People campaigns send only when the member has no listing (ve_outreach_campaign_due), so the listing link is cleared;
-- the email is locked and the campaign approved. Goes out Fri Nov 20 from 9 AM Eastern (weekday sending hours, start_on).
update ve_outreach_campaign_members set listing_id = null where campaign_slug='spotlight-an-sen-saigon' and listing_id is not null;
update ve_outreach_campaign_emails set locked_at = now(), locked_by = '72712a4a-ea0e-4ef4-a29e-d382496ef8da' where campaign_slug='spotlight-an-sen-saigon' and step=1 and locked_at is null;
update ve_outreach_campaigns set status='active', approved_at=now(), approved_by='72712a4a-ea0e-4ef4-a29e-d382496ef8da',
  note = note || ' Sean said "send" 2026-11-19; goes out Fri Nov 20 morning (start_on).'
where slug='spotlight-an-sen-saigon' and approved_at is null;
