# ve-demo-showroom: Green Leaf tour v3 frames in the lookbook (2026-11-08)

## Where it stands
- **25 v3 frames are in the lookbook** for Sean's OK: https://vegansexplore.com/admin/depot/guides#t/green-leaf-tour/lookbook
  (stills `vegan-media/media/tours/green-leaf-tour/v3-01.jpg` to `v3-25.jpg`; rows replaced through the one-time `ve-once-tour-v3`, now the 410 stub,
  after the connector held the write; migration note `20261108_green_leaf_tour_v3_lookbook.sql`). The 60 v2 rows and Sean's notes on them are in
  `20261108_green_leaf_tour_lookbook_notes.sql`. **No video rendered yet**; `business/tour.html` still plays v1.
- What changed from v2, by Sean's notes: no zoom; each phone shot is the site at 390 px inside a real phone frame (status bar, the Dynamic Island)
  on a white stage with headroom above; the Sample bar hidden (frame 3 was jumbled) and every section framed below the site's sticky header so no
  heading is cut (frame 4); the clock pinned to Tue 12:30 PM Eastern so the site reads Open now; captures at 3x. Four scenes from the sample's own
  full-size photos (the space in four, the kitchen counter, the owner) and V's café picture open and close. Sample stamp top-left on every demo frame.
- 25 frames over 2:12, about 5 s each (shortest: the cart, 3.4 s; longest: the Vegans Explore page and the club, 7 s). Cut on V's phrases (v2's stt
  word timings). V's recordings and the bed `story-dining-v2` at -19 dB unchanged.
- Build: `scripts/tour-video/v3/cap.js` (captures; `node cap.js [shot ...]`), `compose.py` (frames), `shots.json` (chapter, from, to, kind, source,
  brief, words). The v2 renderer `scripts/tour-video/build.py` is the starting point for the v3 render (drop the zoom, 0.4 s crossfades, still frames).

## Round 2 (Sean's notes, same day)
- The phone frame stays ("it kind of grew on me"), and desktop now shows too, mostly mobile: frames 2-3, 8-9 and 18-19 are the site at 1280 px in
  a laptop frame; every screen frame is labeled On a phone / On a computer. Frame 7 uses the current night photo (`s-outside-night.webp`).
- **Sample bars collapse to one row** (Sean on frame 19): the listing demo bar (`directory/listing.html`, every demo: business, group, campaign)
  reads "Sample · A made-up business, here to show what a page can do. More ▾" and opens to the full controls; the sample site's bar
  (`business/site.html`) reads "Sample · A made-up restaurant. More ▾ ▶ Take the tour" (Tour on phones). Open state kept for the visit
  (`ve_demo_bar_open`, `ve_site_bar_open`). Checked locally at 390 and 1440 px, closed and open.
- **Lookbook pause** (`admin/depot/guides.html`): Pause now holds even when the audio was still loading or a chapter was starting (the old seek
  played regardless), the frame stops moving when paused, and tours in `NOZOOM` (green-leaf-tour) play with no zoom.
- These three page changes are on this branch, not live until merged.

## Pace rule: recommendation to Sean (canon `canon-video-shot-pace` not changed)
A new shot about every 4 to 6 seconds (5 on average), never under about 3.5 s or over about 7.5 s; cut at the end of a phrase; a still frame or a
gentle sideways pan, never a zoom-in; screens shown whole in a phone frame with headroom. Change the canon only on Sean's yes.

## Where his phone recordings would beat captures
The four moments that are motion: the heart vote on a favorite (frame 5), the order stepper adding to the cart (14), switching the three looks (17)
and unlocking a reward to its code (22). A 4 to 6 s screen recording of each on /business/sample/site; the Sample bar shows on his phone, so we crop it out and put the
Sample stamp on in the edit.

## Next
1. Sean approves or redoes frames in the lookbook. 2. A 20 s sample (frames 1 to 4). 3. The full v3, uploaded as `media/business/sample/v-tour-v3.mp4`
with `v-tour-v3.vtt`, `business/tour.html` pointed at it (v1 kept), checked live at 1440 and 390 px. 4. The owner's BrandDesk view. 5. pricing_v9.

## Still open with Sean
V's three line changes; check-ins every two weeks on the Community page.
