# ve-demo-showroom: Green Leaf tour v3 sample approved, full render next (2026-11-08)

## Where it stands
- **Live on main (ee33c022), checked at 1440 and 390 px**: the one-row Sample bars on `/business/sample` (`directory/listing.html`, `db-tog`)
  and `/business/sample/site` (`business/site.html`, `data-sampletog`), More opens the full controls; the lookbook pause fix and `NOZOOM`
  for green-leaf-tour (`admin/depot/guides.html`; the merge kept main's music bed under the player).
- **The 20 s sample is approved** (Sean: "approved, render the full video"): frames 1-4, 23.2 s, 1080 x 1350, still frames 5 to 7 s,
  0.4 s crossfades, no zoom, V's own recordings (t1 at 0.5 s, t2 at 16.41 s), bed `story-dining-v2` at -19 dB with a fade, loudnorm -15
  (measured -16 LUFS). That is the look for the full video.
- **Not rendered yet**: the full 2:12. `business/tour.html` still plays v1.

## How to render the full video (next session's first job)
1. The 25 frames are already in storage: `vegan-media/media/tours/green-leaf-tour/v3-01.jpg` to `v3-25.jpg` (`?v=2`). To rebuild them:
   `scripts/tour-video/v3/cap.js` (captures; phone 390x703 at 3x, desktop 1280x800 at 2x, clock pinned to 2026-11-10T17:30:00Z, hide
   `#sampleBar,#demo-bar`), `compose.py` (frames from `shots.json`).
2. Timing: chapter n starts at O[n]; O[1] = 0.5, each next O = previous O + previous duration + 0.45. Durations: 15.4645, 11.7029, 9.8743,
   11.9641, 10.3967, 9.3257, 12.4865, 8.96, 7.1053, 22.1518, 6.3478; end = last chapter end + 1.2 s tail. Each frame's window is its
   `shots.json` [chapter, from, to] mapped onto that timeline.
3. Audio: V's lines `vegan-media/media/v/green-leaf-tour/tour-<n>-v1.mp3` (line 7 is `-v2`), each placed with adelay at O[n]; bed
   `media/podcast/beds/story-dining-v2.mp3` at -19 dB, fade in and out; loudnorm I=-15.
4. Video: still frames, xfade 0.4 s between them, fade in from and out to white, 1080 x 1350, H.264, faststart.
5. Captions `business/sample/v-tour-v3.vtt` (from v2's VTT and the line texts; line 7 is the v2 recording's words).
6. Upload as `media/business/sample/v-tour-v3.mp4`: redeploy the one-time `ve-once-tour-v3` uploader (key hash in the function; the key
   was in the old session's scratchpad `key.txt`, so make a fresh key), upload, then redeploy the 410 stub.
7. Point `VIDEO` and the caption track in `business/tour.html` (around lines 729, 766, 784) at v3; keep the v1 files.
8. Check live at 1440 and 390 px (plays, captions, Expand on phones, no script errors), commit as Sean, push to main.

## Then
The owner's BrandDesk view, then the pricing_v9 build (Site $500 a quarter no setup, photos $250, video $250, Managed $500 a month,
Community Manager onboarding $150 a client: Stripe, `/business/managed`, the pitch page, `/business`, the agreement).

## Waiting on Sean
- The pace rule: about 5 s a shot (never under 3.5 or over 7.5), cut at a phrase, a still or gentle pan, no zoom-in, screens whole in a
  device frame. `canon-video-shot-pace` changes only on his yes.
- V's three line changes ("Hi, I'm V", "Watch the tour, then tap around", line 7 ends "coming soon").
- Check-ins every two weeks on the Community page.
- Optional phone recordings for frames 5, 14, 17 and 22.

DB wrap: `supabase/migrations/20261108_green_leaf_tour_v3_sample_approved_wrap.sql` (record, playbook row, checkpoint, stream event; applied and checked).
