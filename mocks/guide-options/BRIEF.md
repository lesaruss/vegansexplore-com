# Design panel brief: four options for the Vegans Explore Guide page

Sean, 2026-11-16: "I'm also not married to the way we have the guides either... if it's distracting... I really want this to be designed
fully optimized. Let's do what's the best practice... a panel of design experts that are actually going to give us mock ups of 4 different
options that I can choose from using our branding guideline style." Then: "yes, run the four-option design panel".

The option Sean picks becomes the shared frame for all 17 Guides (`/public/ve-guide-frame.css`), so design the **pattern**, shown on one
real page: the Holiday Guide's New Year's Eve page.

## Who the page serves (from two audience panels, 2026-11-16)
- A Pre-Vegan planning New Year's Eve with mixed friends, on a phone, in a spare minute: where to go, food everyone will enjoy.
- A long-time Vegan local: real events and special menus, real community, no padding.
- A chain's marketing director arriving from our email: their brand shown well, how to update a menu or add an event.
- A non-Vegan parent from a phone search: where to order, by when, near me; fast and plain.
Their hard lessons: on a phone the page title and its one main action must be on the first screen (390 x 844, above the site's fixed
bottom bar, about 760 px); one way to get around (not two menus plus a pager); never repeat a business (one card per chain); honest
empty states, never padding; the page scrolls as a page (nothing scrolls inside its own box); the Guide (Theo) appears once.

## Real content to use (all true today)
- Guide: **The Holiday Guide**, free for everyone ("Free for everyone. Join free", "Member? Sign in").
- Holidays and parts: Overview · ThanksLiving, November 26 · Hanukkah, begins December 4 · Christmas, December 25 · **New Year's Eve,
  December 31** · Give Back · 11 Days of Giving, December 1 to 11 · For Businesses.
- New Year's Eve: 45 days to go. Line: "Where to ring in the new year, and food everyone at your table can eat."
- Events on December 31: **none posted yet**. Honest empty state: "No New Year's Eve parties posted yet. Hosting a dinner, a party or a
  countdown? Add it and people near you will find it." Links: Add your event `/events#submit/1`, the whole calendar `/events`.
- Menus: one business. **Next Level Veggie Grill**, 100% Vegan, **19 locations**, pickup December 26, 27, 31 and January 1. "The Holiday
  Feast: comfort food for 6 to 8 guests, ordered as a full Feast, gluten free, with dessert added, or a la carte." Logo:
  `https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/listings/next-level-veggie-grill/logo-2026-10-28-d0b8ba12.jpg`
  (the logo links to `/directory/next-level-veggie-grill-tustin`). Near me: `/guides/holiday-guide#/ny-menus/near`. Menu: `/guides/holiday-guide#/ny-menus`.
- Coming in December (tag "Coming"): **Your first Vegan year** (starting the new year plant-based: simple first steps) and **The year in
  review** (the top moments of the year in the Vegan movement; vote for the one that mattered most).
- For businesses: "Run a Vegan business? Add your New Year's Eve menu or event. It's free for members." Send your menu
  `/guides/holiday-guide#/business`, Add your event `/events#submit/1`.
- The Guide: **Theo**, "your Guide for the holidays", a drawn character (Seasoned Vegan). His line for this page (recorded):
  "Ringing in the new year? On this page are the Vegan places cooking for New Year's Eve and the parties to ring it in."
  Audio: `https://fwbhwfxpncrsfhttimna.supabase.co/storage/v1/object/public/vegan-media/media/voices/holiday-guide/theo-new-years-eve-v1.mp3`
  (plays only when pressed). Pictures (4:5, 1080 x 1350, his head near the top: frame from the top, never crop his head):
  `/public/guides/holiday/theo-new-years-eve.jpg` (toasting at a party), `/public/guides/holiday/theo-ny-menus.jpg` (picking up a feast),
  `/public/guides/holiday/theo-ny-events.jpg` (fireworks with friends). Square crops of these are fine if framed from the top.
  Other holidays' Theo pictures exist at `/public/guides/holiday/theo-christmas.jpg`, `theo-hanukkah.jpg`, `theo-thanksliving.jpg`.

## Brand rules (hard; read `/home/user/vegansexplore-com/public/ve-kit.css` header and `/home/user/vegansexplore-com/mocks/guide-page/index.html`)
- Link `/public/ve-kit.css` and build from its parts (`k-` classes and tokens: `--k-dk --k-md --k-br --k-tint --k-or --k-peach --k-pink
  --k-pinkt --k-pinkd --k-ink`). Color Block look: ink outlines, solid offset shadows, the seven-band stripe, Guides section pink.
- **One orange action button per view** (`.k-btn.k-cta`). Buttons, tabs, inputs: 6px corners, never pills. Dropdowns: no browser arrow
  (copy `.k-select`).
- Full width (no fixed max-width page container; a reading line may keep its own width). Nothing scrolls inside its own box.
- Never use em-dashes. "Vegan" always capitalized. Titles in title case. Third person about businesses.
- No text, logo or card over a face; no head or face cut by a frame.
- The page starts with `<script src="/public/nav.js"></script>` first in `<body>` and ends with `<script src="/public/footer.js"></script>`
  before `</body>`. `<html lang="en" data-kit-parent="welcome-guide">`, `<meta name="robots" content="noindex,nofollow">`, a real `<title>`.
- A visible **Mock** strip at the top (peach, like `/mocks/guide-page/`), naming your option, e.g. "Mock, option B: App-like. Real content,
  nothing here is live."
- Static HTML and inline CSS/JS only. No new libraries. Play Theo plays the audio only when pressed.

## What to deliver
1. `/home/user/vegansexplore-com/mocks/guide-options/<letter>/index.html` (your letter only).
2. Show **how a visitor moves between holidays and between a holiday's parts** in your option (the pattern every Guide will use), and
   the phone layout (390 px) as carefully as desktop (1440 px).
3. Check it yourself with Playwright (`require('playwright')`, `chromium.launch()`), serving your file through `page.route` in place of
   `https://vegansexplore.com/mocks/guide-options/<letter>/` so nav.js, footer.js and pictures load from the live site. Screenshot the
   first screen at 1440 x 900 and 390 x 844 and the full page at both, saved in `/tmp/claude-0/options/<letter>-*.png`. Confirm: no
   horizontal scroll, the title and the one orange action above 760 px on the phone, no console errors. Fix and re-check once if needed.
4. Do **not** run git, deploy, change any other file, or touch the live site.
5. Reply in under 250 words: the option's name, its one-sentence idea, how navigation works, how Theo appears, what you'd measure, and
   the measured phone positions (title bottom, action bottom).
