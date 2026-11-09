-- ve-feedback: second reply to Brion Hurley, after his 2026-11-08 5:23 PM Eastern email to contact@vegansexplore.com (Einstein Bros is
-- after security in Terminal 3, Concourse E; reports blocked from home; a Thai place with Vegan options; My Saves empty). Handled the same
-- day: Einstein Bros added to FLL with 50 points to him, My Saves shows communities (main a02ab07), Suggest a place on the Directory
-- (main 14f96fe, /directory?suggest=1). A draft until Sean approves it in BrandDesk; its link is his own tracked /go/ link to Suggest a place.
insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace,
  sender_brand, link_path, footer_reason)
values ('reply-brion-hurley-2026-11-b', 'Reply 2: Brion Hurley (Einstein Bros added, My Saves, Suggest a place)', null, '{}', false,
  'One-to-one reply from Sean to his feedback email. Playbook ve-feedback. Draft until Sean approves.',
  'draft', '2026-11-08', '{}', 'people', 1, 5, 'lesaruss', '/directory?suggest=1', 'you wrote to us about Vegans Explore')
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset)
values ('reply-brion-hurley-2026-11-b', 1, 'Einstein Bros is in the Guide, {first_name}', 'Hi {first_name},

Thank you for all of this. It''s exactly the kind of feedback we need right now.

Einstein Bros is in the Airport Guide: Terminal 3, Concourse E, after security, with the plain bagel and avocado. We credited you 50 points for it.

You''re right that the report form wanted you at the airport. That makes sense for confirming something is still there, but not for telling us about a place after your trip. That''s fixed now: when you add something missing or leave a comment, pick "I am not there now." The team checks it like any report, and it earns half the points.

My Saves: your save on South Florida did work. My Saves only showed places and podcast episodes, so it looked empty. It has a Communities section now.

And yes, please send us the Thai place. A spot with Vegan options belongs in the Directory, and members'' votes are what move it up. We just added a short form for exactly this. The name and city are enough, and a website or Instagram helps if it has one: {link}

Thanks again for being one of our first Founding Members.

Sean', 0)
on conflict (campaign_slug, step) do nothing;

insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status)
select 'reply-brion-hurley-2026-11-b', 'brionhurley@gmail.com', 'Brion Hurley', null, 0, 'waiting'
where not exists (select 1 from ve_outreach_campaign_members where campaign_slug = 'reply-brion-hurley-2026-11-b' and person_key = 'brionhurley@gmail.com' and removed_at is null);

-- 2026-11-09: the off-site paragraph now says it is live (report from anywhere, 20261109_venue_reports_off_site.sql), not a promise.
update ve_outreach_campaign_emails set body = replace(body,
  'You''re right that the report form wants you at the airport. That makes sense for confirming something is still there, but not for telling us about a place after the fact, from home. We''re changing that so members can send new places from wherever they are.',
  'You''re right that the report form wanted you at the airport. That makes sense for confirming something is still there, but not for telling us about a place after your trip. That''s fixed now: when you add something missing or leave a comment, pick "I am not there now." The team checks it like any report, and it earns half the points.')
where campaign_slug = 'reply-brion-hurley-2026-11-b' and step = 1;
