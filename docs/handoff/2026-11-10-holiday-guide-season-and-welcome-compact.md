# 2026-11-10: Holiday Guide season, points rule, Directory CTA, Welcome Guide compact

Playbook: `ve-holiday-guide` (with `ve-explorer-path` for the Welcome Guide). All work is merged to main and checked on the live site.

## Done, live
- **Directory foot**: one black box with Join free, Claim your business, Suggest a place (`directory/index.html`).
- **Points only to claimed listings**: `ve_listing_contribute` returns `not_claimed`; the listing hides Give and shows a claim prompt.
  Existing points stay (Dina's 625, Love Life Cafe 500).
- **Holiday Guide in the Dairy Guide's places**: Resources tab on food listings (`FOOD_GUIDE` in `public/ve-guide-tab.js`), the listing
  Guide banner on every listing (restaurants too), the brand-page billboard (now the Guide's rail ad, the standard look for that slot),
  the ad-rail slots (campaign `...14008`; Washington DC hub's landscape slot kept on Dairy), a Holiday house-banner campaign `...13005`.
- **Ads never cut off**: the rail ad wraps its headline on a 160-wide skyscraper; the billboard slot is the rail ad.
- **Welcome Guide compact**: one blurb on every intro card, two columns, about 75-character rows. **Holiday Guide** rows at about 75.
- Migration: `supabase/migrations/20261110_holiday_for_dairy_and_points_claimed_only.sql` (applied live).

## Automatic on December 26 (Eastern)
The listing banner drops the Holiday Guide and the brand-page billboard returns to the brand's own Guide.

## Manual after Christmas (on the floor until then, by design)
1. Move the ad-rail slots from `...14008` back to `...14001`; set `...14001` and `...13002` active, `...13005` paused.
2. Set `FOOD_GUIDE` in `public/ve-guide-tab.js` back to `'vegan-dairy-guide'`.

## Waiting on Sean
- Love Life Cafe holds 500 points without a claim: kept per "let's just leave it"; no action unless Sean asks.
- Washington DC hub landscape slot still runs the Dairy Guide (its skyscraper is the Holiday Guide); say if both should be Holiday.
- Text sizes (15px / 14.5px) kept; Logan's offer to drop rows to 14px on both Guides stands.
