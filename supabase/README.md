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
here from v47 (2026-09-24, now v48), which added the `partner_guide_purchase` branch
ahead of the legacy founding-membership fallback; v47 is v46 plus that branch
only, verified by diff against the deployed source. A buyer who pays before
having an account has the membership waiting on the sponsors row; the
`trg_zz_claim_partner_membership_*` triggers on `public.members` grant it at
signup.
