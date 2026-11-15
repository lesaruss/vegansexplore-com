# Creative director review (2026-11-15)

**Lens:** faithfulness to the locked Color Block kit, hierarchy, how big the product reads inside the picture, the three pinned carousels as one set, and craft.

## What works
- The template itself is right and should not move: 1080 square picture, section-color band, suitcase mark, two-row headlines, stripe. All three carousels follow it, so as a grid the pinned row already reads as one brand.
- Section colors are used correctly (Directory green, Events orange, Guides pink, Communities mid green, Media peach). Headlines are short, two rows, and read well at feed size.
- The Guide scenes (Liz on the couch, River at the festival, Theo with the guidebook) are on-model and on-style, and each one is doing something, as Sean asked.
- End cards are strong: a wide city, the white logo, one orange button.

## What does not work
- **The product is the smallest thing on the slide.** In every phone slide the whole 390 px screen is shrunk to about 400 px wide inside a 1080 picture, about 1x CSS size. At 360 px in the feed, body text on the screenshot is about 5 px tall: a gray texture, not a website. The Guide card is often as large as the screen, so the eye lands on the drawing, not the platform, which is the opposite of "show off the platform, the Guides anchor it".
- **Desktop browser frames are worse** (What is 2 and 6, Holiday 4 and 8, Shows 1 and 3): a 1280 px page squeezed into about 960 px reads at about 0.75x. Only the biggest headline survives.
- **Dead tint.** Phones sit in the top-left with 25 to 35 percent of the picture left as empty tint (What is 2, 5, 6; Holiday 4, 8; Shows 1, 3). That space should be product.
- **Inconsistent scale across the set.** Some phones are full-height and small (What is 1, 5), some big and sliced (Holiday 2, 5, 7), so the row looks like three systems. Holiday 7 (Hanukkah) and Shows 2 are the only slides that read well, because they are zoomed in.
- Small craft issues: phones whose top crop lands mid-element; Guide cards and phones floating with uneven gutters; the Shows cover is a desktop page at its smallest.

## Sean's "the images are small"
He is right, and it is a framing problem, not a template problem. The picture area is already the full width of the post; we just fill only half of it with the screen, and we show the whole screen when one part of it matters. Fix: the screen takes 65 to 70 percent of the picture width, is cropped INTO the part that tells the story (start below the site's search bar, run off the bottom under the band), and the Guide drops to a smaller corner card that only touches the phone's bezel. Result: the screen reads at about 1.8 to 2x CSS size, roughly double today, and body text is about 10 px at feed size (see `before-after-360.jpg`).

## Redesign approach
1. **One screen rule for all three carousels:** a phone 660 to 760 px wide (or a browser 968 px wide), cropped in to the story, bleeding off the bottom so the band slices it. Never a whole page shrunk to fit.
2. **Crop to the story, start clean:** each crop begins on a whole element (a headline, a list title), never mid-button, and ends under the band.
3. **Guide as anchor, not co-star:** one 316 px scene card in the opposite column, bottom-aligned, overlapping only the phone's black bezel, so it never covers a word or a face in the screenshot. Alternate sides slide to slide (left, right) for rhythm.
4. **Mix, per Sean:** most slides phone plus Guide; one big centered phone with no Guide (Directory); one browser cropped to the hero (Community). No more than one desktop slide per carousel, and only cropped in.
5. **Tighter What is carousel, 7 slides:** cover, Directory, a listing, Events, Guides, a community, end card. Podcasts move to the Shows carousel and Nominate to its own post, so each slide gets room and nothing repeats across the pinned row.
6. **Carousel vs reel:** two assets, one system. The carousel is the browse version (swipe, read); the reel is the same story in motion with Liz's voice, built from these same crops in 4:5 so the pinned post and the reel look like siblings.

## The one change to make first
Re-crop every screenshot to fill 65 to 70 percent of the picture width, cropped in and sliced by the band, with the Guide shrunk to a bezel-corner card. Same template, same copy; the platform becomes the hero.

## Samples (locked template, rendered with `scripts/brand-templates/carousel.js`)
- `sample-01.jpg` cover, home page hero cropped in, Liz
- `sample-02.jpg` Directory, big centered phone, no Guide
- `sample-03.jpg` a listing (Next Level Veggie Grill), Maya
- `sample-04.jpg` Events, River
- `sample-05.jpg` Guides, Theo (card kept clear of the Guides group picture in the screenshot)
- `sample-06.jpg` Seattle community, browser cropped to the hero
- `sample-07.jpg` end card (unchanged template)
- `before-after-360.jpg` current cover beside the redesigned cover at 360 px
- `art.js`, `art.json`, `art/` the picture-area compositor, its crops, and the 1080 squares; `spec.json` the slide spec
