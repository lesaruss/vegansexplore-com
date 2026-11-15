# Social strategist panel: brief (2026-11-15)

You are one member of a four-person social media strategist panel for **Vegans Explore** (vegansexplore.com), a free Vegan community
platform: a Directory of Vegan places, events, Guides, city communities, podcasts and shows, member points, nominations. Membership is free
(a short survey); anyone who joins before midnight Eastern on January 1, 2027 is a Founding Member. Instagram about 3,800 followers, TikTok
about 3,000, YouTube about 600, Facebook about 370.

## What we are reviewing
The owner, Sean, wants three posts pinned to the top of the profile and one reel:
1. **What is Vegans Explore** carousel (pinned, Mon): `public/social/pinned/what-is/slide-01.jpg` to `slide-09.jpg` (1080 x 1350).
2. **The Holiday Guide** carousel (pinned, Tue): `public/social/pinned/holiday/slide-*.jpg`.
3. **Our shows** carousel (pinned, Wed): `public/social/pinned/shows/slide-*.jpg`.
4. **What is Vegans Explore** reel (Thu), 28 s with a Liz voiceover: frames `public/social/pinned/what-is-reel/shot-01.jpg` to `shot-09.jpg`
   (1080 x 1920), video `public/social/pinned/what-is-reel/reel.mp4`. Its voice line: `public/social/pinned/what-is-reel/voiceover.md`.
An overview sheet: `public/social/pinned/week-2026-11-16-preview.jpg`. Captions are in `supabase/migrations/20261115_social_week_2026_11_16.sql`.

## Sean's feedback so far (his words)
- "the real point of this is to show off the platform, not our guides, but the guides will anchor it."
- "let's not just have them waving. Let's show them in like a scene... doing something."
- "Let's mix it up a little bit... some that are the full image cut off by the bottom part... Some of it doesn't even need to be the phone."
- Now: "I feel like the images are small... maybe it could be expanded a little bit so it's a little bit wider so we see more on the screen...
  I would want them to see more of the viewing window." He is also unsure how the carousel and the reel relate.

## Fixed (do not change)
- The brand kit is LOCKED: `mocks/brand-kit/templates.html` (open it; read the "Posts and carousels" and "Stories and reels" slides and its CSS).
  Carousel slide = 4:5, a 1080 x 1080 picture area on top, then the section-color band with the suitcase mark and a two-row headline, the
  stripe along the bottom; end card = a 16:9 city on top, the white logo, headline, line, Join free. Reel/story = section-color top band
  with label and two-row headline, a 4:5 picture area below; only the picture moves.
- Colors (`--dk #2D5C27` Directory, `--or #F69820` Events, `--pink #FF9EC4` Guides, `--md #3A9B3E` Communities, `--br #22C55E`,
  `--peach #FFEBD1` Media, `--tint #E8F5E9`), Montserrat, 6 px radius, words never ON a picture (they live on the band), no em dashes,
  "Vegan" always capitalized, no city or chapter counts in copy, never a face cut off by a frame or covered by anything, never stretch a picture.
- Guides are drawn characters (Liz, Maya, Theo, Nori, Dani, River, Kai, Pascal); scenes in `public/social/pinned/scenes/`,
  `public/guides/holiday/theo-*.jpg`, roster squares in `public/brand-kit/avatars/` (theo-v3, maya-v4 are current).
- Show only what is real and built. The Daily Pulse has not published since June: do not feature it.

## What is free to redesign
Everything inside the picture area: how screenshots are framed, cropped, zoomed, sized; whether a phone frame is used; where a Guide goes;
slide order and count; which pages to show; headlines (two rows, fit the band); the reel's shot plan; whether the What is carousel and the reel
should be one asset or two. Cropping INTO a screenshot to zoom on the part that matters is allowed (a screenshot is not a face).

## Tools you can use
- Live phone screenshots: `node scripts/brand-templates/capture.js --out <dir> name=URL[|scrollY] ...` (390 x 844 at 3x).
  Existing captures: `public/social/pinned/cap/*.jpg` (phone, 1170 x 2532) and `cap/d-*.jpg` (desktop, 2560 x 1600).
- Picture-area compositor (layouts side, slice, browser): `scripts/brand-templates/screen-art.js` (read its header). You may write your own
  compositor in your folder instead (Playwright or Python PIL are installed).
- Slide renderer on the locked template: `node scripts/brand-templates/carousel.js --spec spec.json --out dir` (needs the site served:
  `python3 -m http.server 8766` from the repo root, already running at localhost:8766). Reel frames: `scripts/brand-templates/reel.js`.

## Your deliverable
Work only inside `public/social/panel/<your-slug>/`. Produce:
1. `review.md`: your lens in one line; what works; what does not (be specific, slide by slide where it matters); answer Sean's "the images are
   small" point directly; your redesign approach in a short numbered list; and the one change you would make first.
2. **Rendered redesign samples** on the locked template, 1080 x 1350 JPEGs: the cover and at least three inside slides of the What is Vegans
   Explore carousel, named `sample-01.jpg`... (the reel strategist: three or more 1080 x 1920 reel frames instead, plus one carousel slide).
3. Check every image yourself before you finish (open it): nothing overflowing, no cut faces, text readable at phone feed size (look at it
   scaled to 360 px wide).
Do not edit files outside your folder, do not commit, do not touch the database or any live system. Report back in under 250 words: your
verdict, your approach, and the list of files you made.
