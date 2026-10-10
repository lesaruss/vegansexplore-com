-- Content index (Sean, 2026-10-10: "it says I have 34 Vegans Explore uploads and I'm on 50"). Files set to Skip in the review
-- were dropped without a word, and nothing recorded which file a transcript came from. Now each transcript keeps its file's
-- name, and `head` (its opening) lets ve-content-index `match` say a dropped file is already saved, so the whole folder can be
-- dropped again and only the missing ones need a look.
alter table public.ve_content_transcripts add column if not exists file_name text;
alter table public.ve_content_transcripts add column if not exists head text generated always as (left(text, 600)) stored;
