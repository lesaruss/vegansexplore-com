# ve-explorer-path: Overview tour recorded, Points scene and phone button fixed (2026-11-08)

- Points scene redone without lettering (`public/guides/welcome/liz-points.jpg`, `?v=2`), live.
- Become a Founder no longer clips on phones: stacked under the price at 480 px and under, smaller letter spacing below 900 px. Checked live at 320, 390, 1440.
- Liz's eight Overview chapters (script v3) recorded in voice `IUMUPi350HfIhyzUBJB3`: `vegan-media/media/liz/welcome-guide/tour-1..8-v1.mp3`, each stt-checked word for word (chapter 4 redone for a stray "Um"). Wired in `guide-scripts/welcome-guide.js`: Play the tour, Listen to the tour, per-chapter Play; checked live at 1440 and 390 (plays, advances, no errors, no sideways scroll).

Next: the tour lookbook in Depot > Guides and tours (`ve_video_tours`) for Sean's approval before any animation; then the paths page.

## Lookbook loaded (same day)
Depot > Guides and tours > The Welcome Guide > Lookbook: 22 frames, 24 decisions, all Waiting for Sean. Captures in `vegan-media/media/tours/welcome-guide/`; rows from `supabase/migrations/20261108_welcome_guide_tour_lookbook.sql` (run by fetching the committed file and checking its sha256 in the database). Fixed `admin/depot/guides.html` naming V instead of the narrator. Next after approval: lip-sync the three on-camera moments, draw the approved illustrations, edit the video.

## Update: the tour is image to image (Sean, 2026-11-08)

Sean: "switching scenes every 3 seconds... not going to animate it... I'm sitting there watching it for 20 seconds thinking that the player broke."
- No lip sync. The 24 shots were replaced by 45 beats (migration `20261108_welcome_guide_tour_beats.sql`, d8e2b27, applied with a sha256 check).
- Each beat is about 3.4 s on average and runs 1.6 to 4.6 s. Beats split at a natural pause, using the stt word timings.
- Each beat is one picture held with a slight slow zoom. The pictures mix page captures with Liz's scenes, Guide banners and chapter art. No credits were spent.
- The lookbook player (`admin/depot/guides.html`) zooms each frame. The header says "No lip sync: a new picture about every N s" when a tour has no on-camera shots.
- Portrait scenes are cropped high (center 18%) so faces stay in frame.
- Next: Sean approves the frames, then the edit (a slideshow video with Liz's voice and a music bed), then the paths page.
