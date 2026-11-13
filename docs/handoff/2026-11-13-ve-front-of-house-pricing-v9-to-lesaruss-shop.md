# ve-front-of-house: pricing_v9 live; next, selling moves to the LESARUSS.ai shop

Playbook `ve-front-of-house`. Session 2026-11-12 to 11-13 (Eastern). Branch `claude/ve-pricing-v9-wfz7n5`, merged to `main` (767f81f).
Canon `canon-ve-front-of-house` v16 (`sales_route_v16`, below). Full record: `docs/history/branddesk.md`, entry "pricing_v9 built and live".

## Done and live (proven)
- **Stripe** (the Vegans Explore account, live and test): `bd_site_v9` $500 every 3 months, `bd_managed_v9` $500 a month,
  `bd_managed_setup_v9` $250 once, `bd_photos_v9` and `bd_video_v9` $250 once. `bd_*_v1` kept. Proven on two [TEST] live Checkout
  Sessions read back from Stripe ($1,000 due today each, intervals right), then expired; rows removed; `ve-once-pricing-v9` is the 410 stub.
- **`ve-branddesk` v23** (commit 598c1b0, source sha256 matched). The repo was first synced to live v22, which held Brooke Sellers'
  creator-onboarding code that was never merged (commit 06130a8). Checkout takes `{plan: site|managed, photos, video, social}`;
  `prices_ensure` makes the Prices. Migration `20261112_branddesk_pricing_v9.sql` (`plan`, `addons`, `setup_plan` none).
- **Pages on v9**, checked live at 1440 and 390: `/business/managed`, the pitch page (What it costs and its sign-up), `/business`
  Managed by us, the sample BrandDesk plan text, Depot > BrandDesk's plan column. BrandDesk's name is kept off what owners see.
- **Agreement**: lawyer draft `docs/legal/managed-marketing-agreement-v9-draft.md` (changes marked, 7 questions for counsel).
  `AGREEMENT_VERSION` stays 2026-10-31; `branddesk.terms_v9` is false, so owner checkout is closed (a try emails the team).
- One slip: merge commit a01cec9 on main is authored "Claude"; not rewritten. Every commit after it is Sean A. Russell.

## Sean's direction (2026-11-13), now canon `sales_route_v16`
"We're routing them to LESARUSS.ai and not trying to offer services through Vegans Explore. Vegans Explore does enough. It needs to
focus on promotion and... small marketing services that lead up to... the managed services, that is a completely LESARUSS AI thing.
So the pricing should be governed by that. But we should have a clear shopping list. We need to make it easy for people to choose our
services. And then we can fill in the back room with the actual talent... if somebody wants to purchase photography, we can give them
an idea of what it would be like... we should be reaching out from now to find those people." Then, on Logan's plan: "Go ahead."

## Next (the plan Sean approved)
1. **Vegans Explore advertises, LESARUSS.ai sells.** VE pages keep showing the services; every buy or sign-up button goes to
   LESARUSS.ai. VE stops taking money for Site, Managed, photos and video (`/business/managed` and the pitch sign-up hand off).
2. **The shop on LESARUSS.ai** (`lesaruss-hq`, the canon talent shop: "one price list for every brand"): one shopping list, each item
   with its price, what you get, a real example (photography shows the Green Leaf Kitchen photos), and Buy, paid to LESARUSS Inc.
3. **Move the Prices** to the LESARUSS Inc. Stripe account (confirm which account that is first: `ve-branddesk` live charges with
   `STRIPE_SECRET_KEY`, "the Vegans Explore key"; the test key is `STRIPE_SECRET_KEY_ACCT_LESARUSS_TEST`), then deactivate the
   VE `bd_*_v9` Prices. Nobody has bought on them.
4. **Photographers**: a paid photographer job on the Opportunities board and a city-by-city list (Fort Lauderdale and Philly first).
   Outreach is paused: drafts only, nothing sends until Sean approves them.
Then: the coach frame and its sample coach demo (playbook `lesaruss-ai-professional-frames`).

## Waiting on Sean (do not act without his yes)
- Approve the v9 agreement (send the draft with the live one to the lawyer); which subscription lawyer service.
- Confirm the LESARUSS Inc. Stripe account.
- Whether Managed keeps the 15-dish shoot, photo nights every two months, the ad allowance (the draft leaves them out).
- Sending any photographer outreach.
- Still open from before: the pace rule (`canon-video-shot-pace`), V's three line changes, check-ins every two weeks on the Community
  page, the optional phone recordings for tour frames 5, 14, 17, 22.
