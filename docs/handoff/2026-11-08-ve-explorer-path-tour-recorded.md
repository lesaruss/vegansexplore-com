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

## Vertical, and Sean's frame notes (same day)
- Sean: the final video is vertical, so the lookbook is too. `ve_video_tours.aspect` (welcome-guide 4:5; holiday-guide and depot 16:9 until decided). The player sits on the left with Play, Back and Next under it; the line and the frame numbers are on the right. A picture never crops: one that does not fit sits over a blurred copy of itself (`.fit` in `admin/depot/guides.html`).
- Page shots recaptured at 1080 x 1350 (phone layout): `vegan-media/media/tours/welcome-guide/v45/`.
- Sean's notes applied (migration `20261108_welcome_guide_tour_vertical_pictures.sql`). Every wide picture was redrawn as a native 4:5 scene: 2, 6 (now Theo and Maya), 7 (River), 8 and 23 (Kai), 10, 17 (Liz in her pink tee), 20, 30, 35 (Dani, redrawn), 39 (Nori), 44, and 45 (Liz in pink, no longer a repeat of 36). These came from Higgsfield nano_banana_pro; the jobs reported nano_banana_2. The Atlanta and South Florida art (4 and 32) was outpainted to fill the frame. Frame 16 is a real listing (Dina's) in place of the Sample page. Frames 18 and 19 were recaptured without the Sample stamp. Frame 43 now shows the countdown, so it no longer repeats 37. All 45 frames have their own picture, every one Waiting for Sean again.
- Sean likes Liz in the pink tee; use it more.
- Voice: "Let's go" at the end of chapter 1 sounds off. Two samples are waiting for Sean: `liz/welcome-guide/sample-letsgo-a.mp3` ("Let's go!") and `-b.mp3` ("Let's get started."). After his pick, record `tour-1-v2.mp3`, check it with stt, and point chapter 1 and `welcome-guide.js` at it.
- Search question "vegan ice skating rink" (from a capture) still to delete: the connector held the delete.

## Approved (Sean, 2026-11-08: "We have a winner. I approve what I see.")
- Frames 2 and 44 redrawn with natural adult proportions (b02-welcome: the Guides on cafe steps; b44-rooftop: fireworks). Frame 8 was drawn new, not stretched.
- Chapter 1: `tour-1-v3.mp3` (the v2b take, said in one go, plus a 1 s beat after "Let's go"). Chapter 4: `tour-4-v2a.mp3` adds "And points keep getting more valuable:
  giveaways, special opportunities and discounts are on the way, and the local businesses and nonprofits you give them to will be able to use them for promotion
  through us." (worded as coming: the Vault has no cards yet, points as discounts is an idea, businesses spending points on our services is locked but not built).
  Three frames under it: b20a-liz-gift, s20b-vault, b20c-promotion. `welcome-guide.js` `TAKE` picks each chapter's take. 48 frames, all approved.
- Music: `ve_video_tours.music_url` (the homepage launch bed), looped low under the lookbook.
- Image recipe locked in CLAUDE.md (Guide scenes).
- Next: render the final video in 4:5 (the 48 frames with the slight zoom, Liz's 8 chapters back to back, the bed about 19 dB under her), check it, put it on the
  Welcome Guide's Overview (`/public/ve-video.js`, nothing plays until pressed, captions); then step 4, the paths page (wording in
  `docs/handoff/2026-11-07-ve-explorer-path-steps-2-3-live-step-4-approved.md`).
