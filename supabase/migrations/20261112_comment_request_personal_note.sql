-- A personal note on a comment request (Sean, 2026-11-12: "I want to leave a personal note for these people. So this way, it doesn't
-- feel like it's all auto generated"). Shown at the top of /comment/<code> with the sender's picture, and an optional recording of it
-- (a public vegan-media URL; nothing plays until pressed). ve-comments returns these with the public fields. Safe to run twice.
alter table ve_comment_requests add column if not exists personal_note text;
alter table ve_comment_requests add column if not exists personal_note_from text;
alter table ve_comment_requests add column if not exists personal_note_audio_url text;
