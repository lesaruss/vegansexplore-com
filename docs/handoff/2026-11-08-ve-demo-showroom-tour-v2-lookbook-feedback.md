# ve-demo-showroom: Green Leaf tour v2, Sean's lookbook notes (2026-11-08)

## Where it stands
- v2 was cut (60 shots, a new shot about every 3 s, slow zoom, 131.97 s, -15 LUFS). Never uploaded; `business/tour.html` still plays v1.
- Captions `business/sample/v-tour-v2.vtt` are in the repo, not wired.
- Lookbook: https://vegansexplore.com/admin/depot/guides#t/green-leaf-tour/lookbook (60 frames, stills in `vegan-media/media/tours/green-leaf-tour/`).
- Build scripts: `scripts/tour-video/build.py` (shot list, Ken Burns render, Sample stamp, ffmpeg pipe) and `cap3.js` (phone captures). The audio
  (V's `media/v/green-leaf-tour/tour-<n>-v1.mp3`, line 7 `-v2`, bed `media/podcast/beds/story-dining-v2.mp3` at -19 dB) is unchanged and reusable.

## Sean's notes (verbatim summary)
- "I don't like the zoom in." No zoom-in.
- Some screens can't be made out; images need to be clearer; pick better options.
- Not all screenshots: mix in scenes where it makes sense.
- More headroom: the site butts against the top. Show it as it really looks on a phone.
- Frame 3: jumbled, don't like it at all. Frame 4: text cut off halfway.
- 19, 20, 21: halfway decent. 22, 23: a little headroom. The rest decent with headroom.
- "I would almost prefer me doing a recording on my phone and sending it to you."
- Too fast: the 3-second rule (canon `canon-video-shot-pace`) may change, only with his sign-off.
All 60 frames are Redo with his note (migration `20261108_green_leaf_tour_lookbook_notes.sql`).

## Next (Logan)
1. Re-plan v3 in the lookbook: about 25 shots, 5 to 6 s each, no zoom-in (still or a very gentle pan), each a whole section inside a real phone
   frame with the status bar and headroom on a white stage, crisp 2x captures; mix in scenes (V's café picture, Guide art, the sample's own photos).
2. Bring Sean the pace rule as a recommendation; update the canon only with his yes.
3. Offer his phone screen-recording as an alternative source for the b-roll.
4. Reload the lookbook, get his Approve, then cut a 20 s sample, then the full video, upload as v3, point `business/tour.html` at it (keep v1), check live at 1440 and 390 px.
5. Then the owner's BrandDesk view, then the pricing_v9 build (Site $500 a quarter, no setup; photos $250, video $250; Managed $500 a month; CM onboarding $150 a client) in Stripe, `/business/managed`, the pitch page, `/business` and the agreement.

## Still waiting on Sean
- V's three line changes ("Hi, I'm V", "Watch the tour, then tap around", "Delivery is coming soon").
- Check-ins every two weeks on the Community page.
