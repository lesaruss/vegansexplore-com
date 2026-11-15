# Review: pinned carousels, week of Nov 16 (your-city)

Bar: the Founding Member carousels, where every screen is cropped in so it reads at 360 px. Both pinned sets miss it: browser frames are
unreadable at feed size, the side-by-side phones shrink body text to about 5 px, and every scrolled capture shows a broken "HIDE ME / Play
Theo" strip under the sticky header. Both are rebuilt in full in this folder (same file names), from live captures and existing scenes only.

## The Holiday Guide (Tue Nov 17, 9 AM ET): FIX, full set rendered in `holiday/`
- slide-01 FIX: the phone screen is too small to read. Now Theo stirring the pot, big, beside "Free for everyone" and the four parts of the Guide (ThanksLiving, Hanukkah, Christmas, Give back) on color chips.
- slide-02 FIX: the capture shows the broken HIDE ME strip at the top. Now cropped in on "Ideas for the Table" with the November 26 line, plus Theo serving the roast.
- slide-03 FIX: the side phone is unreadable, and the menu shown (A Broken Angel) has "Order by November 18", which expires the day after the post goes up. Now a fresh live capture of Black Rican Vegan, which has no order-by date, plus Theo with takeout bags.
- slide-04 FIX: the browser frame is unreadable at 360 px. Now the Lentil and Mushroom Loaf recipe card (fresh capture), plus Theo with the Wellington.
- slide-05 FIX: broken strip and small text. Now the store list rows, plus Theo with a basket (theo-xm-store; theo-store has readable "PLANT BUTTER" lettering on a pack).
- slide-06 FIX: **untrue on post day.** The capture leads with events on Nov 14 and Nov 15, both over by Nov 17. Now a fresh capture of Nov 18 and Nov 19, plus Theo at a night market (Theo waves in theo-events, so that scene is not used).
- slide-07 FIX: broken strip, and the frame is mostly an empty card. Now "Begins December 4 / Hanukkah" with the latkes, plus Theo holding latkes.
- slide-08 FIX: the browser frame is unreadable. Now the Gift Guide intro (gifts the team picked, save to your wish list), plus Theo wrapping a gift.
- slide-09 FIX: the side phone is small. Now two nonprofit cards from In Our Directory, plus Theo with the goat.
- slide-10 SHIP: the end card is unchanged, re-rendered only so the set matches.
- Every inside slide also gets a dark plate under the screen with the page's path on the site (Holiday Guide > ThanksLiving > Holiday Menus), so people can find what they saw.
- Caption SHIP: it is true, and Hanukkah does begin the evening of December 4, 2026.

## Our shows (Wed Nov 18, 9 AM ET): FIX, full set rendered in `shows/`
- slide-01 FIX: the browser frame is unreadable. Now the two show rows from Vegan Media > Podcasts, plus Kai in the studio.
- slide-02 FIX: the slice only shows a paragraph. Now the Vegans Explore Podcast header with its cover art, plus Liz listening.
- slide-03 FIX: the browser frame is unreadable. Now the SoFlo Vegans header with its cover, plus River at a night market (a mixed cast instead of Kai three times).
- slide-04 FIX: the side phone is small. Now the "Tell South Florida what's going on" prompt, big, plus Kai at the mic, and a plate reading "Record your voice, or write it out".
- slide-05 FIX: **untrue.** "Then join free by January 1." implies joining stops being free. Now: "Wherever you listen. Join free by January 1 to be a Founding Member."
- Caption SHIP: "join free by January 1 to become a Founding Member" ties the date to Founding Member, which is correct.

## Not mine to fix (for Logan)
- The live Holiday Guide Events page (`/guides/holiday-guide#/events`) still lists past events first (Nov 14, Nov 15). The page should hide events that have ended.
- The `vegan-media` copies and the slot assets need these new files uploaded before Tuesday. I did not touch any live system.

Files: `holiday/slide-01..10.jpg`, `shows/slide-01..05.jpg`, `render.js` + `spec.json` (`node render.js holiday|shows`), crops in `crop/`, fresh live captures in `cap/`.
