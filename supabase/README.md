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
