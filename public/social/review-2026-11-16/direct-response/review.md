# Direct-response once-over: week of Nov 16 (2026-11-15)

Files marked "rendered" are in this folder under the same path and file name. Specs and the retouch script are in `src/`.

## Guide promos
- **guides/restaurant/slide-01.jpg: FIX, rendered.** The scene works: Liz and an owner going over a menu. But the band only asks "Run a Vegan restaurant?" and never gives the offer, so someone scrolling sees a question with no reason to tap. New headline: "Vegan restaurant? / Get a free check". That is true: the page says "a free check of your Google listing, website and social", free with the survey.
- **guides/restaurant-story/story.jpg: FIX, rendered.** The label said only the Guide's name. It now reads "RESTAURANT GUIDE · FREE CHECK", which matches the sticker (labeled Free check) and gives the reason to tap. "Fill more tables" stays as the hook. Sean's call: it is a promise of an outcome, not a feature. If he wants it strictly literal, use "Get a free / restaurant check".
- **guides/events/slide-01.jpg: FIX, rendered.** (1) River's wristbands read "EVENT WRISTBAND". That breaks the rule against readable lettering in our drawn scenes. I retouched it out with `src/retouch.py` (the straps keep their color; the lettering is gone at feed size). (2) "Host a Vegan event" is an order with no reason, and it speaks to guests as much as hosts. New headline: "Hosting a Vegan / event? Start here". It picks out hosts and points them to the Guide.
- **guides/events-story/story.jpg: SHIP.** River is planning on a calendar, the line is clear, and the sticker "Plan it" is the call to action.

## Philadelphia "5 Vegan spots" carousel
- **slides 01 to 06: SHIP.** The hook is clear, the real food photos read at 360 px, and no words sit on the pictures. The Batter & Crumbs cup shows their own logo, but it is their own photo of their own product, which is fine.
- **slide-07.jpg: FIX, rendered.** (1) "Join free by January 1 and be a Founding Member" reads as if joining stops being free on January 1. That is untrue: only Founding Member closes. (2) "Join free" appeared twice, and the end card never said where to tap (the button cannot be tapped on Instagram). New line: "Joining is free. Founding Member closes January 1. Link in bio."
- **Caption: FIX (database, for Logan).** In `20261115_social_week_mix.sql`, change "Join free by January 1 to be a Founding Member." to "Joining is free. Join before January 1 to be a Founding Member."
- **The template for the nine other cities.** Keep this structure: the city cover (art drawn square, "5 Vegan spots in / <City>" with the city in bright green), five food slides, and the end card with the line above. Two changes for the template, both waiting on data, not done here:
  - Row 2 of each food slide says "Philadelphia" five times, which wastes the best words in the post. Use the listing's neighborhood or its known-for dish from the Directory (for example "Vedge / Center City"). Miss Rachel's two-row name already breaks the pattern. I did not add neighborhoods because they are not on record in the repo.
  - Add a small credit on each food slide's band ("Photo @handle"). The photos are the restaurants' own Instagram posts, and the caption tag alone is easy to miss.
  - Picks rule: open, 100% Vegan, with a real food photo. Cover and end card use the chapter's own art.

## Holiday
- **thanksliving/slide-01.jpg (Sat): FIX, rendered.** The mashed potatoes with a butter pat had no Guide in them (Guides anchor every post), and a stranger reads the pat as dairy. I swapped in Theo carrying the ThanksLiving roast to the table (`public/guides/holiday/theo-thanksliving.jpg`, square, not used anywhere else on social). The headline is unchanged. The post's caption is not in the repo migrations, so I could not check it; it needs one action ("The Holiday Guide has menus to order and recipes. Link in bio.").
- **pinned/holiday-story/story.jpg (Sun): FIX, rendered as a stopgap; needs new art.** (1) Theo is only waving (`theo-overview.jpg`), which breaks the "never just waving" rule. (2) "LINK IN BIO" is the wrong instruction on a story, which has its own link sticker. My stopgap uses Theo with a holiday takeout bag (`theo-menus.jpg`, 4:5), with the label "HOLIDAY MENUS · TAP THE LINK", the Sunday-before-Thursday action. The catch: `theo-menus` also appears in a small card on slide 3 of the pinned Holiday carousel (Tue). The right fix is a new 4:5 Theo scene (for example, setting the ThanksLiving table) made with the Guide-scenes recipe. The other 4:5 option, `theo-store.jpg`, has readable "PLANT BUTTER / OAT MILK" lettering, so it is out.

**Count: SHIP 7 files (the Events story and Philadelphia slides 1 to 6). FIX 6 files, all rendered, plus 1 caption change for the database.**
