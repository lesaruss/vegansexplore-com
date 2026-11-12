-- ve-nominate-someone: the featured kit (Sean, 2026-11-12: "approved, build the featured kit"; the drafts in
-- docs/proposals/nominate-someone.md approved as written).
-- (1) The photo asked for at Set Up Your Account, with its release line (approved in the 2026-11-09 mock; left out of the step 2 build).
-- (2) Featuring: the places it is live, the kit (the drawn portrait in five shapes and the two share graphics, made by Logan with
--     scripts/featured-kit/, at vegan-media/media/people/<kit_slug>/featured/), the likeness check, and Send.
-- (3) Two people campaigns, active (the wording approved): featured-people (to the featured person, their link to You've Been Featured)
--     and nominator-featured (to their nominator, their link to where the feature is live). Each row carries its own filled-in email.
-- (4) Redraw requests from the featured person are kept and counted (Sean's watch). Safe to run twice.

alter table ve_nominations add column if not exists photo_path text;                -- nomination-photos bucket, <id>/<uuid>.<ext>
alter table ve_nominations add column if not exists photo_release_at timestamptz;   -- "You may use my photo" ticked
alter table ve_nominations add column if not exists featured_places jsonb not null default '[]'::jsonb;  -- [{kind, label, url}]
alter table ve_nominations add column if not exists feature_requested_at timestamptz;
alter table ve_nominations add column if not exists kit_slug text;                  -- media/people/<kit_slug>/featured/
alter table ve_nominations add column if not exists kit_ready_at timestamptz;       -- the portrait and graphics uploaded and checked present
alter table ve_nominations add column if not exists likeness_checked_by uuid;
alter table ve_nominations add column if not exists featured_at timestamptz;
alter table ve_nominations add column if not exists redraw_requested_at timestamptz;
alter table ve_nominations add column if not exists redraw_note text;
alter table ve_nominations add column if not exists redraw_count integer not null default 0;

insert into ve_outreach_campaigns (slug, name, status, audience, cities, categories, vegan_only, start_on, link_path, daily_pace, approved_at,
  approved_by, email_count, program_slug, sender_brand, footer_reason, note)
values
 ('featured-people', 'Featured people', 'active', 'people', '{}', '{}', false, (now() at time zone 'America/New_York')::date,
  '/nominate/interview', 60, now(), '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 1, 'always-on', 'lesaruss', 'Vegans Explore featured your story',
  'Sean, 2026-11-12: "approved, build the featured kit". People are added only by Send the feature in Depot > Nominations.'),
 ('nominator-featured', 'Nominator: featured', 'active', 'people', '{}', '{}', false, (now() at time zone 'America/New_York')::date,
  '/nominate', 60, now(), '72712a4a-ea0e-4ef4-a29e-d382496ef8da', 1, 'always-on', 'lesaruss', 'you nominated someone on Vegans Explore',
  'Sean, 2026-11-12: "approved, build the featured kit". People are added only by Send the feature in Depot > Nominations.')
on conflict (slug) do nothing;

insert into ve_outreach_campaign_emails (campaign_slug, step, subject, body, day_offset, locked_at, locked_by, updated_at)
values
 ('featured-people', 1, '{first_name}, you''ve been featured',
  E'Hi {first_name},\n\nYou did it. Your story is live on Vegans Explore.\n\nWe also drew you in our style, wearing a Vegans Explore tee. It''s your badge of honor: use it as your profile picture, here and on your socials. Not quite you? Tell us on your page and we''ll redraw it.\n\nYour graphics are ready for your feed and your stories. Tag @vegansexplore so we see it too.\n\nSee it all and share it: {link}\n\nKai\nThe Creator Guide at Vegans Explore',
  0, now(), '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now()),
 ('nominator-featured', 1, 'The person you nominated has been featured',
  E'Hi {first_name},\n\nYour nomination made it happen: their story is live on Vegans Explore.\n\nSee it here: {link}\n\nThank you for shining a light on someone in your community.\n\nKai\nThe Creator Guide at Vegans Explore',
  0, now(), '72712a4a-ea0e-4ef4-a29e-d382496ef8da', now())
on conflict (campaign_slug, step) do nothing;

-- (5) Their photos get their own private bucket (community-comments takes audio only): images, up to 15 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('nomination-photos', 'nomination-photos', false, 15728640, array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict (id) do nothing;
