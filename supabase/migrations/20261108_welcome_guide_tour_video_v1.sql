-- ve-explorer-path: the Welcome Guide tour video v1, rendered from the 48 approved frames (applied 2026-11-08 through the connector).
-- File, poster and captions uploaded to vegan-media/media/liz/welcome-guide/ (tour-video-v1.mp4, -poster.jpg, .vtt)
-- through the one-time ve-once-welcome-video (signed upload links), now the 410 stub.
update ve_video_tours
   set video_url = 'https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/liz/welcome-guide/tour-video-v1.mp4',
       updated_at = now()
 where slug = 'welcome-guide';
