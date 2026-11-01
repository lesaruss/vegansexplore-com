-- Depot > Social: music on reels and TikTok photo posts, and Also share as a story (Sean, 2026-11-01).
-- sound: { instagram?: {audioId, title, displayArtist, audioType, durationMs, igUsername, coverArtworkUrl, mix},
--          tiktok?: {musicId, title, author, previewUrl, thumbnailUrl, duration},
--          by_hand?: {song} }   (Metricool fields checked against its OpenAPI spec 2026-11-01:
--          instagramData.audioConfiguration, Reels only; tiktokData.music, photo posts and carousels only.)
-- story_of: the post a story slot was made from. A story made that way waits as 'held' until it has 9:16 media.
alter table public.ve_social_slots
  add column if not exists sound jsonb,
  add column if not exists story_of uuid references public.ve_social_slots(id) on delete set null;
create index if not exists ve_social_slots_story_of_idx on public.ve_social_slots(story_of);
alter table public.ve_social_slots drop constraint if exists ve_social_slots_status_check;
alter table public.ve_social_slots add constraint ve_social_slots_status_check
  check (status = any (array['proposed','changes','approved','scheduled','posted','failed','manual','skipped','held']));
