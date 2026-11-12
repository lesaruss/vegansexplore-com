-- ve-nominate-someone: the note to the nominator, "we invited them" (Sean, 2026-11-12: "yes, build the nominator note next").
-- Approving a nomination (Depot > Nominations) adds the nominator to the Nominator notes campaign with their own filled-in note: whom we
-- invited, and that they can nominate someone else (their tracked /go/ link to /nominate). One person who nominated several people gets
-- one note naming all of them while it has not gone out yet. Not sent: no nominator email, a self-nomination, or the same address as the
-- nominee. The campaign starts as a draft: nothing sends until Sean approves the wording (then status active, approved_at, the email
-- locked). Safe to run twice.

alter table ve_nominations add column if not exists nominator_note_member uuid;   -- the ve_outreach_campaign_members row of their note

insert into ve_outreach_campaigns (slug, name, status, audience, cities, categories, vegan_only, start_on, link_path, daily_pace,
  email_count, program_slug, sender_brand, footer_reason, note)
values ('nominator-notes', 'Nominator notes', 'draft', 'people', '{}', '{}', false, (now() at time zone 'America/New_York')::date,
  '/nominate', 60, 1, 'always-on', 'lesaruss', 'you nominated someone on Vegans Explore',
  'Sean, 2026-11-12: "yes, build the nominator note next". People are added only by Approve in Depot > Nominations. Draft until Sean approves the wording.')
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset, updated_at)
values ('nominator-notes', 1, 'We invited the person you nominated',
  E'Hi {first_name},\n\nThank you for your nomination. We loved it, and we just invited them to an interview with me. They''ll hear why you nominated them, in your words.\n\nEvery nominee is considered, and their story could be featured on our podcast, on your city''s page and in the Daily Pulse.\n\nKnow someone else who deserves their flowers? Nominate them here: {link}\n\nKai\nThe Creator Guide at Vegans Explore',
  0, now())
on conflict (campaign_slug, step) do nothing;
