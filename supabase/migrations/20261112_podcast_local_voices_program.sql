-- Podcast: Local Voices, a program in HQ Outreach > Campaigns (Sean, 2026-11-12: "set up a campaign for the podcast... Now is when we
-- should be reaching out to people for comments, so the show could be more dynamic, and it's also a way for us to introduce the platform
-- to them... I'm friendly with them... And then if they are, then we have the follow up sequence in the outreach section that I can just
-- copy and paste"). Copied from gift-guide-2026: a warm opener with no link, the link once they say yes, one nudge, then stop.
-- First people: Sunni Speaks Vegan and Raw Chef Carla, for SoFlo 113 (Wed Nov 18). Playbook ve-podcast-studio. Safe to run twice.

insert into ve_campaign_programs (slug, name, goal, status, note, start_on, end_on)
values ('podcast-local-voices', 'Podcast: Local Voices',
  'People we know in each city share their Vegan origin story as the local voice on that city''s podcast, and meet the relaunched Vegans Explore on the way.',
  'draft',
  'DMs come from Sean, in his voice (he knows them). Opener: no link. Once they say yes: their own tracked link to a comment request (record or type, up to 3 minutes). No reply in 3 days: one nudge, then stop. A voice that comes in goes to that week''s local voice card in BrandDesk > Podcast. First: SoFlo 113 (Sunni, Carla).',
  '2026-11-12', '2027-12-31')
on conflict (slug) do update set name = excluded.name, goal = excluded.goal, note = excluded.note;

insert into ve_campaign_program_steps (program_slug, n, day_offset, kind, channel, title, who, url, body, status) values
 ('podcast-local-voices', 1, 0, 'post', 'instagram', 'DM 1: the opener, from Sean (no link)', 'Each person we ask',
  null, 'Warm and personal, in Sean''s voice: the relaunch, and that he would love to spotlight their Vegan origin story. Ends with "let me know if you''re interested". Each person''s own script is in the DMs to send section below.', 'draft'),
 ('podcast-local-voices', 2, 0, 'post', 'instagram', 'DM 2: what to do next, once they say yes', 'Who says yes',
  null, 'Their own tracked link to their comment request: tap record, a minute or two on how they went Vegan, or type it. The day it plays and the day we need it by.', 'draft'),
 ('podcast-local-voices', 3, 3, 'post', 'instagram', 'The nudge, after 3 days with no reply', 'Who has not replied',
  null, 'One short, no-pressure note. Then stop.', 'draft'),
 ('podcast-local-voices', 4, 0, 'page', 'web', 'Their page: record or type their story', 'Who taps the link',
  '/comment/sunni-soflo-113', null, 'live')
on conflict (program_slug, n) do update set title = excluded.title, who = excluded.who, url = excluded.url, body = excluded.body, day_offset = excluded.day_offset;

insert into ve_campaign_dms (program_slug, listing_id, channel, handle, opener, follow_up, nudge, status, note, sort) values
 ('podcast-local-voices', 'afc4748e-bb81-49b8-bad4-0d006d91f382', 'instagram', 'sunnispeaksvegan',
  'Hey Sunni! I''m excited for everything that''s happening for you. Just wanted to let you know we''ve relaunched Vegans Explore, and I''d love to spotlight your Vegan origin story on the SoFlo Vegans Podcast. Let me know if you''re interested, and I''ll tell you what to do next.',
  'Love it! Here''s your link: vegansexplore.com/go/sf113-voice-sunni. Tap record and tell South Florida how you went Vegan, and how that led you to cooking for people as Sunni Speaks Vegan. A minute or two is perfect, or you can type it. It plays on the SoFlo Vegans Podcast on Wednesday, November 18, so if you can send it by Monday, that''s perfect.',
  'Hey Sunni, no pressure at all. If you''d like to share your story on the show, here''s the link: vegansexplore.com/go/sf113-voice-sunni. I''d love to have you.',
  'to_send', 'SoFlo 113 local voice. Comment request sunni-soflo-113.', 10),
 ('podcast-local-voices', '880eb32d-6d16-4fad-8d47-180b00f50715', 'instagram', 'rawchefcarla',
  'Hey Carla! It''s so good to see some familiar faces in this space after all these years, and you know I''ve always got your back. We''ve relaunched Vegans Explore, and I''d love to showcase you, starting with your Vegan origin story on the SoFlo Vegans Podcast. Let me know if you''re interested, and I''ll tell you what to do next.',
  'Love it! Here''s your link: vegansexplore.com/go/sf113-voice-carla. Tap record and tell South Florida how you went Vegan, and how that led you to raw Vegan food and Raw Chef Carla. A minute or two is perfect, or you can type it. It plays on the SoFlo Vegans Podcast on Wednesday, November 18, so if you can send it by Monday, that''s perfect.',
  'Hey Carla, no pressure at all. If you''d like to share your story on the show, here''s the link: vegansexplore.com/go/sf113-voice-carla. I''d love to have you.',
  'to_send', 'SoFlo 113 local voice. Comment request carla-soflo-113. Carla also has a Holiday Guide DM waiting in gift-guide-2026: send this one first.', 20)
on conflict (program_slug, listing_id, channel) do update set handle = excluded.handle, opener = excluded.opener, follow_up = excluded.follow_up, nudge = excluded.nudge, note = excluded.note, sort = excluded.sort;
