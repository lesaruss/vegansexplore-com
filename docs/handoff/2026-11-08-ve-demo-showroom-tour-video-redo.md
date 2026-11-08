# ve-demo-showroom: Green Leaf Kitchen tour, the video needs a re-cut (handoff, 2026-11-08)

Playbook `ve-demo-showroom`. Also `ve-front-of-house` (pricing build, not started).

## Where it stands
- **Live on main (9b46e15):** `/business/sample/tour` (`business/tour.html`, rewrite in `vercel.json`) is a one-tab Guide Overview copied from
  `guides/holiday-guide.html`. Left: header with Try it and Talk to our team, Start here, Try it, and picture pills in four groups (customer, member,
  owner, work with us) that open `/business/sample/site` in the right state (`?as=member|owner`, `?look=<key>`). Right: V in her scene picture
  (`business/sample/img/v-tour.jpg`), her 2:12 video (`vegan-media/media/business/sample/v-tour-v1.mp4`, captions `business/sample/v-tour-v1.vtt`),
  Play the tour and Talk to our team. The sample site's bar has a green **Take the tour** button.
- **Community page live on the sample** (`#/community`): owner-set rewards for points, first come first served, never cash; the club is a Guide.
  Canon `canon-ve-front-of-house` v10 (`community_page_v10`), Community Manager onboarding fee $150 a client.
- **V's 11 lines** recorded in her voice (`Nhs7eitvQWFTQBsf0yiT`), `vegan-media/media/v/green-leaf-tour/tour-<n>-v1.mp3` (line 7 is v2), all checked with stt.
  Three changes Sean has not approved yet: line 1 "Hi, I'm V", "Watch the tour, then tap around", line 7 ends "coming soon".
  Liz's 11 lines (`media/liz/green-leaf-tour/`) are in storage, unused.

## Sean's verdict on the video (2026-11-08): redo it
"It's a choppy scroll... not a good representation of the site. I would almost prefer it just to be a still page that is zooming... a slow zoom...
I want to see every 3 seconds a different shot." The v1 video panned down full-page captures with ffmpeg crop (choppy) and held some shots 6+ seconds.

**The rule (now canon `canon-video-shot-pace`):** in any narrated video we make (tours, Guide videos, social, ads), the shot changes about every 3
seconds; each shot is a still with a slow, smooth zoom (or a gentle pan), never a page scroll. Never hold one shot longer than about 3.5 seconds.

## Next (Logan, in order)
1. Re-cut as `v-tour-v2.mp4`, same voice files, no new recordings:
   - Capture the sample site at phone size (deviceScaleFactor 2, 390 wide) as **viewport-sized stills**, not full pages: many crops per page
     (hero, today strip, a favorite card, a dish page's allergens, the ingredients list, the order stepper, the rewards grid, an unlocked code,
     the owner bar, each of the three looks...). Aim for 40 to 45 shots across 132 s.
   - Cut on V's words with stt word timings, one shot about every 3 s, each a smooth Ken Burns zoom (zoompan at 60 fps upsampled or scale+crop with
     float expressions so it does not stair-step; render at 2x then downscale), short crossfades (0.2 to 0.3 s).
   - Keep the Sample stamp on every capture, V's scene picture to open and close, the bed `story-dining-v2` at -19 dB, loudnorm -15 LUFS.
   - New captions `v-tour-v2.vtt`; point `VIDEO` and the track in `business/tour.html` at v2. Keep v1 in storage.
2. Show Sean a 20 s sample before rendering the whole thing.
3. Then the owner's BrandDesk view; then the pricing_v9 build (Stripe, `/business/managed`, the pitch page, `/business`, the agreement): BrandDesk
   Site $500 a quarter no setup, photos $250, video $250, Managed $500 a month, Community Manager onboarding $150 a client.

## Cost of the tour video (Sean asked)
- Higgsfield: **4 credits** (V's scene picture, two variants). Balance was 475 before.
- The video itself: **0 credits**, built locally with Python and ffmpeg.
- Voice: V's 11 lines (plus one retake) and Liz's 11 lines through ElevenLabs (el-media tts), about 1,900 characters each set, on the ElevenLabs plan, no
  Higgsfield credits.

## Open with Sean
- Approve or reject V's three line changes above.
- Check-ins every two weeks on the Community page: still unanswered.
- Unproven: playback with sound on a real phone.

## Scratch scripts (this session only, not in repo)
`cap.js` (captures), `build.py` (video build), `t3.js`, `t4.js`, `live2.js` (checks) were in the session scratchpad; rebuild them from this note.
