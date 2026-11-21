# Conversion review: What is Vegans Explore (and the pinned row)

**Lens:** can a stranger tell in three seconds what Vegans Explore does for *them*, and is there one clear thing to do next?

## What works
- The locked template is strong in a feed: the band headline is the only text a scroller reads, and every band is short and two rows.
- Real screens of the real site, not mock-ups. That is the proof a stranger needs that this is a working product.
- The end card is the right shape: one offer, one deadline, one button.
- Section colors already tell the story (green Directory, orange Events, pink Guides) once people swipe twice.

## What does not
- **The images are small (Sean is right).** On a phone the post is about 360 px wide. The current phones fill about 40% of the width and show a
  whole 390 px page, so body text lands at about 4 px: unreadable. The two browser slides (2 and 6) are worse: a full desktop page in a 960 px
  frame is about 0.13 scale at feed size. The fix is not a wider phone, it is **zooming into the part of the screen that matters**.
- **Cover asks about us, not them.** "What is Vegans Explore?" makes the stranger do the work. The cover is the only slide most people see.
- **Nine slides, one idea each, no order of value.** Places, then a listing, then events, Guides, community, shows, nominate. Drop-off after
  slide 3 is normal; the strongest reasons (food near me, events near me) must be first, and nominate is a member feature, not a reason to join.
- **Slide 2 repeats the cover's job and slide 6 shows the nav's "Daily Pulse"** (not publishing since June; crop it out or recapture).
- **Caption does not match the slides and breaks a rule:** it lists The Daily Pulse (must not be featured) and Passport (not in the slides), and
  the asset list in the migration has 10 slides while the spec has 9.
- **The end card never says what a Founding Member gets.** The real, built answer: it stays on your profile for good. Say it.
- **Events age fast.** Any dated event screen is stale within days of being pinned. (Also seen: the live Events page still lists the Nov 14
  VegFest as Upcoming on Nov 15; worth a look by whoever owns Events.)

## The pinned row as a landing page
Three pins read left to right as a profile's front door: **1. What it is** (this carousel) -> **2. Why now** (Holiday Guide, seasonal) ->
**3. Keep coming back** (Our shows). Keep What is Vegans Explore in the first slot, not the Holiday Guide: a stranger who lands on the profile
needs the "what" before the "what's new". Every pin ends on the same Join free card so whichever one they open, the ask is identical.
The reel is a separate asset that tells the *same story in the same order* (same five beats, same headlines), so the reel's viewers recognise
the pinned carousel when they hit the profile. The reel is the trailer; the carousel is the menu.

## Redesign approach
1. Zoom into each screen: crop the region that matters and show it at 0.6 to 0.8 of native size (about 2x today), cut off by the band.
2. One phone or one screen per slide, big; a Guide scene only as a small square anchor beside it, never over the screen, face always whole.
3. Cover says the benefit: "Everything Vegan, near you. Free." The brand name is already on the mark, the profile and the caption's first line.
4. Six slides, value first: cover, find food, a place's page, events, your city's hub, Join free. Guides, shows and nominate go to their own
   pins and posts; one more slide each costs swipes, not clarity.
5. End card: "Join free, be a Founding Member", line "Before midnight Eastern, January 1. It stays on your profile for good.", button
   "Join free: link in bio".
6. Caption: first line repeats the cover; then one line per slide in the same order; then the deadline and the link. Remove Pulse and Passport.
   Draft: "Everything Vegan, near you. Free. / Find Vegan food in any city / Every place has its menu, votes and check-ins / Vegan events near
   you / Your city's Vegan hub / Join free before midnight Eastern on January 1 and Founding Member stays on your profile for good. Link in bio."
7. Recapture the Events screen the morning it posts, and again each week it stays pinned.

## The one change first
**Zoom into the screens.** It answers Sean's point directly and makes every slide do its job at feed size; the rest is order and words.

## Files
- `sample-01.jpg` to `sample-06.jpg`: cover, four inside slides, end card (1080 x 1350, locked template, checked at 360 px).
- `art.js`: the zoom compositor (crop card, big sliced phone, square scene card). `art/*.jpg`: its 1:1 picture areas.
- `spec.json`: the slide spec for `scripts/brand-templates/carousel.js`. `cap/events*.jpg`: fresh Events captures (2026-11-15).
