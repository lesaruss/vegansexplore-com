# Podcast promotions review (your-week), 2026-11-15

Fixed files are in `soflo-112/` and `ep146/`, with the same names as the originals. They were rendered on the locked podcast pack frames (`render-pack.js` drives `scripts/brand-templates/podcast-pack/render.html`, and the specs are in `specs/`). The story cards come from `card.js`, which is `episode-card.js` with one change: the card background takes the story's own color. No new art was generated. Every fixed file was checked at full size and at 360 px.

## SoFlo Vegans, Episode 112 (from vegan-media `media/social/soflo-112/`)
Note: dir-02 to dir-05 do not exist in storage (they return 404). That is by design: the Directory carousel is dir-01 + car-03 to car-05 + car-10 (`docs/podcast-pack/soflo-112.md`).

- car-01 SHIP. The show art, plus "is back" news for fans.
- car-02 FIX, rendered. "Same kitchen, new name" leaves a stranger asking "whose kitchen?". The new headline is "VCC is now / Honest Cuban", which uses the old name the audience knows. The first try, "Vegan Cuban Cuisine...", ran to three rows.
- car-03, car-04, car-05 SHIP. Real photos and a real logo, and no face is cut off. Sunni's head sits close to the top edge, but that is her own photo shown whole.
- car-06, car-07, car-08 SHIP. ThanksLiving falls on Thursday, Nov 26, 2026, which is correct.
- car-09 FIX, rendered. The tile said "50 a stop", and "stop" is our in-house word. It now says "50 a place". The 50 points per place is true (bounty campaigns `still-open-<chapter>`, open until Dec 1).
- car-10 SHIP. The LINK IN BIO tag is clear of the stripe.
- dir-01 FIX, rendered. It reused car-01's Miami skyline one day later, and its headline "New in the Directory" said nothing about what was new. The picture area is now the three new listings on tint (Carla's photo, Sunni's photo, El Nopalito's logo, each shown whole). With this change it is also no longer a cityscape on a grid that is heavy with them.
- hol-01 FIX, rendered. It reused car-06's pie, and no Guide anchored it. The picture is now Theo serving the ThanksLiving roast (`public/guides/holiday/theo-thanksliving.jpg`, square), a Guide doing something. "The Holiday Guide is free" is true.
- bty-01 FIX, rendered. Same "a stop" change as car-09. The caption has to carry where and how, and the story below now does too.
- st-new SHIP. It already has the rundown card with real details.
- st-dir FIX, rendered. It was detail-free: the label "Three new Vegan spots" over a skyline. Two of the three are a chef and a food maker, not "spots". The headline is now "Three new in the Directory", and the card names each one with a detail: Carla in Miami with a holiday menu, Sunni Speaks Vegan maker of Smackin' Oxtails, El Nopalito in Hallandale Beach.
- st-hol FIX, rendered. Theo was only waving, which breaks the rule. He is now holding a takeout order (`theo-menus.jpg`, 4:5). The headline is "Order your ThanksLiving" and the label is "The free Holiday Guide".
- st-bty FIX, rendered. It was a bare points tile. It now has a How it works card: pick a South Florida place, take a photo of the outside and the menu or hours, earn 50 points a place (closed counts too), open until December 1.
- st-madai FIX, rendered. It was only a logo, so a stranger has no reason to tap. The card now reads: Madai Rodriguez of V Collective; "Seven Vegan roommates did not convert her"; "One book in Thailand did: The Food Revolution". Those facts come from her segment notes (`docs/proposals/pre-vegan-origin-stories-landscape.md`). **Confirm** her clips made the final cut of 112: the 11-09 handoff said she would move to 113 without her Vegan America link.

## Vegans Explore Podcast, Episode 146 (`public/social/week-2026-11-16/ep146/`)
- car-01 FIX, rendered. "Episode 146 is out" gives a stranger nothing. It now leads with the hook: "Episode 146: / Chaka Khan's café". Kai at the mic stays.
- car-02 FIX, rendered. The Plantbaed wordmark was about 25% of the width and unreadable at phone size. It is now trimmed and scaled to fill the picture area. **Needs a better logo**: the vegan-media copy is only 300 px (the wordmark is 233 px), so the scaled version is soft. Copy a full-size logo from the café into vegan-media and re-render.
- car-03 FIX, rendered. "Next Level is here" did not say where "here" is. It now shows the full name, "Next Level / Veggie Grill"; "...is listed" ran to three rows. The caption says "joins the Directory".
- car-04, car-05, car-06 SHIP. The Dec 11 tile fits, and Klaper's face is clear.
- car-07 SHIP. It shows Apple and Amazon only, which matches the caption ("Listen free on Apple Podcasts and Amazon Music").
- st-new FIX, rendered. The rundown card's first thumbnail was the Plantbaed wordmark at 150 px, which is unreadable. It is now a "Café" tile. The rest of the card is unchanged.

## Outside my share, spotted in passing
- The Sunday story "ThanksLiving is Thursday" (`thanksliving/`) still uses the waving Theo (`theo-overview.jpg`), which is the same rule break as st-hol.
