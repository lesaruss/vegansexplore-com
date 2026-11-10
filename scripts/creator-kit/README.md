# Creator kit renders (first: KJ, Philadelphia, 2026-11-10)

No image model is needed after the creator's avatar exists; these render with Playwright and ffmpeg.

- `carousel.js`: the 10-slide carousel (1080 x 1350) and the story (1080 x 1920). Change CITY, NAME, HANDLE, the city banner
  (`/communities/<chapter>/banner.jpg`) and AVATAR (the creator's GeekFon avatar, plain shirt, no logo). Slide 1: city art, the avatar in a
  white postcard frame, "Meet your official / VEGANS EXPLORE CONTENT CREATOR / [Instagram] Name (@handle)", white bar with the logo and
  "Become a Member". Slides 2 to 9: the Welcome Guide Overview sections over scenes from several Guides (variety, Sean 2026-11-10), text
  low over a shade so it never covers a face. Slide 10: Become a Founding Member by January 1.
- `reel-frames.js` + `reel-cut.sh`: the collab reel. Kai's line (ElevenLabs voice cgSgspJ2msm6clMCkdW9, el-media tts, checked with stt)
  over stills cut on the words, a new shot every 2 to 3.5 seconds. Two layers (Sean, 2026-11-10): only the picture moves (a slow 5 percent
  zoom from 3x stills, no stair-stepping); the shade, the words and the white bar sit still on top, the same bar on every shot.
- Slide 6 and the reel's Guides shot: Maya, River and Kai together (`b50-maya-kai-river.jpg`, Higgsfield job b99504a5), replacing the
  full cast, where Theo read too small (Sean, 2026-11-10).
- Paths in the scripts point at a session scratchpad; set them to wherever the frames and scenes are.
- Outputs for KJ: `vegan-media/media/people/keya-vegankween/kit/` (story, reel-kai-intro-v1.mp4) and Kai's line
  `vegan-media/media/kai/creator-welcome/kj-intro-v1.mp3`.

## Locked as the template (Sean, 2026-11-10)

"Yep, this is the template. I love it... you can just pop in a new person on there and the background match their city."
- Every headline sits on two rows, broken by hand with `<br>` so no word hangs alone; reword a headline if it will not split evenly.
- The bar: landscape logo v1 at 400 px (carousel), 420 px (story), 440 px (reel); the right side never wraps.
- Story and the reel's cover shot: the postcard and words sit centered in the space above the bar.
- Per creator: their GeekFon avatar (blank shirt), their city banner, name, handle and city. Everything else stays.
