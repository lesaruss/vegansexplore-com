-- ve-feedback: a reply to Brion Hurley (Founding Member, joined by survey 2026-11-08), sent as a one-person BrandDesk people campaign
-- so it is tracked like every other email (Sean, 2026-11-08: "send it through the brand desk outreach so we can track it"). He reported
-- the Communities Save bug (fixed, main 755a092) and Einstein Bros at FLL. Sean approved the words and the send in chat, so the email is
-- locked and the campaign approved here; it goes out in the next sending window (weekdays 9 AM to 5 PM Eastern). Its link is his own
-- tracked /go/ link to FLL in the Airport Guide, where any member can now add an item (main 05ddd01).
insert into ve_outreach_campaigns (slug, name, door, categories, vegan_only, note, status, start_on, cities, audience, email_count, daily_pace,
  sender_brand, link_path, footer_reason, approved_at)
values ('reply-brion-hurley-2026-11', 'Reply: Brion Hurley (Save bug, Einstein Bros at FLL)', null, '{}', false,
  'One-to-one reply from Sean. Asks which FLL terminal Einstein Bros is in; when he answers, add it to FLL in the Airport Guide (Depot > Venues). Playbook ve-feedback.',
  'active', '2026-11-08', '{}', 'people', 1, 5, 'lesaruss', '/guides/airport-guide#/airport/fll', 'you wrote to us about Vegans Explore', now())
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset, locked_at)
values ('reply-brion-hurley-2026-11', 1, 'Thank you, {first_name}: Save is fixed', 'Hi {first_name},

Thank you, and I''m glad the podcast is working for you. That''s exactly why we do it.

You were right about the Save button. It was a bug on our Communities page that made every member look signed out. It''s fixed now, so Save on South Florida should work. Give the page a refresh and try again.

Thanks too for the Einstein Bros tip at FLL. Do you remember which terminal it''s in, and whether it''s before or after security? Reply here and we''ll add the plain bagel with avocado to the Airport Guide. Fort Lauderdale is the free airport in that Guide, so as a member you can also add it yourself from inside the airport next time you fly: {link}

For testing, these are the most helpful right now:

1. The Directory: search for places you know and tell us what''s missing or wrong.
2. Voting and saving on the places you love.
3. The Airport Guide next time you fly.

The Feedback button at the top of every page comes straight to us, with the page you''re on attached.

Thanks for being one of our first Founding Members.

Sean', 0, now())
on conflict (campaign_slug, step) do nothing;

insert into ve_outreach_campaign_members (campaign_slug, person_key, person_name, person_id, step, send_status)
select 'reply-brion-hurley-2026-11', 'brionhurley@gmail.com', 'Brion Hurley', null, 0, 'waiting'
where not exists (select 1 from ve_outreach_campaign_members where campaign_slug = 'reply-brion-hurley-2026-11' and person_key = 'brionhurley@gmail.com' and removed_at is null);
