# Design panel 2: fix what visitors and Sean said about the Guide pages (2026-11-18)

You are a senior product designer. The Vegans Explore Guides (15 live, all on one shared frame) work, but the founder and a user panel
say they do not invite people in. Design ONE version (your assigned direction) that fixes it, using the brand kit. Sean will compare
four versions and choose.

## What Sean said (the founder, on desktop)
"It looks too busy, and I don't know that that's a navigation at the top... I don't want to click anything. It doesn't look inviting.
The where Theo is, it looks compact and nice, but I don't think I would click on it... The desktop, it looks organized, but..."
Earlier on the same pages: "I don't like how the guides are sitting at the top. It looks jumbled and broken."

## What five visitors said (user panel, 2026-11-18)
- (5/5) The main orange button on the front door says "Become a Founder"; nobody knows what that means. They want "Start here" or
  "Find Vegan food near me".
- (4/5) Too busy: competing buttons (the Airport front page has three before any airport; "Read more", "See what is inside", "Open"
  everywhere), the Guide's speech line repeats the paragraph above it, long opening paragraphs.
- (4/5) Phone: the bottom bar's round Menu button covers the main button; the Guide's line is cut off with "..."; the site header plus
  the pink Guide bar fill a third of the first screen.
- (3/5) The navigation is hidden: a "Contents" dropdown at top right; "Part 1 of 11" says there is more but not what. Show the parts.
- (3/5) The basics are locked (Protein, Iron, Calcium say "Locked"); "$11 or 1,100 points" is never explained.
- (3/5) Who a Guide is for is unclear (the Pre-Vegan Restaurant and Vegan Events Guides are for owners and hosts, not diners).
- (2/5) Real things first (places, nutrients, airports) above the character and the "how to use" box.
- Liked: big headlines, the drawn Guides, the airport cards (code, item count, "Checked" date), search with Near me, the medical note.
- 4 of 5 said desktop worked better than phone; Sean felt the phone was a little better.

## What to design (real content, two views, desktop 1440 and phone 390)
Build `/home/user/vegansexplore-com/mocks/guide-panel2/<letter>/index.html` showing, switchable with `?view=` (default handbook):
1. `?view=handbook`: the **Nutrition Guide**, its front page AND how a visitor moves to a part (show the Nutrients part too, as a
   second state, e.g. `?view=handbook&part=nutrients`). Real content: read `guide-scripts/nutrition-guide.js` and
   `guides/nutrition-guide.html` (parts, Theo's lines, the eight nutrients, B12 free, the rest with the full Guide: "$11 or 1,100
   points"; points are earned on the site, e.g. 250 for the free survey). Theo's picture: `/public/guides/nutrition/` or the page's
   `NPIC` path in the script; `VEGuideArt('theo','square')` gives the square. Never cut his head.
2. `?view=finder`: the **Airport Guide**'s "Choose your airport" part. Real content: `guide-scripts/airport-guide.js` and the live
   page https://vegansexplore.com/guides/airport-guide#/airports (16 airports, 154 Vegan items, Fort Lauderdale-Hollywood free to
   try; the airport pictures are in the live page; Nori is the Guide).
Show in each view how a visitor sees ALL the Guide's parts and moves between them, who the Guide is for, the ONE main action, how
locked content and the price are explained in one plain line, and where the Guide (Theo or Nori) sits so people actually want to
press Play. Also show, in a small note on the page, what the Welcome Guide's main button would say in your design.

## Brand rules (hard)
Link `/public/ve-kit.css` and build from its parts (`k-` classes and tokens). Color Block look: ink outlines, solid offset shadows,
the seven-band stripe, Guides section pink (#FF9EC4, deep pink #C2185B for pink text), white page. ONE orange action per view.
Buttons, tabs and inputs 6px corners, never pills; dropdowns without the browser arrow. Full width (no fixed page max-width; a reading
line may keep its own width). Nothing scrolls inside its own box. More than 5 tabs: the site's rule is a dropdown, but you may show the
parts as a visible list or sliding row if that is your direction (say why). On phones, tiles and rows keep the desktop layout: picture
or number left, text middle, buttons and tags right. Never em-dashes; "Vegan" capitalized; title case for titles; no words on
pictures; no face cut by a frame. The site nav (`<script src="/public/nav.js"></script>` first in body) and footer
(`<script src="/public/footer.js"></script>` before </body>) stay; remember the phone bottom bar (about 70 px, with a round Menu
button in the middle) sits over the page bottom. `<html lang="en" data-kit-parent="welcome-guide">`, `<meta name="robots"
content="noindex,nofollow">`, a real `<title>`, a peach "Mock" strip naming your option. Static HTML, inline CSS/JS only, no libraries.

## Deliver
1. Your file only. Check it with Playwright (`require('playwright')`, `chromium.launch()`), serving your file via `page.route` in place
   of `https://vegansexplore.com/mocks/guide-panel2/<letter>/` so nav, footer, kit and pictures load live. Screenshot first screen and
   full page at 1440x900 and with `devices['iPhone 13']` for `?view=handbook`, `?view=handbook&part=nutrients` and `?view=finder`, into
   `/tmp/claude-0/panel2/<letter>-<view>-<desktop|phone>-<first|full>.png`. Confirm: no horizontal scroll, one orange action per view,
   on the phone the title and the main action above the bottom bar (about 770 px on iPhone 13), no console errors. Fix once if needed.
2. Do NOT run git, deploy or change any other file.
3. Reply in under 250 words: your direction's name, the idea in one sentence, how navigation works, where the Guide sits, how locked
   content is explained, the Welcome button text, and which of the panel's complaints you fixed and how.
