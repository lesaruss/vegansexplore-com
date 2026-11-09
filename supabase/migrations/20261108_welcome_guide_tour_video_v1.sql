-- ve-explorer-path: the Welcome Guide tour video v1, rendered from the 48 approved frames (applied 2026-11-08 through the connector).
-- File, poster and captions uploaded to vegan-media/media/liz/welcome-guide/ (tour-video-v1.mp4, -poster.jpg, .vtt)
-- through the one-time ve-once-welcome-video (signed upload links), now the 410 stub.
update ve_video_tours
   set video_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/liz/welcome-guide/tour-video-v1.mp4',
       updated_at = now()
 where slug = 'welcome-guide';

-- v2, 2026-11-09 (Sean: "Approved, swap frame 14 and put it on the page"): frame 14 recaptured as Atlanta's Daily Pulse
-- (the South Florida capture showed "Friendsgiving"), the video re-rendered as tour-video-v2.mp4, the tour marked live.
update ve_video_shots
   set image_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/tours/welcome-guide/v45/f07-chapter-v2.jpg',
       brief = 'Atlanta''s Daily Pulse (recaptured 2026-11-09). Held about 3 s with a slight slow zoom in, then cut to the next picture.',
       updated_at = now()
 where tour_id = 'fbdeeb17-29af-410f-98f0-734551903314' and chapter_n = 3 and ord = 4;
update ve_video_tours
   set video_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/liz/welcome-guide/tour-video-v2.mp4',
       status = 'live', updated_at = now()
 where slug = 'welcome-guide';
