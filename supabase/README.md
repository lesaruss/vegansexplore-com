# Supabase Edge Function sources

Git-tracked sources for the Supabase Edge Functions behind this site, per the
LESARUSS repo standard (all code to GitHub). Deploying is a separate step: the
running version lives in Supabase project `fwbhwfxpncrsfhttimna` and is
deployed with the Supabase CLI or the Supabase MCP tools, not by pushing here.

Vercel serves this repository root directly, so a `redirects` entry in
`vercel.json` sends `/supabase/*` to `/`. These files are never served.

## ve-auth

Vegans Explore identity and membership API. `verify_jwt` is **false** by
design: the site calls it with the anon key in the Authorization header and
the VE app JWT in `body.token`, and the function does its own verification.
Keep that setting on any redeploy.

Deployed as v54 on 2026-09-23 with `verify_jwt=false` restored. v53 had
gone out with the deploy tool's default (`true`), which made Supabase's
gateway reject every call carrying the VE app token in the Authorization
header (`account/lesars.html`, two calls in `guide.html`) with
`401 UNAUTHORIZED_LEGACY_JWT` before the function ran. v54 also added the
signup honeypot and rate limits (`public.ve_signup_attempts`) and made
`decodeToken` verify the HMAC instead of only decoding the payload.

Staged and not yet deployed as of 2026-09-09:

- `resolveLaunchedCommunity` normalization. A trailing state or country
  qualifier and a trailing "City" are stripped before the chapter lookup, so
  "New York City" resolves to the launched `new-york` chapter instead of
  reading as a brand new city. Live evidence for the bug: a
  `ve_chapter_requests` row with `community_slug` `new-york-city`, created
  2026-09-09 08:36 UTC. The user-facing path is already fixed in
  `guide.html` (`normalizeCityEntry`), which normalizes before calling
  `city_status` / `join_city`; this change moves the same guarantee behind
  the API so any other caller gets it too.
- `VE_TENANT_ID` on both signup inserts. Both paths hardcoded the LESARUSS
  tenant, so every Vegans Explore registrant was written as a LESARUSS
  identity (error_registry `MEMBERS-TABLE-TENANT-HARDCODED-VE`). The database
  already enforces the correct value via the `trg_stamp_ve_tenant_on_insert`
  trigger, so this change is a no-op once deployed and the two cannot
  disagree.

## ve-partner-guide

Backend for The Explore Season Partners Guide (`/partners` and the Explore
Season section of `/dashboard/opportunities`). Playbook:
`explore-season-partners-guide`, locked 2026-09-24. `verify_jwt` is **false**:
it is a public endpoint, and a signed-in visitor's VE app token travels in
`body.token`. Actions: `catalog` (GET), `checkout` (self-serve offers under
$8K, Stripe Checkout on the VE account), `inquire` (question, meeting,
reserve with a 7-day hold, notify). Every purchase or inquiry writes one
`public.sponsors` row. Offers live in `public.ve_partner_offers` and cities
and Community Managers in `public.ve_partner_cities`, so prices, copy and
routing change with a row update, not a deploy. Deployed as v2 on 2026-09-24 (server-side $8K gate, one hold per email).

## ve-stripe-webhook

The shared Stripe webhook for the VE, LESARUSS and Meatless Muscle accounts.
`verify_jwt` is **false** (Stripe signs the request, not Supabase). Tracked
here from v47 (2026-09-24, now v49), which added the `partner_guide_purchase` branch
ahead of the legacy founding-membership fallback; v47 is v46 plus that branch
only, verified by diff against the deployed source. A buyer who pays before
having an account has the membership waiting on the sponsors row; the
`trg_zz_claim_partner_membership_*` triggers on `public.members` grant it at
signup.

## ve-entry-checkout

The $11 one-time Founding Membership checkout (Sean, 2026-09-24: it replaces
the free tier and the any-amount contribution; $11 is the floor, more is
allowed). `verify_jwt` is **false**: the VE app token is verified in the
function. Deployed as v2 on 2026-09-24 with the 1,100-cent minimum and Stripe
receipts on. The webhook's `entry_contribution` branch activates the member
and credits 1,100 Points.

## ve-media-ingest

Moves generated media into public storage (`vegan-media/onboarding-audio/`) for the guided pages.
Jobs are rows in `ve_media_ingest_jobs` (RLS on, no policies, so only the service role can queue one);
the function is called with `{ job_id }` and trusts nothing else.

- `copy`: fetches an allowed Higgsfield CDN URL (cloudfront.net / higgsfield.ai) and stores it.
- `bed`: cuts an excerpt from a `music-beds` WAV (`params`: `start_s`, `dur_s`, `target_rms`, `fade_s`),
  downmixes to mono 16 kHz, levels it to a quiet target RMS with fades, and stores it as WAV.
  The level is baked in because iOS ignores `HTMLMediaElement.volume`.

The pages play these through `/public/slide-audio.js` (voice over bed, auto-advance after the first tap).

## ve-learn

Runs Guide Engine courses (`learn_courses`, `learn_modules`, `learn_pages`, `learn_progress`,
`learn_quiz_attempts`, `learn_completions`) for Vegans Explore members. `verify_jwt` is **false**:
the VE app token is HMAC-verified in the function exactly like ve-auth.

- Course access lives in `COURSE_ACCESS` (first course: `ve-community-manager-certification`,
  community managers only; superadmins can always open a course to review it).
- Actions: `outline`, `page` (quiz pages are served without answers), `complete`, `quiz`
  (graded server-side; a pass marks the page done). The certificate (`learn_completions`)
  is issued when every page is complete, and `outline` self-heals a missed issue.
- Course content is tracked in `supabase/seed/ve-community-manager-certification.json`
  (reload it with the upsert in that commit's history). `/supabase/*` redirects to `/` on
  Vercel, so the seed file (which holds quiz answers) is never served publicly.
- Front end: `/dashboard/certification`; dashboard prompt and tile in center-console.

### ve-entry-checkout test mode (2026-09-25)

Members whose email is in `ve_test_checkout_allowlist` (RLS on, no policies) get a Stripe
TEST-mode session on the LESARUSS account's test key (`STRIPE_SECRET_KEY_ACCT_LESARUSS_TEST`,
read from `lesaruss_secrets` only on this path; Vegans Explore has no test key on file). Pay with
4242 4242 4242 4242. There is no test webhook, so the session returns to
`ve-entry-checkout?test_confirm=cs_test_...`, which verifies the paid test session, activates the
member (no points credited) and redirects back. Keep the allowlist tiny and clear it after testing.

## ve-cm-pulse-desk

The Community Manager's Pulse Desk (`/dashboard/pulse-desk`). `verify_jwt` is **false**: the VE app
token is HMAC-verified in the function like ve-auth. Community managers (and superadmins, who may
pass `city`) chat with Claude (`claude-opus-5`, server-side refusal fallbacks on, key from
`lesaruss_secrets.ANTHROPIC_API_KEY`); it asks follow-ups, then drafts a local story into
`ve_community_news` as `pending` / `member_submission` for the CM's city (invite city, else
home community). The CM edits and publishes (`approved`), which shows it on the city page via
`public/hub-news.js`; stories with a body open on `/news/local?id=`. Actions: `chat`, `drafts`,
`save`, `publish`, `discard`. Voice input uses ve-auth `transcribe_audio`.

## ve-onboarding-audio

Sean's recorded narration for the onboarding pages. `/admin/onboarding-audio` (superadmins) takes a
dropped folder, matches files to slides by their leading number (01-09) or slide word, and in the
browser downmixes to mono 32 kHz, trims long silence at the ends, levels to a steady speaking volume
(RMS 0.1, peak ceiling 0.89) and encodes 16-bit WAV. It posts each clip here (`upload`, base64),
which stores it at `vegan-media/onboarding-audio/<page>/<city>/sean/<key>-<ts>.wav` and upserts
`ve_onboarding_audio` (public read). The Community Manager onboarding page reads that table and
swaps each uploaded clip in over its placeholder, keeping the slide's music bed. `verify_jwt` false;
the VE token is HMAC-verified like ve-auth.

### ve-community-manager: applications (2026-09-26)

The Community Manager page ends in **Apply**, open to every active member (Sean: always keep a bench
ready as cities grow). `apply_audio` stores a recorded answer in the private `cm-applications` bucket;
`apply` saves `ve_cm_candidates` (kind `application`, status `applied`, `answers` jsonb, `phone`) and
emails Sean the answers with 7-day links to the recordings. Re-applying for the same city updates the
row. `confirm` and `question` remain for older links but the page no longer uses them.

### ve-onboarding-audio: slide images (2026-09-26)

`/admin/onboarding-images` (superadmins) shows every landscape Vegans Explore illustration from
Sean's Higgsfield history (47, embedded as CANDIDATES) plus the four already on the site. Pick a
slide, pick a picture: `set_panel` copies a Higgsfield image into
`vegan-media/onboarding-audio/panels/<page>/<city>/` (site paths are used as is) and upserts
`ve_onboarding_panels` (public read). The onboarding page swaps each slide's panel image from
that table. Pictures already on another slide are marked so nothing repeats.

## ve-media-library: directory logos (2026-09-27)

The Depot's **Logos** tab (`/admin/depot/logos`, superadmins) updates `listings.logo_url` for
South Florida's approved listings, the same way the Onboarding tab picks slide pictures. Every
logo is a `ve_media_library` picture tagged `logo` (the `uses` check constraint gained `logo` in
migration `ve_media_library_uses_add_logo`). `logo_list` returns a region's listings (cities in
`LOGO_REGIONS`, mirroring the South Florida city list in `/public/ve-hubs.js`); `logo_set`
accepts only a library picture URL, or null to fall back to the initial, and writes
`logo_alt_text`; `logo_fetch` downloads a logo still hotlinked from the business's own site
(https only, 8 MB cap) so the page can copy it into the library. The browser draws every logo
onto white at up to 800px before the shared uploader, so see-through logos never go black.
`delete` now also keeps any picture a listing uses as its logo. Deployed as v9 with
`verify_jwt=false` (unchanged).

## ve-media-library: Pulse city tags (2026-09-27)

The Depot's **Pulse Cities** tab (`/admin/depot/pulse-cities`, superadmins) replaces the retired
`/admin/pulse-city-tags` page. That page wrote `ve_pulse_city_tags` from the browser with the
anon key, but the table's insert/delete policies were for `authenticated` only, so every change
was silently refused. Now `city_tags_list` returns every published Pulse piece with its tags and
`city_tag { pulse_id, city_slug, on }` adds or removes one (city must be in `PULSE_CITIES`).
`pulse_save` no longer clears every tag on a Depot piece when it is edited: it moves only the
piece's own `city_slug` tag, so extra hubs tagged on Pulse Cities stay. Migration
`ve_pulse_city_tags_writes_via_depot_only` drops the two write policies and revokes
insert/update/delete from anon and authenticated; public read stays (`public/hub-news.js`).
Deployed as v10 with `verify_jwt=false` (unchanged).

The Depot's **City News** tab (`/admin/depot/news`) replaces `/admin/news-review` and uses the
existing `ve-community-news` function (`list_pending`, `approve`, `reject`; member token in the
body), unchanged.

## Pulse: podcast episodes live on /podcast only (2026-09-27)

Sean: move the podcast "articles" to the podcast page exclusively; the Pulse is for original city
content, "coming soon" until there is some. A `ve_pulse_content` row with a `podcast_show` is an
episode. `/pulse`, the dashboard Pulse grids (`dashboard/center-console.html`) and the hub Local
News feeds (`public/hub-news.js`, via `ve_pulse_content!inner` + `podcast_show=is.null`) now leave
episodes out, and `ve-media-library` `city_tags_list` (v11) no longer offers them for tagging.
`/podcast`, the show pages and `/pulse/<slug>` (`api/pulse-article.js`) still serve every episode.
The nine June pre-launch posts built into `pulse.html` (Higgsfield images) are off the feed too
(`archived`), still reachable by their old links. Each empty feed says coming soon.

## ve-votes (2026-09-27)

Directory votes. Before this, the + Vote buttons on `/directory` and the city hubs only
changed the number on screen, and `listing_daily_votes` allowed one vote per member per
day in total. Now any active member (Guest Passport included, same gate as ve-auth's
`requireActiveMembership`) votes for a listing once every 24 hours, counted from their
last vote for it (v2, Sean 2026-09-27). `listing_daily_votes_member_listing_day_key`
(unique on member, listing and Eastern date) stays as a backstop; two votes 24 hours
apart never share a date. `trg_listing_vote_count` keeps `listings.vote_count`,
which every directory shows and sorts by (it replaces the old favorites + likes sum,
which counted saves and likes, not votes). Actions: `vote` (402 `payment_required` for a
member who has not paid, which opens the $11 Founding Member box; 409 `already_voted`
with `next_vote_at`) and `today` (votes still inside their 24 hours, with each one's
`next_vote_at`). A second click shows "You're only allowed to vote once a day for each
business. Please try again tomorrow at 9:14 PM EDT", in the visitor's own time zone
(the browser's; Eastern if it will not say). The browser side is `/public/ve-votes.js`. Migration
`listing_votes_per_listing_per_day`. Deployed as v2 with `verify_jwt=false` (VE app
token, checked like ve-auth). ve-auth's older `vote_listing` still works but no page uses it.

## Public directory rule and ve-claims (2026-09-27)

Sean: a Vegan-friendly listing (or one with Vegan options) shows to the public only once
the community trusts it, which means votes from 10 different people (not one person ten
times) or a business claim Sean approved. Members always see everything; fully Vegan
listings and listings with no vegan status are never held back.

- `listings.voter_count` counts distinct members who ever voted for the listing (kept by
  `fn_listing_vote_count` next to `vote_count`).
- `ve_site_settings` (public read) row `directory_trust` = `{ enabled, min_voters }`,
  switched in the Depot's Claims tab. It shipped switched off.
- `/public/ve-trust.js` applies it on the city hubs (through ve-region-directory) and the
  listing page (members-only screen). `/directory` is admins-only, so it is not filtered.
- `ve-claims` (v1, `verify_jwt=false`) runs `/claim`: the business completes its details
  and makes an open-ended contribution ($11 minimum) through Stripe Checkout. The session
  carries ve-entry-checkout's metadata (`type entry_contribution`), so ve-stripe-webhook
  activates the membership and credits Points as usual; `claim_id` links it back.
  `?confirm=` marks the claim submitted with what Stripe says was paid and emails Sean.
  Approving in the Depot sets `claim_status` 'verified' (the existing value for claimed
  listings) and writes the details onto the listing; `claim_status` 'pending' means a paid
  claim is waiting. Claims live in `ve_listing_claims` (RLS on, service role only).
  Migration `directory_trust_and_claims`.

### Directory editing and filters (2026-09-27)

- `listings.extra_categories` (text[]): more sections a listing shows under on the city
  hubs, beside its main `category` (migration `listing_extra_categories`, which also fixed
  the stray spellings Restaurant, Bakery and Food Brand).
- `ve-claims` v2 `admin_listing` (superadmins): the quick editor in `/public/ve-listing-admin.js`
  on hub cards and listing pages sets main section, extra sections, vegan status and
  `business_status` (OPERATIONAL / CLOSED_TEMPORARILY / CLOSED_PERMANENTLY). Permanently
  closed listings leave the hub's default view and appear under Type > Closed.
- City hubs gained a "Vegan" filter (100% Vegan only, Vegan-friendly, Vegan options) and a
  label on every card.
- Listing pages show one billboard ad: `ve-directory-listing-landscape-2` is paused and the
  Riku (Bai spec) campaign unlinked from it.

### Directory sections v2 (2026-09-27)

Five main sections, each with its own sub-sections (`listings.category` holds the
sub-section): Food (Restaurants, Bakeries & Cafes, Food Trucks & Vendors, Markets, Food
Brands, Catering, Meal Prep), Products, Services (now including Marketing & Growth,
Branding & Creative Assets, Content Creation & Media, Web & Development, AI & Automation,
Business Operations), Media (Podcasts, YouTube, News Outlets, Documentaries & Films, Books,
Media) and Community (Community Partner, Nonprofits, Events). Migration
`directory_sections_v2` moved the Media listings by specialty and split Events and Catering.
Listings tagged `lesaruss-ai-directory-candidate` still stay off the VE hubs. `ve-claims` v3
`admin_listing` also takes `name`, `address` (online, or street/city/state/zip; clears the
old coordinates) and `details` (At a Glance: atmosphere, accommodations, seating flags,
ownership). listing.html shows At a Glance only for restaurants and cafes with a storefront.

## VE Verified tiers (2026-09-27)

Playbook `ve-verified-tours-hunt`, group A. VE Verified ($250/yr) and VE Verified Plus
($500/yr) are yearly Stripe **subscriptions** on the VE account, bought through `ve-claims`
(v4): on `/claim` alongside a claim (`start` with `tier`), or by the owner of a claimed listing
(`verified_start`). Each purchase is a `ve_verified_memberships` row (RLS on, service role only);
trigger `trg_ve_verified_sync` keeps `listings.ve_verified_tier`, `ve_verified_until` and
`ve_verified` (the badge: live tier AND `visit_done_at` set) in step. Plus sorts first in its hub
section from payment (`ve-region-directory.js`). Activation runs in one place, `ve-claims
?verified_confirm=`, which both the buyer's return trip and `ve-stripe-webhook` (v50, new
`ve_verified` branch) call. Renewals and cancellations arrive as `invoice.payment_succeeded` and
`customer.subscription.updated/deleted`, added to the VE endpoint `we_1TgxKpP0w5C9oZhvQ84LfHHd` the
same day; the Depot list also re-reads near-renewal subscriptions from Stripe, and cron
`ve-verified-daily` (09:17 UTC) lapses anything 3 days past renewal. Depot tab: `/admin/depot/verified`
(tier, paid, renews, visit, shoot, notes, end, add a membership paid another way).
Migration `ve_verified_tiers`.

## ve-hunt: the Passport Challenge (2026-09-27)

Renamed from "The Hunt" by Sean on 2026-09-27 (a hunt reads wrong for a Vegan organization).
Member-facing copy and URLs say Passport Challenge (`/passport/challenge`, `/passport/challenge/scan`,
`/admin/depot/challenge`, `-card`, `-kit`; the old `/hunt` paths redirect in `vercel.json`). The
tables (`ve_hunt*`), this function's slug, the `points_ledger` reasons (`ve_hunt_complete`,
`ve_hunt_anchor`) and the `hunt:`/`hunt-anchor:` refs keep their names; a "hunt" row is one monthly
challenge. Each challenge belongs to a hub (`community_slug`, picked in the Depot; hubs listed in
`/public/ve-hubs.js`, with each hub's time zone in the function). **Launch gate:** a hub's challenge
reaches members only when the hub is in `ve_site_settings.challenge_launch` (`{communities: [...]}`,
set with the Depot's Launch checkboxes, action `admin_launch`); until then members see "Coming in
2027" and Community Managers and superadmins (`members.ve_role = 'community_manager'` or
`is_superadmin`) see a preview. Sean's plan: 2027, one program per city, listed for Community
Managers first (dashboard tiles `cm-passport-challenge` and `cm-tours`, visibility staff).


Playbook `ve-verified-tours-hunt`, group C. `verify_jwt` is **false** (VE app token checked in the
function like ve-auth). Tables (migration `ve_hunt`, all RLS on, service role only): `ve_hunts`
(area, dates, goal default 5, badge, `points_reward` default 500, `anchor_bonus_points` default
100, status draft/live/ended), `ve_hunt_stops` (one register-card `code` per business per hunt,
`code_version` bumps on replace; pins geocoded through OpenStreetMap Nominatim on add, settable by
hand), `ve_hunt_stamps` (unique per hunt, listing, member; a "cashier didn't know" report is a
`pending` stamp until the Depot confirms), `ve_hunt_scans` (every attempt, for the odd-pattern
flags), `ve_hunt_completions` (the month's badge). Points go through `ve_hunt_award`, which writes
`points_ledger` + `apply_member_points_delta` like `award_points_bounty` (refs `hunt:<id>` and
`hunt-anchor:<stop id>`, so each is paid once). A hunt is visible only while `status = 'live'` and
today (Eastern) is inside its dates. Pages: `/hunt` (members map, Leaflet + OSM tiles), `/hunt/scan?c=`
(what the card QR opens), `/admin/depot/hunt` (setup, stops, codes, reports, per-business counts,
flags), `/admin/depot/hunt-card` (printable 5 x 7 register card). The South Florida hub shows a Hunt
card with the live offers; the dashboard Badges tile counts Hunt badges.

## ve-tours: Vegans Explore Tours (2026-09-27)

Update 2026-09-27 (Sean): one booking can take up to 12 guests (the van; the tour's seats still cap
it), each tour belongs to a hub (`community_slug`, times shown in the hub's time zone, events row
state and country from the hub), and a hub's tours reach the public only when the hub is in
`ve_site_settings.tours_launch` (Depot > Tours > Launch, action `admin_launch`, which also adds or
removes each tour's Events row). Until then Community Managers and superadmins see them as a
preview and can book to test. Planned for 2027.


Playbook `ve-verified-tours-hunt`, group B. `verify_jwt` is **false** (VE app token checked in the
function like ve-auth; booking works signed out too). Tables (migration `ve_tours`, RLS on, service
role only): `ve_tours` (city, neighborhood, start/end, `price_cents` default 5000, `capacity`
default 12, three `stops` as `[{listing_id, name}]`, attraction, pickup, drop-off, rain plan, host,
status draft/on_sale/closed/done/canceled, `event_id`), `ve_tour_tickets` (one row per guest, with
diet and allergy notes, the signed waiver name and version, status holding/paid/canceled/refunded,
check-in). `ve_tour_hold` locks the tour row and inserts the guests only if seats remain; a
`holding` seat counts for 30 minutes (`ve_tour_seats_taken`), and the Stripe session expires at 31.
Checkout is a one-time payment on the VE Stripe account (test mode for `ve_test_checkout_allowlist`
emails), metadata `type = ve_tour_ticket`, `confirm_fn = ve-tours`. Payment is confirmed by the
success redirect (`ve-tours?confirm=`) and, as a backstop, by `ve-stripe-webhook`'s generic VE
branch: any `ve_*` session whose `confirm_fn` names a `ve-*` function is handed to that function's
`?confirm=`. Tickets stay closed until the waiver is saved (`ve_site_settings.tour_waiver`, versioned
on every wording change). A tour needs three restaurants, the attraction, pickup, drop-off and a rain
plan to go on sale; on sale it is mirrored as an approved `events` row (category food) so it shows
in the South Florida hub's Events. Pages: `/tours` (list, `?id=` detail and booking),
`/admin/depot/tours` (waiver, tour editor with Plus-first restaurant suggestions, roster with
check-in).

## Business Offer v2 (2026-09-27)

Locked by Sean after a panel (playbook `ve-verified-tours-hunt`, group G). Supersedes the yearly
VE Verified pricing above; internal tier keys stay `verified` (Passport Stop, $250 a quarter) and
`plus` (Passport Anchor, $500 a quarter). Migration `ve_business_offer_v2`:
- `ve_verified_memberships`: status `reserved` (a free founding spot: no badge, no placement), `founding`,
  `hub`, `bill_from`, `billing_opened_at`, `committed_at`; one reserved row per listing.
- `ve_service_orders` (a la carte, `ve-services`), `ve_results_sheets` (one per membership per completed
  quarter), `ve_results_data(listing, from, to)` (Challenge stamps, members, first-time visitors, reports,
  Challenge months, Tour guests; offer redemptions are not tracked yet).
- `ve_site_settings`: `founding_caps` ({hub: n}; default is the stop count of the hub's first Challenge)
  and `quarter_extras` ({"2027-Q1": {title, text}}).

`ve-claims` (quarterly `interval=month, interval_count=3` subscriptions): before a hub's Challenge
launches (`challenge_launch`), `start`/`verified_start` with a tier reserve a founding spot instead of
charging, price locked in `amount_cents`; the Depot's `admin_founding_open` sets `bill_from` and emails
the business, whose `founding_checkout` saves the card with a Stripe trial to `bill_from`.
`commit_year` (four quarters for three) moves the subscription item to a new yearly price of 3x the
quarterly amount from the next renewal; offered from the first results sheet or 60 days in. Public
`offer` returns a listing's or hub's founding state and the quarter's extra. Results sheets: pg_cron
`ve-results-daily` calls `ve-claims?cron=results` with `x-cron-secret` (`lesaruss_secrets.CRON_SECRET`),
which writes each completed quarter (every 3 months from `paid_at`) and emails it to the business and Sean;
the business reads it at `/business/results?id=`. `ve-services`: catalog, `order` (one-time Checkout, the
member must hold the listing), `?confirm=` (also reached by the webhook's generic `ve_*` branch via
`confirm_fn`), Depot `admin_orders` / `admin_order`. Pages: `/business` (the offer, v2 order), `/claim`
(founding reserve and plan states), `/business/results`, Depot tabs Passport Partners
(`/admin/depot/verified`) and Services. The public badge reads "VE Verified" on both tiers.

## ve-news-desk: the News Desk (2026-09-27)

Sean: pull Vegan outlets and each city's local news, flag anything about Vegan life in our cities
back to June, show it on a dashboard page, and turn marked stories into Pulse articles. Page:
Depot > News Desk (`/admin/depot/news-desk`, superadmins; the Depot opens inside the dashboard).

- **Sources** are rows in `ve_news_feeds` (migration `ve_news_desk` added `scope`, `search_query`,
  `locale`, `last_count`; `city_slug` is null only for Vegan outlets). `scope` decides the flag:
  `vegan` (VegNews, Plant Based News, Vegconomist, Vegan Food & Living, Sentient Media) flags a
  story that names one of our hub cities; `local` (Eater Miami/NY/Philly/Atlanta/LA/DC, Miami
  Curated) flags a story that mentions Vegan food; `search` is a Google News RSS search per hub
  with `intitle:vegan OR intitle:"plant-based"` plus the city names, and a story's hub moves if
  its headline names a different hub. Sources are added, paused and removed on the page.
- **Leads** land in `ve_news_leads` (RLS on, service role only) with `reason` (why it was
  flagged), `headline_match`, and a status: new, write, drafting, drafted, dismissed, published.
  Deduped by URL and by normalized title. Nothing older than 2026-06-01 (`LOOK_BACK_FROM`).
- **Cron** `ve-news-desk-6h` (`41 */6 * * *`) posts `?cron=ingest` with `x-cron-secret`. It
  replaced `ve-news-rss-ingest-4h`, which fed the two Miami feeds into City News; City News now
  holds member stories only. `?cron=backfill {feed_id, month}` runs one month of one search;
  the page's "Look back to June" button does the same through the superadmin `backfill` action.
  The first look-back (June to September) flagged 213 stories.
- **Drafting**: `lead_write` marks a lead and drafts in the background (`EdgeRuntime.waitUntil`)
  with Claude (`claude-opus-5`, adaptive thinking, effort medium, server-side `fallbacks:
  "default"` under beta `server-side-fallback-2026-07-01`, tools `web_fetch_20260209` and
  `web_search_20260209`). The prompt requires original writing, facts only from the source,
  capitalized Vegan, no dashes, and a credit line for the source. The draft is saved to
  `ve_pulse_content` as `status 'draft'`, `origin 'depot'`, with the model's "check before
  publishing" notes on the lead. Failed drafts keep the error on the lead and the cron retries
  up to two queued drafts per run. The key is `ANTHROPIC_API_KEY` in `lesaruss_secrets`; on
  2026-09-27 that account was out of credit (error_registry `ROOM-ANTHROPIC-CREDIT-EXHAUSTED-502`).
- **Publishing** happens in Depot > Pulse (`/admin/depot/pulse?edit=<id>` opens a draft):
  `ve-media-library` v12 keeps drafts as drafts on save, needs a Library cover to publish, stamps
  `published_at`, and marks the lead `published`. `public/hub-news.js` shows only published
  pieces, so a draft never reaches a hub.

## LESARUSS dispatcher (2026-09-27)

Replaces jobs that fail on API credit (News Desk drafting, the Fieldy topicizer) with one Claude
Code routine billed to the Claude subscription. Migration `lesaruss_dispatch`.

- `lesaruss_dispatch_sources`: the checklist. One row per source with `enabled`, `batch`, `sort`
  and `instructions` (the procedure the routine follows; edit the row to change it). Switched on:
  `news_desk_write`, `fieldy_topicizer`. Entered but off until Sean switches them on:
  `room_work_orders`, `agent_tasks_logan`, `fieldy_v_requests`, `personal_ideas_raw`,
  `brand_features_to_build`, `playbook_orders_due`, `people_tasks`.
- `lesaruss_dispatch_pending()`: waiting counts for every source.
- Cron `lesaruss-dispatch-15m` (`7,22,37,52 * * * *`) runs `lesaruss_dispatch_tick()`: free SQL; when
  a switched-on source has work, no run is going, and the secrets exist, it inserts a
  `lesaruss_dispatch_runs` row and POSTs the routine's API trigger (`CC_ROUTINE_FIRE_URL`, bearer
  `CC_ROUTINE_TOKEN`, headers `anthropic-beta: experimental-cc-routine-2026-04-01`,
  `anthropic-version: 2023-06-01`). The next tick records the session link; runs with no finish
  after 90 minutes are marked failed.
- The routine calls `lesaruss_dispatch_begin()` (claims the run, returns the switched-on sources
  with work and their instructions), works them, then `lesaruss_dispatch_finish(run_id, status,
  summary)` and logs to `stream_events`.
- Cron `fieldy-topicizer-2h` was unscheduled; its watermark only moves on success, so the routine
  resumes where it stopped.

Scope (Sean, 2026-09-27): the dispatcher is for content creation (News Desk "Write it up", and
later the same for every brand). Everything else stays under Sean's oversight: those sources stay
off. Explicit voice requests ("V, set this task up ...") are a separate, sparingly used path.

Station routing (migration `lesaruss_dispatch_station_routing`): each station (Station 1 =
SAR-station, Station 2 = V-station) gets its own copy of the routine on its own Claude account.
`lesaruss_dispatch_settings.route` picks the station (`select lesaruss_dispatch_route('station-2')`
when Sean says "route it to station two"); with `fallback` on, a station with no routine or whose
last fire in the past hour failed is skipped for the other. Secrets per station:
`CC_ROUTINE_FIRE_URL_STATION_1` / `CC_ROUTINE_TOKEN_STATION_1` and the same with `_2`
(unsuffixed names count as Station 1). Each run records its `station`.

Setup now happens on Depot > News Desk, "Background writer" box (edge function
`lesaruss-dispatch-admin`: status, save_station, route, run_now; tokens are write-only through
`lesaruss_dispatch_save_station`; the routine prompt lives in `lesaruss_dispatch_settings.routine_prompt`
and the box has a Copy button). The manual path below still works.

Manual setup (once per station): create the routine at claude.ai/code/routines with the prompt below, no
schedule, a fresh session per run, the Supabase connector on. Add an API trigger, generate the
token, then store two rows in `lesaruss_secrets`: `CC_ROUTINE_FIRE_URL` (the trigger's URL,
`https://api.anthropic.com/v1/claude_code/routines/<id>/fire`) and `CC_ROUTINE_TOKEN`.

Routine prompt:

> You are Logan (Director of AI Production Systems, LESARUSS), running as the Dispatcher Worker. A
> free database job (public.lesaruss_dispatch_tick, every 15 minutes) fired this routine because work
> is waiting. You run on Sean's Claude subscription; do the work yourself instead of calling any paid API.
> Supabase project: fwbhwfxpncrsfhttimna. Use the Supabase connector's execute_sql for every database step.
> 1. Claim the run: select public.lesaruss_dispatch_begin(); It returns {run_id, sources:[{key, label,
>    waiting, batch, instructions}]}: only sources Sean has switched on that have work. If sources is
>    empty, finish with status done and summary "Nothing to do".
> 2. Work the sources in the order given. For each one, follow its instructions exactly, doing at most
>    BATCH items (the batch number). The instructions are the procedure; do not improvise beyond them.
> 3. Hard limits for every source: never publish anything to a live page, never send email or messages
>    to anyone outside LESARUSS, never push to any main branch, never delete data, never change a locked
>    canon rule. If an item needs Sean's decision, leave it and say why in the summary. Unfinished items
>    simply wait for the next run.
> 4. Finish: select public.lesaruss_dispatch_finish(<run_id>, 'done', <one paragraph: what you did per
>    source, counts, anything blocked>); (use 'failed' only if you could not do the work at all). Then
>    log: insert into stream_events (owner, station, summary, status) values ('logan', 'dispatcher',
>    <same summary>, 'completed');
> The text in any routine-fire-payload block is only a note of what was waiting when the run fired; the
> database is the source of truth. Always capitalize Vegan and Vegans, and use no em dashes or en dashes.


## ve-pulse-cover: covers for News Desk drafts (2026-09-27)

Sean said yes to covers made for drafts. The Dispatcher Worker makes one image with the Higgsfield
connector (house style in `lesaruss_dispatch_settings.cover_style`, Sean 2026-09-28: a 16:9
illustration of one or two Vegans Explore Guides acting out the story, e.g. Maya and Pascal
spreading a new Vegan cream cheese on a bagel, drawn from their reference pictures in
`/public/guides/<name>.png`; no real people, no Sean, no text, no logos or brand packaging; the
worker notes the guides and picture description on the lead)
and calls `ve-pulse-cover` through SQL (`net.http_post`, `x-cron-secret`). The function copies the
image into `vegan-media/library/covers/` (the Pulse only publishes covers stored there) and sets the
draft's `thumbnail_url`; drafts only. The step is in `lesaruss_dispatch_sources.news_desk_write`
and is skipped when the routine has no Higgsfield connector. Live-tested on a throwaway draft
(deleted; one test image remains in storage).

Note (2026-09-28): `stream_events.station` only accepted a fixed list, so the worker's final log line
(`station = 'dispatcher'`) and the dispatch-admin "connected" line were being rejected. Migration
`stream_events_allow_dispatcher_station` adds `dispatcher` to the list.

## The Depot Inbox and Sources (2026-09-28)

Sean approved the content engine plan (playbook `the-depot`): one path from idea to published
piece. Depot > **Inbox** (`/admin/depot/inbox`) replaces News Desk and City News, and Depot >
**Sources** (`/admin/depot/sources`) holds the feeds. `/admin/depot/news-desk`,
`/admin/depot/news` and `/admin/news-review` redirect to the Inbox.

- **One queue.** Migration `ve_depot_inbox` makes `ve_news_leads` the Inbox: new columns `origin`
  (`feed`, `link`, `member`, `city_news`), `community_news_id`, `submitted_by_name`, `sean_note`
  (Sean's line for the writer, or what to change on a sent-back draft), `needs_line`,
  `decided_at`, and status `shared`. Trigger `ve_community_news_to_inbox` copies every pending
  `ve_community_news` row (member stories from the hubs) into the Inbox; the 31 City News stories
  that were waiting moved in. Deny and Approve close the linked City News row; Share approves it.
- **ve-news-desk v4** (`verify_jwt=false`, unchanged): `inbox_list`, `link_add` (reads the pasted
  page's og tags; a page behind a login or robot check, such as most Facebook posts, lands with
  `needs_line` and cannot be approved until Sean adds one line), `lead_note`, `lead_write`
  (Approve), `lead_deny`, `lead_share` (a link on a city hub's Local News, no write-up),
  `ready_publish` (needs a Library cover, sets the city tag), `ready_send_back`. `feeds_list`
  now returns sent, approved, denied and waiting per source from `ve_news_inbox_stats()`
  (migration `ve_depot_inbox_stats`, service role only). A source is shown as weak under 10%
  approved after 20 suggestions.
- **Writing is the Background writer's job only.** v4 removed the paid-API drafting
  (`ANTHROPIC_API_KEY`, `draftLead`) from Approve and from the 6-hour cron. Approved stories wait
  at status `write` for the Dispatcher Worker; `lesaruss_dispatch_sources.news_desk_write` now
  reads `sean_note` and revises the same draft when a lead with a `pulse_id` is sent back.
- The Background writer box (stations and routing) moved to the bottom of the Inbox.

## Logo slot in the listing editor (2026-09-29)

Sean: "upload the logos directly on the listings." The superadmin quick editor
(`/public/ve-listing-admin.js`, on hub cards and listing pages) has a Logo section: Upload (or
Replace), Copy it into our storage (for a logo still linked from the business's own site), and
Remove. A logo change saves right away through `ve-media-library` `logo_set` / `logo_fetch`, the
same path as Depot > Logos; the logo prep (drawn onto white, at most 800px, PNG) now lives once
in `/public/ve-media-upload.js` (`logoFile`, `setLogo`) and the Logos tab uses it too.
`ve-media-library` v13 (`verify_jwt=false`, unchanged) accepts `logo_set` / `logo_fetch` for any
approved listing in any city (v12 allowed only South Florida). The Logos tab stays for bulk work
(3,408 of 3,659 listings had no logo) until it moves to the Businesses tile as Missing logos.

## One Depot engine, step 1: a brand on every record (2026-09-29)

Sean: the main Depot lives in HQ and feeds every brand; each brand's Depot is the same system
filtered to that brand. Migration `depot_brand_on_every_record` adds `brand_slug` (not null,
default `vegans-explore`, foreign key to `brands.slug`, indexed) to `ve_media_library`,
`ve_news_leads`, `ve_news_feeds`, `ve_onboarding_slides`, `ve_onboarding_panels` and
`ve_onboarding_audio`, and ties the existing `ve_pulse_content.brand_slug` to the same registry.
Every existing row is Vegans Explore; the default keeps the live pages and functions writing
correctly with no code change. Next: the main Depot in HQ (lesaruss-hq) reads these tables across
brands, and each brand's Depot is the same Depot with the brand filter fixed.

## One Depot engine, step 2: the main Depot in HQ (2026-09-29)

`ve-news-desk` v5 serves HQ's Depot (`hq.lesaruss.ai/depot`, repo lesaruss-hq,
`app/(shell)/depot`) as well as this site's. HQ's server calls it with the header
`x-lesaruss-admin: <LESARUSS_ADMIN_TOKEN>` (checked against `lesaruss_secrets`), and sends
`brand` to work one brand or nothing to see every brand. This site's pages send no brand and
get Vegans Explore, exactly as before. `inbox_list` also returns `by_brand` (stories waiting per
brand); `link_add` and `feed_save` save under the brand given; sharing to a city hub is
Vegans Explore only. `ve_news_inbox_stats(p_brand)` counts one brand or all. The Background
writer now saves each draft under its story's brand.

### Depot Preview (Sean, 2026-09-29)

"A preview button so I can see a mockup of how the actual article would look in a lightbox."
Preview shows a piece, draft or not, on its real article page, inside a lightbox with a
Desktop / Phone toggle. It is on the Inbox Ready lane and every Pulse tab row, here and in
HQ's Depot (hq.lesaruss.ai/depot).

- `ve_pulse_previews` (migration `ve_pulse_previews`): one row per preview link, token uuid,
  one-hour expiry. `ve_pulse_preview(p_token)` (security definer, granted to anon) returns the
  piece for a live token.
- `api/pulse-article.js`: `/pulse/<slug>?preview=<token>` renders the piece with an orange
  "Preview: not published yet" bar, `noindex`, and `Cache-Control: private, no-store`. A wrong,
  expired or other piece's token is a 404.
- **ve-news-desk v6** (`verify_jwt=false`, unchanged): `pulse_preview { pulse_id }` makes the
  link and returns `url`. HQ's Depot makes its link from its own server (actions.ts).
- `public/depot-preview.js`: the lightbox. Any button with `data-preview="<pulse id>"` opens it.
  It uses a native dialog, so inside the dashboard frame depot-tabs.js places it on screen.
- HQ shows vegansexplore.com in a frame, so HQ's CSP `frame-src` lists it (lesaruss-hq
  next.config.ts; error_registry HQ-CSP-FRAME-SRC).

Same day: Inbox, Sources and Pulse Cities dropped their 900 to 1100px caps on cards, stats and
toolbars, so every Depot tab is full width. Only the intro line under each title keeps a
reading width.

### Real photos, with permission and credit (Sean, 2026-09-29, BOSS "source reliable photos")

"Real business, real photo, with permission and credit; otherwise their logo card; illustrations
only for general topics, labelled." Migration `depot_photo_provenance`:

- `ve_media_library.credit`, `.license`, `.source_page_url`. license is one of owner_upload,
  press_kit, permission, own, open_license, logo_card, logo, illustration. Higgsfield pictures
  were backfilled as illustration, listing logos as logo.
- `ve_pulse_content.cover_credit`, `.cover_license`, `.names_business`, `.business_listing_id`.
  Trigger `ve_pulse_cover_provenance` copies the Library's credit whenever the cover changes (the
  writer's own `library/covers/` pictures are illustrations) and sets names_business for Food &
  Dining and Business Spotlight. Trigger `ve_pulse_cover_rule` refuses to publish a piece with
  names_business whose cover is an illustration or has no recorded right (`needs_real_photo`).
  It lives in the database so both Depots, Depot > Pulse and the writer all follow it.
- **ve-media-library v14**: upload, register and update take license, credit, source_page_url;
  `listing_search`, `pulse_cover`; publish errors come back as `needs_real_photo`.
  **ve-news-desk v7**: the Ready lane gets each draft's cover credit; `ready_publish` returns
  `needs_real_photo`.
- `public/depot-cover.js`: the Cover dialog (Inbox Ready cards, Depot > Pulse). A real photo with
  what lets us use it and its credit, or the business's logo card drawn in the browser from the
  logo on its listing. Library cards edit credit, license and source page.
- `api/pulse-article.js`: a credit line under the cover ("Photo: Courtesy of X", "X logo",
  or "Illustration").
- **ve-pulse-cover v2**: the writer attaches a cover with license illustration (default),
  press_kit or open_license; the last two need a credit and the https page that grants the use,
  and the photo is saved to the Library too. The writer's instructions (news_desk_write step 6)
  follow the order: Directory lookup, press page photo, open license for places, otherwise no
  cover and a note ("Needs a real photo"); illustrations only for general topics.
- The Cover dialog's third choice, Ask them for a photo, drafts the request (email when the
  listing has one, else Instagram or website). Nothing is sent from the Depot.
- Never: a photo from the source article, a photo copied off a website without a press grant,
  Google Maps or Yelp photos (`listings.google_photos` are Google users' photos).

### Heads-up outreach and scheduled publishing (Sean, 2026-09-29, the newsroom gold standard)

"Find who the subject is, research their email, and then send them a preview ... same day."
Newsrooms confirm facts and ask for comment with a deadline; they do not give the subject a veto.
Migration `depot_outreach_and_schedule`:

- `ve_pulse_content.track` ('spotlight' | 'news'), `.publish_at`, `.updated_note`, `.updated_note_at`.
- `ve_pulse_outreach`, one per piece: contact name, email, channel, link, where it was found,
  subject, body, status (draft, sent, replied, skipped, failed), Resend id. Service role only.
- `ve_depot_publish_due()` on pg_cron `ve-depot-publish-due` every 5 minutes: publishes drafts whose
  publish_at has passed, with the Ready lane's rules (Library cover, the real-photo rule, city tag,
  lead marked published). One that cannot go has its time cleared and the reason on its lead.
- **ve-news-desk v10**: `outreach_get` (drafts the email from the template when there is none),
  `outreach_save` (redraft rewrites it for the track), `outreach_send` (Resend from
  hello@vegansexplore.com, replies to hello@ and contact@lesaruss.com; `{{preview_link}}` becomes a
  two-week preview link, `{{go_live}}` the go-live time; sending schedules a draft with no time for
  5pm local; a News email with a preview link is refused), `outreach_mark`, `piece_schedule`,
  `piece_update_note`. Preview links from these emails last 14 days.
- `public/depot-outreach.js`: the Heads-up dialog (Inbox Ready cards, and Done cards for live pieces).
- `api/pulse-article.js`: the "Updated" line under the date, and "Something wrong, or want this
  taken down? Email us" under every Depot piece.
- The writer (news_desk_write step 7) sets the track and saves the contact it found, only an
  address the business publishes, with where it was found. It never sends or schedules. The writer
  was paused on 2026-09-29 until Sean resumes it.
