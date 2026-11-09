# History: app

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## The Vegans Explore app (LOCKED by Sean 2026-11-07, playbook `ve-mobile-app`, canon `canon-ve-mobile-app`)

"Most people would be expecting Vegans Explore to be an app... I want it available as soon as it's available." Name **Vegans Explore**, made by
**LESARUSS Inc.**, in the stores as soon as it passes review (no held date). A **native app written fresh** in React Native (Expo) in
`lesaruss/vegansexplore-app`, not the website in a container; the June prototype (code name Sapphire, Supabase Auth, made-up stats) is retired.
Version 1 tabs: Home, Explore (search, Directory, place pages, map), Events, Saves, Profile; join through the Explorer survey with the same
account as the website (ve-auth, never Supabase Auth); Guides, Pulse articles and the board, policies and the business dashboard open as web
pages inside the app, signed in. One back end: the app calls the same edge functions as the site. iOS keeps bundle `com.lesaruss.sapphire`
(the existing App Store record VEGANS EXPLORE, app 6776554626; Apple never lets it change); Android is `com.lesaruss.vegansexplore`. Store keys
are in Key Room (`hq.lesaruss.ai/keys`: `ASC_API_KEY_P8` saved without its BEGIN/END lines, `ASC_KEY_ID`, `ASC_ISSUER_ID`,
`GOOGLE_PLAY_SERVICE_JSON`, `EXPO_TOKEN` for Expo user `lesaruss`), all checked live 2026-11-07. The A to Z is in the playbook and
`docs/handoff/2026-11-07-ve-mobile-app-a-to-z-locked.md`; next are D (installable website: `manifest.json` icons 404 today), E (icon to Sean)
and F (a clickable phone mock approved before any app code). Store rules to build: delete account inside the app, block a member, nothing
sold inside the app in v1. The old SoFlo Vegans iOS app (`com.lmg.soflo`, live since 2021) comes off sale on launch day unless Sean says otherwise.

**D, the installable website, built 2026-11-07** (Logan; playbook `ve-mobile-app`): `manifest.json` (green `#2D5C27`, name Vegans Explore,
`start_url` `/?source=homescreen`, shortcuts Directory, Events, Daily Pulse) with real icons in `public/app/` (`icon-192.png`, `icon-512.png`,
`icon-maskable-512.png`, `apple-touch-icon.png`, `favicon-32.png`; and `/favicon.ico`), all drawn from `public/ve-logo-mark.svg`, never redrawn.
`nav.js` adds the manifest, theme color, Apple and icon tags to every page (our hosts only, never under `VE_BRAND`), registers `/sw.js` and on
phones loads `/public/ve-install.js`. **`sw.js`** (replacing a June shell that only the archived homepage registered): page loads go to the network
first; offline it shows the last copy of that page it kept (30 pages) or `/offline.html`; never /admin/, /api/, /go/, /auth/, POSTs or other
sites; bump `VERSION` on a change. `vercel.json` serves `/sw.js` uncached. **Add to home screen** (`ve-install.js`): from the 3rd page a visitor
opens, not again for 30 days after Not now, never once installed, in a frame, an in-app browser or on a form or checkout; Android's own install
window, iPhone Safari's two Share steps, otherwise the browser menu steps; `?install=1` shows it on any page; GA events `install_prompt_shown`,
`install_prompt_accepted`, `install_prompt_dismissed`, `app_installed`. Checked locally in Chromium as a Pixel 7 and an iPhone 14 (manifest and
icons 200, the worker active, a visited page served offline and an unvisited one showing the offline page, no script errors). The website icon is
the plain suitcase mark; the app's own icon is step E and may replace it once Sean picks.
**E and F sent to Sean 2026-11-07** on one canvas, https://claude.ai/artifact/D52VjPJvNiWXafBXZbvhCp: icon A (white suitcase on our
green, recommended), B (green on white), C (the leaf mosaic); opening screen 1 (green with the white mark, recommended) or 2 (the logo on
white); and one clickable phone with every v1 screen, using real listings and events. No app code until Sean picks and approves.
**E decided by Sean 2026-11-07**: the app icon is **A**, the white suitcase mark on our green (B, green on white, stays on file; **the leaf
mosaic suitcase `public/ve-mark.png` is the old logo and is retired**: never use it again). The website's icons in `public/app/` are A since the
same day. The opening screen is **the stacked (portrait) logo on white**: `public/logo-ve-portrait-v1.svg` (Sean's file; the suitcase over
VEGANS in black and EXPLORE in green), with `public/logo-ve-portrait-v1-inverted.svg` (all white, the leaf green, no background) kept on file
for green or dark backgrounds. **F approved by Sean 2026-11-07** ("I approved the look. We can always make adjustments later"), after six rounds on the canvas: tabs
**Home, Explore, Menu (raised center button: every feature, built-in or the website's page inside the app), Saves, Profile**; Bounties and
Events live in the Menu; Profile is the profile survey (every question we want answered, % complete, points per answer) with collectible
badge stamps and a + that lists the Guides that earn each badge; an Admin group in the Menu for super admins (the Depot signed in; BrandDesk
on HQ asks for the HQ sign-in the first time); fixed headers with only the list scrolling; anything opened fills the screen with a back button
naming where you came from. **The app reuses the website's Directory card and listing page design, never a new style.** First visit: the
opening screen, a short welcome, pick your chapter or use location, then Home with no account (Apple forbids forced sign-up); voting, saving,
checking in, Saves and Profile ask to join free through the Explorer survey. **One Expo build serves the stores and vegansexplore.com on
phones** (the homepage and the home-screen icon; pages people land on from search keep their own page; computers keep the website).
**D merged and live 2026-11-08** (main 1663862; the worker keeps `/offline`, since the site's clean addresses redirect `/offline.html` and a worker
cannot serve a redirected page: `sw.js` v2). **G built 2026-11-08** on `lesaruss/vegansexplore-app` branch `claude/great-rubin-yc6ey5` (not on its
main): Sapphire removed, a fresh Expo SDK 58 app (Expo Router, tabs Home, Explore, Menu, Saves, Profile), live listings, ve-auth session storage, icon
A and the stacked-logo opening screen; its own CLAUDE.md has the rules. This build session cannot reach docs.expo.dev or api.expo.dev, so builds and
submissions (V, X) run from GitHub Actions in the app repo with `EXPO_TOKEN`. **Joining is survey first** (Sean, 2026-11-07: "they do the guide and
then they get the account"): the Explorer survey, a points pill adding up in the corner, then save with Apple, Google or email, which makes the
account; the website changes to match in step H (today `/survey` needs an account first). Next: H.
**Wrapped 2026-11-08 before H started** (handoff `docs/handoff/2026-11-08-ve-mobile-app-d-live-g-built-h-next.md`): H is next, starting with ve-auth taking native Apple and Google sign-in.
**H built 2026-11-08 (join and sign in; handoff `docs/handoff/2026-11-08-ve-mobile-app-h-join-sign-in.md`)**. **ve-auth** (from e4eece1, sha256 391f409a matched) takes
`action: 'apple'` (`identity_token`, raw `nonce`, `name`): RS256 checked against Apple's published keys, issuer, audience `com.lesaruss.sapphire` (plus env
`APPLE_AUDIENCES`), expiry and the nonce's SHA-256; `members.apple_id`; Apple sends the email only the first time (`apple_email_missing` otherwise). Google now
checks an audience list (the website's client plus env `GOOGLE_NATIVE_CLIENT_IDS`), the issuer and `email_verified`. Both share one branch (find by id, link by
email, else a new account waiting on its survey). **ve-mission-survey** (same commit, sha256 72fc6f0b) answers `survey_get` with no token, and `survey_submit_all`
{survey, answers} saves every answer through `ve_survey_answer` in order (a refused value is listed in `skipped`, never fatal; the last result says completed,
admitted). **The website**: `/survey?s=<slug>` for a survey that admits works before an account (`public/ve-guide-survey.js`: answers in `localStorage`
`ve_survey_draft_<slug>`, a points pill, then **Save your answers**, which opens the site's sign-up window with `VE_ACTIVATE_HANDLER` set so the new account
saves the answers instead of seeing the join window again); a survey that does not admit still asks for the account first; the eyebrow reads Join free.
**The app** (branch `claude/great-rubin-yc6ey5`, f7104d3): `/join` (the survey, the pill, Save your answers with Apple, Google or email), `/signin`, Vote, Save,
Check in, Saves and Profile ask a visitor to join. Proven: Apple's check on 8 cases with the function's own code and a local key (valid, no email, wrong audience,
issuer, expired, wrong nonce, unknown key, tampered: only the valid ones pass), the live survey read with no token, a live [TEST] account saving 8 answers (a bad
value skipped) then admitted on the last (205 points, Founding, entry via survey; removed), the website and the app web build at phone size against the live
questions. **Not proven**: a real Apple or Google token end to end (needs a device build; Google on iOS and Android also needs OAuth clients made in the Google
Cloud project and their IDs in the app and `GOOGLE_NATIVE_CLIENT_IDS`), Check in in the app (step J).
**I and J built 2026-11-08** (app branch `claude/great-rubin-yc6ey5`, e15db33; handoff `docs/handoff/2026-11-08-ve-mobile-app-i-j-home-place-checkin.md`): Home with a
chapter picker and live content (most voted 100% Vegan food places, coming events, join or profile card, a Guide, the Pulse; chapters generated from
`public/ve-hubs.js` by the app's `scripts/gen-chapters.mjs`, so a chapter change here means running it again there), and the place page copied from
`directory/listing.html` with Vote, Save and **Check in** against the phone's position through `ve-checkin`, then the check-in menu (photos, post,
shout-out, bounties). Proven live at phone size; a real check-in as the Vegans Explore Logan test account (8 m, +10, shout-out and photo) was made and
removed through `ve-once-app-checkin` (now 410). **V** is `.github/workflows/eas-build.yml` in the app repo; GitHub runs it only from the default branch,
so it waits on Sean merging the app branch and adding its six secrets from Key Room.
**Merged 2026-11-08** (Sean: "merge"): app main 2268abe carries the new app and the workflow (the branch had its own history, so main keeps Sapphire's history and its tree is the branch). V now waits only on the six Actions secrets.
