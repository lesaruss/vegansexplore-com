# Instagram carousel review (ig-carousel)

**Lens:** does the cover stop the thumb, does each slide earn the next swipe, does it read at real feed size (about 360 px wide on a phone), and do three pinned posts work together on the profile grid.

## What works
- The locked band is strong: the mark plus a two-row headline reads at feed size on every slide, and the section colors give the swipe a rhythm (green, green, green, orange, pink, mid green, peach, pink, end card).
- The headlines are short, concrete and swipe-led ("Vegan places near you", "Every place, its own page").
- The Guide scenes are real scenes now (Liz showing a friend, Maya with a menu, River at a festival), not waves.
- The end card has one clear action (Join free) and the Founding Member deadline, which is the real reason to act now.

## What does not
- **The screens are too small to read in the feed.** On slide 1 the phone screen is about 420 px wide inside 1080, so at 360 px on a phone the site's own body text is about 5 px tall. On slide 2 (browser) the desktop page is shown at 0.75x its real size and about 40 percent of the square is empty tint. What people cannot read, they do not save.
- **Desktop shots do not work at feed size at all.** I tried the Seattle hub as a browser frame bled off the right edge at about 1x: at 360 px its words were still unreadable. Slides 2, 6 and 7 use desktop frames.
- **Every slide is the same layout** (phone left, card right, or a centered browser), so slide 2 looks like slide 1 at a glance and the swipe has no surprise.
- **The cover shows the whole homepage instead of one idea.** The thing that stops a thumb here is the big headline "Help build the Vegan community's home base." and the countdown; they are tiny in the current cover.
- **The profile grid:** all three pinned covers are the same shape (phone on a pale tint, band below), so the top row reads as one post three times. The grid shows a 3:4 crop of each 4:5 post (about 34 px off each side); the band and mark survive it.
- **Slide 9 of 9 is long for a pinned explainer.** Swipe-through drops each slide; 7 slides (cover, 5 parts, end card) carries the same story.
- **The frozen countdown** (46 days, 17 hours...) on the cover is wrong the day after it posts. On a pinned post it will be wrong for weeks. Keep the countdown in the reel or a story, or take the cover screenshot below the timer.

## Sean's "the images are small"
He is right, and it is the main fix. The answer is not a smaller band (locked) but **zoom and bleed**: draw the phone 1.5x to 2x bigger and let it run off the bottom of the picture area (the band covers the cut), cropped into the part of the page that matters. The site text goes from about 5 px to about 10 to 12 px at feed size, and the empty tint goes away. The Guide sits in a corner over the lower edge of the screen, whole, never cropped, never over the part that matters.

## Approach
1. Zoom and bleed on every inside slide: a phone 760 to 860 px wide (was about 460), started at the part that matters (the listing hero, the event list, the doors), cut off by the band.
2. Phone captures only; no desktop browser frames in feed carousels (keep desktop for the website and YouTube).
3. Vary the placement (phone left with a Guide card, phone centered alone, phone right alone) so each swipe looks new.
4. Cover = one idea big: the homepage headline and Join button large, Liz showing a friend whole beside it.
5. Cut to 7 slides: cover, Directory, a listing, Events, Guides, Community, end card (Media and Nominate move to the Shows post and a later post).
6. Give the three pinned covers three different shapes on the grid: What is (big phone plus Liz), Holiday (Theo scene large, no phone), Shows (a show cover large).
7. The carousel and the reel are one story, two cuts: the same slides, the same headlines, the same order; the reel is the moving version with Liz's voice. Post the carousel first, the reel links back to it.

## The one change first
Zoom and bleed the screens (the samples here). It answers Sean directly and needs no change to the locked template.

## Samples (rendered on the locked template with `carousel.js`, checked at 360 px)
- `sample-01.jpg` cover, homepage big plus Liz showing a friend
- `sample-02.jpg` Directory, phone alone, centered, starts at the headline
- `sample-03.jpg` a listing, phone left plus Maya with a menu
- `sample-04.jpg` Events, the event list plus River at a festival
- `sample-05.jpg` Community, the Seattle hub, phone set right
- Picture areas: `art/*.jpg`, made by `zoom-art.py`; slide spec `spec.json`. (The cover sample still shows the timer; see the countdown point above.)
