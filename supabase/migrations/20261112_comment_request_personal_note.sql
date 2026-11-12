-- A personal note on a comment request (Sean, 2026-11-12: "I want to leave a personal note for these people. So this way, it doesn't
-- feel like it's all auto generated"). Shown at the top of /comment/<code> with the sender's picture, and an optional recording of it
-- (a public vegan-media URL; nothing plays until pressed). ve-comments returns these with the public fields. Safe to run twice.
alter table ve_comment_requests add column if not exists personal_note text;
alter table ve_comment_requests add column if not exists personal_note_from text;
alter table ve_comment_requests add column if not exists personal_note_audio_url text;

-- The flow reading (HQ only, never on the page) and which comment request a campaign DM points to (HQ Outreach > the DM's note).
alter table ve_comment_requests add column if not exists personal_note_guide_url text;
alter table ve_campaign_dms add column if not exists comment_code text;
update ve_campaign_dms set comment_code = case handle when 'sunnispeaksvegan' then 'sunni-soflo-113' when 'rawchefcarla' then 'carla-soflo-113' end
  where program_slug = 'podcast-local-voices' and comment_code is null;
