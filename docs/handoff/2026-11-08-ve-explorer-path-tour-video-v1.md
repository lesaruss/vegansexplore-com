# ve-explorer-path: Welcome Guide tour video v1 rendered, waiting for Sean (2026-11-08)

- `vegan-media/media/liz/welcome-guide/tour-video-v1.mp4`: 1080 x 1350 (4:5), 2:47.9, 30 fps, 40 MB (H.264 crf 24, AAC 160k, faststart).
  Poster `tour-video-v1-poster.jpg`, captions `tour-video-v1.vtt` (each frame's line on its stt window; lines over 78 characters split in two).
  `ve_video_tours.video_url` set (migration `20261108_welcome_guide_tour_video_v1.sql`).
- The 48 approved frames, each held to the next frame's start with an eased zoom 1.00 to 1.07; straight cuts; Liz's 8 chapters back to back
  (1 = tour-1-v3 with its beat, 4 = tour-4-v2a); voice -15.1 LUFS, peak -2.0 dBFS; the launch bed looped 19 dB under, fading over a 1.5 s tail.
  Every picture was already 4:5 (Liz's page scenes are 960 x 1192, cover-cropped by under 1%). Renderer: `scripts/tour-video/render.py`.
- Checked by eye at the first cut and five other points; pauses over a second are only the chapter breaks.
- Flagged for Sean: frame 14 (the Daily Pulse capture, f07-chapter) shows the headline "A Vegan Friendsgiving..." (we keep that word out of our
  own videos) and a dated "Today" story; frame 23 (b20c-promotion) holds 6.2 s, past the ~5 s rule. Both were in the approved lookbook.
- Next: Sean's OK, then the Overview with `/public/ve-video.js` (it is 16:9 only today; needs an aspect option for 4:5), live at 1440 and 390;
  then step 4, the paths page.
