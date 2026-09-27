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
`LOGO_REGIONS`, mirroring `SF_CITIES` in `/communities/south-florida/index.html`); `logo_set`
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
