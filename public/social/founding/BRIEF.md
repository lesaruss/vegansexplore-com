# Brief: "Why become a Founding Member" carousel (2026-11-15)

## The client's ask (Sean, in his words)
"We need to have a carousel with each carousel explaining why someone should become a founding member of Vegans Explore... It has to be
about them, right? Like how this feature supports them, and they're looking through all this, and at the end, it's free registration until
January 1st." "What should we put here that's going to make people stop... are they going to stop and look at this?" Problems he saw in the
last version: "there's no call to action, it's no urgency, it just ends. It doesn't tell us what cities we're in... there's an opportunity for
this not to be the screenshot show." "Using our branding, not veering away too far from our branding. What is the most effective way of
accomplishing our client's goal?"

You are one of four world-class social graphic designers who specialize in stories and the psychology of what makes people stop, swipe and
act. Each of you brings ONE proof: a complete Instagram carousel. You are assigned a starting strategy (in your task message) so the four proofs
differ; push it as far as it honestly goes.

## Goal of the post
A stranger in the feed stops, swipes to the end, understands what Vegans Explore does for THEM, feels the January 1 deadline, and taps the link
in bio to register free. It will be pinned at the top of the Instagram profile.

## The facts (only these; never promise anything else)
- Vegans Explore is a free Vegan community platform. Joining is free: a short survey (members get 250 welcome points). There is no payment.
- **Founding Member**: anyone who joins before **midnight Eastern on January 1, 2027** is a Founding Member, and that "stays on your profile
  for good." After that, it is gone. No exceptions.
- Our cities (chapters), name them freely, never write how many there are: South Florida, Central Florida, North Florida, Atlanta,
  Washington, D.C., Maryland, Virginia, West Virginia, Delaware, New York, Philadelphia, Los Angeles, Seattle, Portland, San Francisco,
  Austin, Denver, Boston, London. A live count of places is fine (e.g. the Directory page shows "487 places to eat in the United States").
- What a member can really do (all live): find Vegan places near you (Near me, a ZIP or a city); vote for the places you love and save them;
  check in at places and do "Is it still open?" bounties to earn points (a listing shows "Check in +10"); give points to people and causes;
  Vegan events near you; free Guides for every step (Pre-Vegan to Seasoned; the Holiday Guide is free); your city's community hub;
  free podcasts and shows (the Vegans Explore Podcast every Sunday, SoFlo Vegans every Wednesday); nominate someone to be featured; record
  your story or a question for the podcast; business owners claim their listing free.
- Do NOT feature the Daily Pulse (stale since June). No prices, no paid Passport, no "$11".

## Brand (locked; stay inside it)
- Open `mocks/brand-kit/templates.html` and read its CSS: the "Posts and carousels" slide is the template. 4:5, 1080 x 1350; the top 1080 x 1080
  is the picture area; below it the section-color band with the suitcase mark and a two-row headline; the stripe along the bottom. End card:
  a 16:9 city on top, white logo, headline, one line, a big button. You may vary what goes in the picture area as much as you like (a big
  headline-on-color "type slide" counts as a picture area too, as long as words are not printed over a photo or illustration).
- Colors: `--dk #2D5C27`, `--md #3A9B3E`, `--br #22C55E`, `--or #F69820` (one orange action per post), `--pink #FF9EC4`, `--peach #FFEBD1`,
  `--tint #E8F5E9`, ink `#1a1a1a`. Montserrat 900 headlines. 6 px corners. The logo files: `public/logo-ve-*.svg`.
- Rules: words never ON a picture (they sit on color); no em dashes; "Vegan" always capitalized; never a face cut off by a frame or covered;
  never stretch a picture; third person when describing a business; the Guides are drawn characters, never photos.

## Assets you may use (no new image generation)
- Guide scenes doing things: `public/social/pinned/scenes/*.jpg` (square), `public/guides/welcome/liz-*.jpg` (4:5), `public/guides/holiday/theo-*.jpg`
  (4:5), `public/guides/nominate/kai-*.jpg`, roster squares `public/brand-kit/avatars/` (current: liz-v2, maya-v4, theo-v3, nori-v2, dani-v2,
  river-v1, kai-v2, pascal-v2). City art: `communities/<slug>/wide.jpg` (16:9), `communities/<slug>/square.jpg` where it exists,
  `communities/<slug>/banner.jpg`. Phone captures: `public/social/pinned/cap/*.jpg`; take fresh ones with
  `node scripts/brand-templates/capture.js --out <dir> name=URL[|scrollY]`. If you use a screenshot, crop in so it reads at phone size.
- If a slide truly needs a picture that does not exist, describe it in your notes as a request; do not fake it.

## Tools
`node scripts/brand-templates/carousel.js --spec spec.json --out dir` renders slides on the template (site served at localhost:8766, already
running; if not, `python3 -m http.server 8766` from the repo root). You may write your own renderer in your folder (Playwright and PIL are
installed) as long as it reads the template's CSS and the result matches the kit.

## Deliver (only inside `public/social/founding/<your-slug>/`)
1. `slide-01.jpg` ... the whole carousel, 7 to 10 slides, 1080 x 1350.
2. `caption.md`: the Instagram caption (hook first line, the deadline, link in bio, a few hashtags) and the on-slide words of every slide.
3. `rationale.md` (short): your strategy in one line, why it makes a stranger stop and swipe, how each slide moves them, how the end creates
   urgency, and what you would test.
4. Check every slide yourself: open it, and look at it scaled to 360 px wide (feed size). Nothing overflows, every word readable, no cut faces.
Do not edit anything outside your folder, do not commit, no database, no live systems. Report back in under 200 words: the strategy, the slide
list in one line each, and your files.

## Stories never depend on a link sticker (Sean, 2026-11-15)

Everything we schedule posts itself through Metricool, which cannot add stickers, and Instagram does not allow adding one after a story is up.
A story points to the link in bio ("Link in bio" in its label when it needs one) and never says "tap the link". Nothing we make needs a person to post it.
