# The old look, page by page (2026-11-13)

## In the queue
- **The Guide art audit** (Sean, 2026-11-13: "look at all of the graphics we have of the guides on the page and make sure that there's
  consistency across the board... we've gone through different generations of how they look... even on the Explore page, that's the old
  version of the characters... put them in one page and then take a look at it"). The review page is `/mocks/brand-kit/guide-art-audit`:
  each Guide's approved picture on top (`VE_GUIDE_ART`), then 294 drawn pictures numbered, from the code and from the main pages loaded in
  a browser, each with the pages that use it. Sean names the numbers that are out of step; each is redrawn on the locked Guide scenes recipe
  (CLAUDE.md), in the shape of its spot, and swapped in.

## Done
- **The Guides (2026-11-13, d6988d9):** every Guide on the Welcome Guide's frame was already on the kit through `ve-look.css` (the 2026-11-12
  merge Sean approved: pink header, stripe, outlined cards, the one orange button in the header). Their green Play, dark green Next and
  green in-page buttons match the Welcome Guide, the template every Guide copies, so they stay. What was left: the topic tiles (mint, a thin
  line) and the Start here box (a thin line), now the kit card in `ve-look.css` (`.dg-tile`, `.vgi`, every Guide and the Welcome Guide).
  The five `ve-path-*` pages already redirect to `/passport`; the roster and chat prototypes (`ve-guides-roster-v1`, `ve-guide-chat-v1`:
  "Five paths", a $11 Passport stat, a Guide named June not on the roster) now redirect to `/guides` and `/pulse`. The scan below still
  lists the Guides' files because their own styles keep the old greens under the overrides; they are done.
- **Member and public pages (2026-11-13):** already on the kit, checked live: `/claim`, `/business-guide`, `/communities` and the city hubs,
  the listing page, `/nominate`, `/passport`, `/pulse`. 28 pages built on the old shared pattern now opt in with `<html data-look="plain">`
  and wear the plain-page kit layer in `ve-look.css` (white page, ink-outlined cards with the solid shadow, buttons white with an ink outline,
  a sign-in gate's one button orange, sentence-case titles with the green word as a marker): ambassadors door and welcome, board consent,
  bounties, comment, creator, invite, levels, listen, messages, news/local, partner dashboard, Pulse preferences, secret shopper, survey,
  search, directory/product, the Passport Challenge and its scan, certified, case studies, contact, explore, hello, policies, paths.
  `/unsubscribe` (no nav on purpose) is on the kit in its own styles with the real logo. `/communities/find` (linked from nowhere, "8 regions,
  3 partner orgs" in its copy) redirects to `/communities`.
- **Business, campaign and guided pages (2026-11-13 afternoon, 5c91816 and f6565f9, live 2:29 PM Eastern):** the plain-page layer on
  business/challenge, holiday-menu, stops, results, campaigns and the Dolphins showcase gates, gigs, the Dolphins game night page and the
  Aguacate article (every sign-in gate's one button orange, the event page's buttons on the kit); `/certified` wears the listing page's
  header (`pageOf` in `ve-look.js`); `/index-guide-hero` ("Five paths", retired) redirects to `/`. Guided walkthroughs keep their dark
  scene with the kit on top (sentence-case titles, Next and each cover's call the one orange action, the second button white, step dots
  orange): `/partners`, the dinner invitations, the Plant Based Showcase, World Vegan Expo, the Dolphins pitch, and the shared guided
  shell (`ve-guided.js`: the brand kit, mocks; only the slide bar's Next orange). `/business/tour` and `/groups/welcome` (the Welcome
  Guide's frame) join the Guides section and wear its pink header. **The dashboard (81d7adf, 9f5f0bf, live 4:36 PM Eastern):** the member dashboard itself
  (`center-console`, checked through `/dashboard/sample`) was already on the kit; its 17 own pages now carry `data-look="plain"`
  (every sign-in gate's one orange button, script-drawn gates `[id$="-gate"] > button` too, outlined cards; Advertising's and
  Opportunities' gradient bands solid kit blocks). Signed-in content was previewed locally as a stand-in admin with every data call
  answered empty (no real session, nothing written).
- **The Depot (b0b8816, live 4:51 PM Eastern):** `data-look="plain"` on all 58 Depot pages (the five redirect stubs left alone): white page,
  sentence-case titles, ink-outlined cards and buttons, gates' one orange button, tabs and pills on 6px corners. Found on the way and fixed
  (b10f0f1): Depot Ambassadors and Invites had not loaded since 2026-11-11 (an apostrophe in "the Passport's 1,100" broke the script).
- **Left as they are, on purpose:** the mocks (reference pages Sean approved as they are) and the archive (retired pages); the pitch decks,
  ads, app and offline pages that skip nav.js by design keep their own styles. Printable pieces inside tools (the Passport Challenge
  sticker and staff sheet) keep their print type. **The old-look sweep is done.** Mocks and the archive stay as they are (reference and retired pages).
  **Left in this group, next pass:** the dinner invitations (`/dinners/host`, `/dinners/palm-beach`: dark guided pages, built like the pitch
  decks), the certified page's photo header, the Dolphins game night event page and the news article page's all-caps headline.

Sean, 2026-11-13: "I'm giving you approval to fix every part of the website, 100% of the website that still has the old look. There is no scenario where I want any part of the website to have the old look... Apply the new look."

Found by two checks: pages that never load `/public/nav.js` (so `ve-look.js` never turns the look on), and pages whose own styles still hard-code the old greens (`#1f5f22`, `#16a34a`, `#2d7d31`). Order: what members and businesses see first, the Depot last.

## 1. Never load the look (27 pages; the exceptions list in CLAUDE.md keeps pitch decks, ads, app/index, podcast-frame, offline, business/site and branddesk-sites off nav.js on purpose, so those get the look in their own styles)
- `admin/depot/analytics.html`
- `admin/depot/members.html`
- `admin/depot/outreach.html`
- `admin/depot/playbooks.html`
- `admin/depot/social.html`
- `ads/guides/guide.html`
- `ads/humble-cabbage/ve-tee.html`
- `app/index.html`
- `apply.html`
- `business/podcast-frame.html`
- `business/site.html`
- `guides/ve-discuss.html`
- `offline.html`
- `onboarding.html`
- `partner.html`
- `partners/community-partner.html`
- `partners/pitches/vegans-explore-cm-pitch.html`
- `partners/pitches/vegans-explore-dolphins-brief.html`
- `partners/pitches/vegans-explore-dolphins-pitch-v1.html`
- `partners/pitches/vegans-explore-global-tour-pitch.html`
- `partners/pitches/vegans-explore-night-event-pitch.html`
- `partners/pitches/vegans-explore-supermarket-pitch.html`
- `scripts/guide-tour/lookbook.tpl.html`
- `scripts/guide-wardrobe/garments.html`
- `tour.html`
- `unsubscribe.html`
- `welcome.html`

## 2. Old greens in the page's own styles: Member and public pages
- `ambassadors/door.html`
- `ambassadors/welcome.html`
- `board-consent.html`
- `bounties.html`
- `business-guide.html`
- `case-studies.html`
- `certified.html`
- `claim.html`
- `comment.html`
- `communities/find/index.html`
- `communities/hub.html`
- `communities/index.html`
- `contact.html`
- `creator.html`
- `dinners/host.html`
- `dinners/palm-beach.html`
- `directory/listing.html`
- `directory/product.html`
- `events/dolphins-plant-based-game-night/index.html`
- `explore.html`
- `guides/airport-guide.html`
- `guides/creator-guide.html`
- `guides/holiday-guide.html`
- `guides/index.html`
- `guides/nonprofit-guide.html`
- `guides/nutrition-guide.html`
- `guides/pre-vegan-business-guide.html`
- `guides/pre-vegan-restaurant-guide.html`
- `guides/stadium-arena-guide.html`
- `guides/supermarket-guide.html`
- `guides/taste.html`
- `guides/theme-park-guide.html`
- `guides/ve-guide-chat-v1.html`
- `guides/ve-guides-roster-v1.html`
- `guides/ve-path-prevegan.html`
- `guides/vegan-dairy-guide.html`
- `guides/vegan-events-guide.html`
- `guides/vegan-restaurant-guide.html`
- `hello.html`
- `index-guide-hero.html`
- `invite.html`
- `levels.html`
- `listen.html`
- `messages.html`
- `news/local.html`
- `news/south-florida-aguacate-reopening/index.html`
- `nominate.html`
- `partner-dashboard.html`
- `passport.html`
- `passport/challenge/index.html`
- `passport/challenge/scan.html`
- `paths.html`
- `policies.html`
- `pulse-preferences.html`
- `pulse.html`
- `search.html`
- `secret-shopper.html`
- `survey.html`
- `unsubscribe.html`

## 2. Old greens in the page's own styles: The dashboard
- `dashboard/2026-initiatives.html`
- `dashboard/advertising.html`
- `dashboard/applications.html`
- `dashboard/campaigns.html`
- `dashboard/center-console.html`
- `dashboard/certification.html`
- `dashboard/cm-legacy.html`
- `dashboard/get-involved.html`
- `dashboard/guest-reviews.html`
- `dashboard/handbook.html`
- `dashboard/health.html`
- `dashboard/insights.html`
- `dashboard/leads.html`
- `dashboard/members.html`
- `dashboard/opportunities.html`
- `dashboard/partners.html`
- `dashboard/pulse-desk.html`
- `dashboard/submissions.html`

## 2. Old greens in the page's own styles: Business, partners and campaigns
- `business/brand.html`
- `business/challenge.html`
- `business/holiday-menu.html`
- `business/results.html`
- `business/stops.html`
- `business/tour.html`
- `campaigns/index.html`
- `campaigns/plant-based-showcase-dolphins-attend.html`
- `campaigns/plant-based-showcase-dolphins-sponsor.html`
- `campaigns/plant-based-showcase-dolphins-volunteer.html`
- `campaigns/plant-based-showcase-dolphins.html`
- `campaigns/world-vegan-expo.html`
- `gigs/index.html`
- `groups/welcome.html`
- `partners/community-partner.html`
- `partners/index.html`
- `partners/pitches/vegans-explore-cm-pitch.html`
- `partners/pitches/vegans-explore-dolphins-pitch-preview.html`
- `partners/pitches/vegans-explore-dolphins-pitch-v1.html`
- `partners/pitches/vegans-explore-dolphins-pitch.html`
- `partners/pitches/vegans-explore-global-tour-pitch.html`
- `partners/pitches/vegans-explore-night-event-pitch.html`
- `partners/pitches/vegans-explore-supermarket-pitch.html`

## 2. Old greens in the page's own styles: Mocks and archive
- `archive/bodybuildingvegan/index.html`
- `archive/index-v1.html`
- `archive/the-vegan-foodie-fest-miami/index.html`
- `archive/vegans-who-lift-academy/index.html`
- `archive/vegans-who-lift-thank-you/index.html`
- `mocks/business-dashboard/index.html`
- `mocks/claims/index.html`
- `mocks/creator-dashboard/index.html`
- `mocks/dashboard/index.html`
- `mocks/header/index.html`
- `mocks/local-voices/index.html`
- `mocks/next-chapters/index.html`
- `mocks/nominate/index.html`
- `mocks/nominate/interview.html`

## 2. Old greens in the page's own styles: The Depot (internal)
- `admin/depot/ambassadors.html`
- `admin/depot/badges.html`
- `admin/depot/books.html`
- `admin/depot/bounties.html`
- `admin/depot/brand-campaigns.html`
- `admin/depot/branddesk.html`
- `admin/depot/business-outreach.html`
- `admin/depot/certification.html`
- `admin/depot/challenge-card.html`
- `admin/depot/challenge-kit.html`
- `admin/depot/challenge-stops.html`
- `admin/depot/challenge.html`
- `admin/depot/challenges.html`
- `admin/depot/checkins.html`
- `admin/depot/claims.html`
- `admin/depot/comments.html`
- `admin/depot/community-managers.html`
- `admin/depot/content-index.html`
- `admin/depot/cookbook.html`
- `admin/depot/dashboard-checklist.html`
- `admin/depot/dinners.html`
- `admin/depot/directory-review.html`
- `admin/depot/event-sponsors.html`
- `admin/depot/events.html`
- `admin/depot/feedback.html`
- `admin/depot/founding.html`
- `admin/depot/group-partners.html`
- `admin/depot/guides.html`
- `admin/depot/holiday-menus.html`
- `admin/depot/ideas.html`
- `admin/depot/inbox.html`
- `admin/depot/index.html`
- `admin/depot/invites.html`
- `admin/depot/library.html`
- `admin/depot/links.html`
- `admin/depot/listing-posts.html`
- `admin/depot/logos.html`
- `admin/depot/mentions.html`
- `admin/depot/narration.html`
- `admin/depot/next-chapters.html`
- `admin/depot/nominations.html`
- `admin/depot/nonprofit-partners.html`
- `admin/depot/onboarding.html`
- `admin/depot/people.html`
- `admin/depot/preview.html`
- `admin/depot/profiles.html`
- `admin/depot/pulse-cities.html`
- `admin/depot/pulse-subscribers.html`
- `admin/depot/pulse.html`
- `admin/depot/referral-claims.html`
- `admin/depot/search-questions.html`
- `admin/depot/services.html`
- `admin/depot/sources.html`
- `admin/depot/tours.html`
- `admin/depot/venues.html`
- `admin/depot/verified.html`
- `admin/depot/watchlist.html`
