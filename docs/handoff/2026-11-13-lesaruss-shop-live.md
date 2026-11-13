# ve-front-of-house: the LESARUSS.ai shop is live

Playbook `ve-front-of-house`, canon `canon-ve-front-of-house` v16 `sales_route_v16` (Vegans Explore advertises, LESARUSS.ai sells).
Follows `2026-11-13-ve-front-of-house-pricing-v9-to-lesaruss-shop.md` (checkpoint 1010).

## Done and proven live
- **lesaruss.ai/shop** (repo `lesaruss/lesaruss-ai-site`, `app/shop`, `lib/shop.ts`, `public/shop/`; main 3ea151a). Copied from the
  Guides shop: the catalog list and the one-screen item page. Seven items from `lr_shop_items`, each with its price, what you get and a
  Green Leaf Kitchen example drawn for its 16:10 spot and stamped Sample. Shop is in the nav, footer and sitemap. Checked at 1440 and 390
  beside /guides and /guides/<slug>.
- **Checkout** on LESARUSS Inc.: edge function `lesaruss-shop` v1 (verify_jwt off; source `lesaruss-hq/supabase/functions/lesaruss-shop`,
  main f955a42), `STRIPE_SECRET_KEY_ACCT_LESARUSS`. Tables `lr_shop_items` and `lr_shop_orders` (lesaruss-hq migration 109).
  Photos $250, video $250, press release $500 buy now (Stripe Checkout, back to `/shop/<item>?paid=1`, buyer and team emailed).
  Site, Managed, social $400 a month and PR outreach $750 a month are **Get started**: a request, the team answers within one business
  day; flip `lr_shop_items.mode` to `buy` once the v9 agreement is approved (subscriptions are already built in the function).
  Proof: a live $250 Checkout read back on acct ...HzdnUn (Prices `lr_shop_*_v1` made there), expired; [TEST] rows removed.
- **Vegans Explore hands off** (main 877c6f1): `/business/managed` shows the plans and sends sign-ups to the shop (a client already with us
  still sees their plan and pause); the pitch page's Review and pay records I'm ready, then continues on LESARUSS.ai; the /business
  photo shoot and reel cards show the shop's item; the Business Guide's Managed by us opens the shop.
- **VE v9 Prices off**: the five `bd_*_v9` Prices in the Vegans Explore account (acct ...C9oZhv) are inactive, 0 subscriptions.
  `bd_*_v1` untouched (one live managed_v1 client). Note: `ve-branddesk` `price()` would remake a v9 Price if a super admin called
  `checkout`; no page calls it now.
- **Photographers**: two paid jobs on the Gig Board, Fort Lauderdale and Philadelphia ($75 paid three-dish trial, then their rate;
  applications close Dec 4). List and drafts: `docs/outreach/2026-11-13-photographer-bench.md`. Nothing sent.
- One-time functions `ve-once-lesaruss-shop`, `ve-once-v9-prices-off`, `ve-once-photographer-gigs`, `ve-once-shop-records` are 410 stubs.

## Waiting on Sean
- Yes on the photographer drafts.
- The v9 agreement and which lawyer service (then the monthly plans become Buy).
- Whether Managed keeps the 15-dish shoot, photo nights and the ad allowance.
- Still open: the pace rule, V's three line changes, check-ins every two weeks, phone recordings for tour frames 5, 14, 17 and 22.

## Next
The coach frame and its sample coach demo (playbook `lesaruss-ai-professional-frames`).
