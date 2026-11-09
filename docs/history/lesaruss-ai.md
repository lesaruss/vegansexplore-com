# History: lesaruss-ai

Moved verbatim from CLAUDE.md on 2026-11-09 (canon `canon-session-procedure`). Add new history for this area here, not in CLAUDE.md.

## One framework for every brand: LESARUSS.ai (Sean, 2026-10-29)

"If we make an update in Vegans Explore and the look and feel and the functionality, it needs to match LESARUSS.ai. So we're
using one framework throughout all of them. What changes is just maybe the color and the look and feel of it." The LESARUSS.ai
Directory is this site's Directory: lesaruss.ai (lesaruss/lesaruss-ai-site `next.config.ts`) proxies `/public/*`,
`/directory/<slug>`, `/claim`, `/communities/*` and `/directory/logos/*` here, and its `/directory` page mounts
`ve-region-directory.js` and `ve-city-banner.js`. A change to those files, `directory/listing.html` or `claim.html` shows on
both sites, so check a change on both (`?brand=lesaruss` turns brand mode on here for the visit, `?brand=ve` off).

- **`/public/ve-brand.js`** is the brand, loaded first in `<head>` of the listing page and `claim.html`. On lesaruss.ai (and
  `lesaruss-ai-site*.vercel.app` previews) it sets `window.VE_BRAND`: its sections (`sections`, `sectionOf`), which listings are
  its own (`ownsListing`: tags `lesaruss-ai-directory`, `-candidate`, `-business-member`, and category Studios), its Passport and
  sign-in links, its vote window words (`gates`), its claim settings (`claimApi`, HQ's `/api/claim`; `applyUrl`, `claimTicks`,
  `claimNext`) and its colors. On vegansexplore.com it does nothing.
- **Colors** are CSS variables with our values as the fallback: `--ve-green*` on the pages and `--vb-*` in the shared components
  and the listing page (`--vb-accent`, `--vb-accent-ink`, `--vb-go`, `--vb-go-hover`, `--vb-soft`, `--vb-line`, `--vb-deep`...).
  A new green in these files goes through a variable, never a bare hex, or LESARUSS.ai wears it.
- **Header and footer**: `nav.js` and `footer.js` hand over to `VE_BRAND.drawNav()` / `drawFooter()`; `analytics.js` skips
  lesaruss.ai.
- **The listing page** (`VB` in `directory/listing.html`): a listing that is not the brand's opens on vegansexplore.com; the
  breadcrumb uses the brand's sections; no How Vegan, check-ins, points or billboard; the claim link and vote box are the brand's.
- **`claim.html`** (`VB`): Claim your listing, the same steps and cards, the brand's listings only, no How Vegan or Vegans Explore
  account, one way to join (the $11 LESARUSS Passport through HQ `/api/claim`, which records the claim for Depot > Claims), and
  Add your business goes to HQ's business application.
- **The Directory component** takes `config.brand` (`sections`, `catMap`, `include`, `trust: false`, `vegan: false`,
  `listingBase`); `ve-votes.js` sends a signed-out vote to the brand's window.
- **Votes on lesaruss.ai** (Sean, 2026-10-29: "Go ahead with the voting next"; migration `20261029_lesaruss_ai_votes.sql`). A
  signed-out Vote opens Voting is for LESARUSS members (`VE_BRAND.gates.vote`): **Become a Diplomat** (`/join`) and **Sign in with
  LESARUSS** (`VE_BRAND.signIn` 'lesaruss': `data-ve-lesaruss`, so `ve-auth.js` starts Continue with LESARUSS as the client
  `VE_BRAND.ssoClient` 'lesaruss-ai', a `lesaruss_sso_clients` row HQ's `/connect` names). It lands on `/auth/lesaruss` (this
  page, proxied, branded), and `ve-lesaruss-sso` with `client: 'lesaruss-ai'` lets in only a LESARUSS member (`lr_member_entitled`:
  a Diplomat, a `brand_memberships` 'lesaruss-ai' passport, which HQ records when a claim's $11 is paid, or a super admin), makes
  no account, refuses anyone else with `membership_needed`, and signs a token with `brand: 'lesaruss-ai'`. `ve-votes` takes such a
  token only for a listing in the LESARUSS.ai Directory (`lr_listing_in_directory`) and only while `lr_member_entitled`, counts it
  in the same pool (`listing_daily_votes`, once a day per listing), and refuses its `contribute` (points are ours). A Vegans Explore
  Passport alone does not vote there (each community is its own $11); a Diplomat votes on both. **The $11 LESARUSS Passport on its own** (Sean, 2026-10-29: "Build the $11 LESARUSS Passport checkout"): the members window's
  button (`VE_BRAND.passportUrl` `/passport`, with `?from=` and `?back=`) opens lesaruss.ai/passport (lesaruss-ai-site `app/passport`),
  which pays through HQ `/api/passport` (`lib/passportCheckout.ts`, table `lr_passport_checkouts`, migration 060) and, once Stripe says
  paid, records `brand_memberships` 'lesaruss-ai' passport (source `passport_checkout`) on the email's one members row, makes its HQ
  sign-in (no password: the 6-digit code on /login sets one), emails the steps, and offers Sign in with LESARUSS back to the listing.
  It is confirmed on the return from Stripe and by HQ's Stripe webhook (`/api/stripe/lesaruss-ai`, endpoint `we_1UW0D0JqP8HzdnUnp89MSa8n`
  on the LESARUSS account, 2026-10-29: `checkout.session.completed`, `async_payment_succeeded` and `expired` run the same confirm for the
  Passport, listing claims and Guide orders, so paying and closing the tab still records it; its signing secret is
  `lesaruss_secrets.LESARUSS_AI_STRIPE_WEBHOOK_SECRET`). Proven 2026-10-29: a free LESARUSS
  account refused, an internal Diplomat signed in and voted once, a second vote and a Vegans Explore listing refused, then removed.

- **The front door** (LOCKED by Sean 2026-10-29, playbook `lesaruss-ai-front-door`, canon `canon-lesaruss-ai-front-door`): LESARUSS.ai
  runs this engine with business topics in place of cities. Build order: Media podcasts and the Pulse, Funding (a tab on the events
  engine) and Events, the Guides page and the Join Guide, the dashboard on lesaruss.ai, Labs and Advertising; LESARUSS 360 in the footer
  and dashboard. **Podcasts** (migration `20261029_lesaruss_ai_podcasts.sql`): 23 marketing, leadership and development shows found on
  Apple Podcasts, About from each feed's own description, tag `lesaruss-ai-directory-candidate` (so Vegans Explore's Directory and Media,
  `rank` in `ve-media.js`, leave them out), `crawl_source` `lesaruss-ai-podcasts`, `specialty` the topic, no How Vegan.
- **The Pulse by topic** (built 2026-10-30, migration `20261030_lesaruss_ai_topic_pulse.sql`; Sean: "it's really not going to be
  focused on regional stuff"). lesaruss.ai/pulse is this site's `pulse.html` (proxied) in brand mode (`VE_BRAND.pulse`): the banner
  picks a business topic (AI, Funding, Marketing, Leadership, Creators, Business operations, Events, or All topics; `?topic=`), never a
  city, and only the Pulse tab shows (no city boards, Suggest a Topic or ads). A topic is `ve_board_posts.community_slug` `lr-<topic>`
  (`ve-board` `LR_TOPICS`, `lr-all` lists them all); anyone reads, commenting and reporting need a LESARUSS member
  (`lr_member_entitled`), and a LESARUSS sign-in takes part only there. Its stories are 21 business feeds (`ve_news_feeds` scope `topic`,
  brand `lesaruss-ai`, `city_slug` the topic; TechCrunch, Crunchbase, Marketing Dive, Fast Company, Tubefilter, BizBash...), every story
  kept with status `national` so it stays out of the Depot Inbox. The seven topics are in `pulse_auto` (queued 6 PM Eastern, out at 7 AM),
  and the writer's `pulse_topic_write` instructions carry a LESARUSS.ai section (business voice, no cities or Vegan framing).
  The Inc. feed is off (its pages refuse the writer, 403); the first morning's other six briefings were written on schedule.
- **Events and Funding** (built 2026-10-30, migration `20261030_lesaruss_ai_events_funding.sql`, run through the one-time
  `ve-once-lr-events`, now the 410 stub). One events engine: LESARUSS.ai's rows are `events` with `tenant_id` LESARUSS
  (`...0001`), Vegans Explore's `...0002`, and **every Vegans Explore reader filters to its tenant** (`ve-events.js` load,
  `hub-news.js`; the others read by id or host listing). `events.listing_kind` is `event` or `funding`; a funding row's `starts_at` is
  its **deadline** (Upcoming = open, Soonest = closing soon), `ticket_url` its official apply page, `category` its kind (grant, loan,
  accelerator, competition, fellowship) and `events.funding` `{offered_by, amount, amount_usd, eligibility, rolling}`. Business events
  use conference, summit, pitch, tour, networking, webinar, workshop, meetup. `ve_event_intake` takes `"tenant": "lesaruss"` (or the
  source's tenant), `listing_kind`, `deadline` and the funding fields, refuses a closed one (`closed`) and one with no deadline.
  lesaruss.ai/events and /funding are this site's `events/index.html` (proxied) in brand mode (`VE_BRAND.calendar`): the banner picks
  Events or Funding, `VEEvents.mount(..., {tenant: VEEvents.LR_TENANT, kind})`, a funding tile (what it offers, who can apply in two
  rows, Closes with days left in red under 15, Apply), Sort Closing soon / Biggest first, Open / Closed; no Submit, event view or ads
  yet (the name opens the official page). The tile colors go through `--vb-*`. `ve_event_sources.tenant_id` and `listing_kind` (event,
  funding, both): 16 LESARUSS.ai sources (Hello Alice, IFundWomen, Amber Grant, SBA, Y Combinator, Techstars, Google for Startups,
  searches for grants, pitch competitions, creator funds and business, AI, marketing and creator conferences, Eventbrite business
  online); the writer's `events_crawl` instructions have a LESARUSS.ai section, and nothing goes live until approved in **Depot >
  Events > LESARUSS.ai** (`?brand=lesaruss`; every call carries `brand`, the queue, sources and Add are that brand's, and an item's
  funding fields are editable). The Pulse writer's city events are Vegans Explore's only; a LESARUSS.ai topic may use LESARUSS.ai's.
- **The Guides page** (built 2026-10-30). lesaruss.ai/guides (lesaruss-ai-site `app/guides/SharedGuides.tsx`) mounts this site's
  `ve-city-banner.js` and `ve-guide-catalog.js`: every Guide side by side in one grid, and the banner's menu is the Guides themselves
  (All Guides, then each Guide, which opens it; Sean, 2026-10-30: "let's just put them side by side... we can change the navigation
  once we get more guides added"; topic shelves come back when there are enough Guides), and the cards are ours, each with a banner made for the
  card (`public/guides/banners/<slug>.jpg` there; the Guide's portrait cover stays on its own page). **Business Guides only** (Sean,
  2026-10-30: "the audience is businesses... let's save that for when they become a diplomat"): our Guides do not show there; a
  Diplomat's every-community shelf belongs on their dashboard (`VEGuideCatalog.communityGuides` stays for it).
- **A LESARUSS.ai Guide is a mini app** (Sean, 2026-10-30: "update these guides so it fits with what we're doing with Vegans
  Explore... start with the podcast guide... from that template, we can roll on"). lesaruss.ai/guides/podcast-starter-guide
  (lesaruss-ai-site `app/guides/[slug]/GuideApp.tsx`, `MINI_APPS` in its page) is our Guide layout in LESARUSS colors: the header
  with the $11 box, **Take the tour** and the tabs, then the tab's content at full width, speaking to the content, never a tour of
  the page (the Overview lists the stages and their parts; an owner lands on Pick up where you left off). **V is on call** (Sean,
  2026-10-30: "I feel like it's a tour of how to use it... that should be a button, like take the tour... V can just be like a
  layover that pops up whenever you need her"): Take the tour, **Walk me through this** on every tab, or her button in the corner
  opens her panel there, with Pause / Play spelled out, her approved lines and clips, Back / N of M / Next through the tabs and
  Close; she never plays until asked. Next for her: a short voice-over-a-picture walkthrough per section, scripts to Sean first. HQ
  holds the tabs and V's words (lesaruss-hq `lib/guideSite.ts`) and answers who the visitor is with their own HQ session
  (`/api/member/guide-site`, CORS for lesaruss.ai): the paid parts' words only to an owner (`canOpenCourse`), saves, hot labs.
  Cheat sheets are HQ's graphics framed from `hq.lesaruss.ai/guide-sheet/<slug>/<key>`. Its Directory tab uses this site's card
  (`VERegionDirectory.brand(b)`, then `card` and `wire`, so the card reads like the brand's Directory).

## Continue with LESARUSS (Sean, 2026-10-29)

"A LESARUSS button... like how you do Google... log in here and you immediately get access to any of our communities... at the
passport rate, your passport works... you still got to pay the $11 to get into the other communities." One LESARUSS account signs in
on every brand (migration `20261029_lesaruss_sign_in.sql`, edge function `ve-lesaruss-sso`, HQ `app/connect` and `lib/sso.ts` in
lesaruss/lesaruss-hq).

- **The button is off** (Sean, 2026-10-29: "it just took me to another place where I would have to choose Apple or Google... why
  don't I just use the Google to log in?... let's not push it out to anywhere else... log in the same way and we will pick up on your
  membership"). In its place the sign-in window and `/login` say "Already a LESARUSS member? Sign in with the same Google account or
  email, and we pick up your membership" (`LESARUSS_NOTE` in `public/ve-auth.js`): one email is one account, so Google or a password
  signs in the same account, and a Diplomat comes in through `ve_member_entitled`. The privacy paragraph says the same (2026-10-29).
- **The quiet check** (Sean, 2026-10-29: "If they have an active login session on... their browser... it should pick up on that";
  "build the session pickup"). When someone goes to sign in (`/login`, or the sign-in window opened with no follow-up waiting,
  `showAuthModal` without a callback), `quietPickup` in `public/ve-auth.js` hops the browser once to HQ's `/connect/silent` (lesaruss-hq
  `app/connect/silent/route.ts`): signed in on hq.lesaruss.ai, it comes straight back with a one-time code and `/auth/lesaruss` signs
  them in here (the same code, `ve-lesaruss-sso` and Passport rule as below); signed out, it comes straight back with
  `error=login_required` and the page shows its usual sign-in (`?ve_signin=login|signup` reopens the window, then leaves the address).
  Nothing to see or click either way. Once a tab session (`sessionStorage` `ve_lesaruss_quiet`), vegansexplore.com and its previews
  only, never in a frame, on a brand page (`VE_BRAND`) or for anyone holding a token. HQ answers only return addresses on
  `lesaruss_sso_clients`, anything else a plain 400.
- **The button** sat under Continue with Google in the sign-in window and on `/login` (`LESARUSS_BTN`, `loginWithLesaruss` in
  `public/ve-auth.js`; any element with `data-ve-lesaruss="<path to come back to>"` starts it). It keeps a random state in the tab and
  opens `hq.lesaruss.ai/connect?client=vegans-explore&redirect_uri=<origin>/auth/lesaruss&state=` (a preview of this site uses the
  HQ branch preview, `LESARUSS_HQ`). HQ signs them in, shows who they are and what they get, and on Continue sends back a one-time
  code (kept only as its sha256 in `lesaruss_sso_codes`, two minutes, once; the return address must be on `lesaruss_sso_clients`
  exactly or match its preview pattern).
- **`/auth/lesaruss`** (`auth/lesaruss.html`, `noindex`) checks the state and trades the code (`VEAuth.finishLesaruss`,
  `ve-lesaruss-sso`): a session like ve-auth's. **One email is one `members` row across every brand**
  (`idx_members_email_unique_global`), so the row may be their LESARUSS.ai one: a **Diplomat** (`lesaruss_is_diplomat`, the $111
  membership) is let in as they are; **another brand's account that is not a Diplomat is refused** (`passport_needed`: Get your
  Passport or Become a Diplomat), since its status is that brand's (17 free LESARUSS.ai accounts read as active); a Vegans Explore
  account signs in as it is (waiting for its Passport, the $11 window opens); an email with no account gets one waiting for its
  Passport. Super admins pass.
- **Brand memberships** (Sean, 2026-10-29: "GO"; migration `20261029_brand_memberships.sql`). `brand_memberships` records who holds
  what on which brand: `vegans-explore` passport (paid) or comp (on us), `lesaruss-ai` diplomat. `ve_member_entitled(member)` is
  whether a row's status counts here: a Vegans Explore account (its status is ours, unchanged), a Vegans Explore Passport or comp on
  record, a Diplomat, or a super admin. Every sign-in (`ve-auth` login and both Google paths, `ve-lesaruss-sso`) refuses another
  brand's account that is not entitled with `passport_needed` and an $11 checkout the server makes (`passportNeeded`; no session
  token reaches the browser); the $11 window's button goes there (`_passportNeeded` in `public/ve-auth.js`), and payment returns to
  `/login?passport=paid` to sign in again. `ve-auth` `me` reads such an account as `pending_payment`, so an older session drops to
  the $11 window. Vegans Explore accounts are recorded by trigger (`trg_ve_brand_membership_sync`); another brand's account gets its
  Passport through `ve_brand_membership_grant` (the webhook's `entry_contribution`, the test checkout, `ve_member_admit`, which now
  returns true when it made them a member here), and the webhook's welcome points go to it as a first join. The Diplomat rows follow
  `ve_diplomat_sync`. On 2026-10-29 all 24 active Vegans Explore accounts, the switch accounts, Sean and the two Diplomats stayed in;
  the 16 free LESARUSS accounts (seed, test and internal ones) are refused here.
- `members.diplomat_since` and `ve_diplomat_sync()` (cron `ve-diplomat-sync`, daily) are ready for an account ever made active here
  for being a Diplomat; nothing sets it today.
- `/policies#privacy` says it (One LESARUSS account). Children's brands are never clients.
