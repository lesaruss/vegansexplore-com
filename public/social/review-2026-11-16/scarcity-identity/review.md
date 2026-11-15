# Review: the six "Vegan <City> is open" posts and stories (scarcity-identity, 2026-11-15)

Fixed files are in this folder as `<city>/post.jpg` and `<city>/story.jpg`. They come from `render.js`, which is `scripts/brand-templates/city-open.js` plus the call to action. The art is the same, the template is the same, and the headlines are still two rows.

## Pieces
- seattle/post.jpg: FIX, rendered. There is no call to action and no reason to join. The kicker "A NEW COMMUNITY" is 28 px, which is about 9 px at 360 wide, so it cannot be read. It is replaced by a full-width row on the band: an orange "Join free" button and "Founding Member ends January 1" (37 px, about 12 px at feed size).
- seattle/story.jpg: FIX, rendered. The label "NEW COMMUNITY · SEATTLE" only repeated the headline. The ink label now reads "FOUNDING MEMBER ENDS JAN 1", 20 percent bigger. Change the manual step: put the link sticker in the open sky of the city art (the top third, clear of every landmark), labeled "Join free" instead of "Open Seattle".
- portland/post.jpg: FIX, rendered. Same fix as Seattle.
- portland/story.jpg: FIX, rendered. Same fix. The sky is large here, so the sticker has plenty of room.
- san-francisco/post.jpg: FIX, rendered. Same fix. The long headline still fits on two rows beside the full-width row.
- san-francisco/story.jpg: FIX, rendered. Same fix. The headline auto-shrinks (about 80 percent) to stay two rows. That reads fine at 360.
- austin/post.jpg: FIX, rendered. Same fix.
- austin/story.jpg: FIX, rendered. Same fix.
- denver/post.jpg: FIX, rendered. Same fix.
- denver/story.jpg: FIX, rendered. Same fix.
- boston/post.jpg: FIX, rendered. Same fix.
- boston/story.jpg: FIX, rendered. Same fix. Put the sticker in the blue sky between the leaves, never on the maple frame.

## Captions (migration 20261115_social_week_2026_11_16.sql, all six posts)
- FIX: "vegansexplore.com/go/<city>-open" is not clickable in an Instagram caption. On Instagram, end with "Tap the link in bio" and put the /go/ link in the bio for that day. Facebook can keep the link.
- FIX: there is no reason to join. Add before the hashtags: "Join free before midnight Eastern on January 1 and you're a Founding Member, on your profile for good." This is true: joining stays free after January 1, and only Founding Member closes.
- Keep: the third person, the @nextlevelvg tag, the honest place counts ("Dozens", "More than 100"). I could not check those counts against the live Directory without the database. Logan should confirm them.

## Needs new art or Sean's call (not fixable with the existing tools)
- Rule "Guides anchor it, show the platform": none of the six shows a Guide or the site. Counting SoFlo, New in the Directory and Philadelphia, 9 of the 18 grid posts this week are skylines. None are back to back, but the grid reads as a postcard rack. Request: one new scene per city with a Guide doing something there (for example Nori with her phone at Pike Place, River at a Portland food cart pod), drawn as a 1:1 post and a 4:5 story, placed where the skyline is now.
- Sean's call: is a link sticker on the sky of the art acceptable under "words never on a picture"? My recommendation is yes, because it is the only tappable element in a story and it covers no landmark or face. If he says no, the story template needs a taller band and a smaller 4:5 picture, which is a template change.
