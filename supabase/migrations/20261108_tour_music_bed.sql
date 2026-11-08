-- ve-explorer-path: a music bed under the tour (Sean, 2026-11-08: "we just need some music underneath it as well").
-- The lookbook plays it low and looping under the narration; the final edit uses the same bed.
alter table ve_video_tours add column if not exists music_url text;
update ve_video_tours set music_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/home/launch-bed-v1.mp3'
 where slug = 'welcome-guide' and music_url is null;
