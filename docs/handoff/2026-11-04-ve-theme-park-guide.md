# Handoff 2026-11-04: ve-theme-park-guide: concept locked, nothing built

Playbook `ve-theme-park-guide` ("The Vegan Theme Park Guide"), owner Logan. Canon `canon-ve-theme-park-guide`. Concept session with V, locked by Sean 2026-11-04 ("lock it").
Related: `ve-spend-budget` (step 1 done, below) and `blueprint-portal` (opened, a separate agent).

## Locked (Sean's calls and Logan's defaults)
- One Guide for every park on the venue Guides' engine (`ve-venues`): park = venue, restaurant = spot with a pin, dish = item (Vegan / Vegan on request / Ask before you order, with a source and a last-confirmed date). Reports, first-to-confirm bounties and the 35-day stale rule reused.
- Free park and pilot: Magic Kingdom. Wave 1 (Central Florida; Tampa Bay is inside the chapter): Magic Kingdom, EPCOT, Animal Kingdom, Hollywood Studios, Universal Studios Florida, Islands of Adventure. Later: SeaWorld, Busch Gardens Tampa, LEGOLAND Florida, then other chapters.
- $11 or 1,100 points, one Guide for every park. River narrates (Dani is the alternative). A new `theme_park` venue kind, with a resort label for browsing only.
- Map: our own schematic, never the park's art. GPS you-are-here, accuracy ring, distance in feet and miles (straight line x 1.3, labelled "about N on foot"). Radius set per park from the farthest pin plus 100 m (`radius_m` accepts 50 to 5000).
- Votes on spots and dishes inside the Guide (`ve_guide_votes`, new kinds), not Directory listings. Vegan items only plus a link to the park's own menu.
- No crawler on park sites until their terms are read. Published menus read one by one with a source link and a date; never copy descriptions or photos. No park logos or characters; no generated pictures of named park dishes (leaf tile until a member photo; a first-to-photograph bounty).
- No sponsors now (the Supermarket rule).

## Done this session (all in the database, checked live)
- Canon `canon-ve-theme-park-guide`, playbook index row, two playbook records, a checkpoint and a stream event.
- `ve-spend-budget` step 1 (needed so the pilot runs under a cap): Google is a hard $50 a month at list price, enforced in `ve_google_room`; one-time scans are approved with a ceiling (`ve_google_approve`) and check `ve_google_once_room`; `ve_google_ledger()` shows cap, spent, committed, left. Daily caps 120 / 100. Migration `20261104_google_hard_cap_ledger.sql`. CLAUDE.md "Google costs" replaced. Standing approval: any scan whose quote fits what is left runs without asking and is reported weekly.
- State at wrap-up (5:39 AM Eastern, Wed 2026-11-04): $14.00 spent, $36.01 left of $50, no approvals open.
- Nothing built for the Guide itself: no migration for the `theme_park` kind, no page, no import, no Google call for parks.

## Not done / open
- Pilot pin quality is unknown. Google may have poor in-park coverage and snap pins to the park centre. OpenStreetMap (free, ODbL attribution) is untested: the build session cannot reach Overpass; an edge function can.
- Park terms of use not read. Dani as narrator instead of River is Sean's to change.
- Estimates, not measurements: pilot about 25 searches + 70 details (about $2.75 at list); wave 1 about 570 calls (about $16).
- `ve-spend-budget` steps 2 to 4 (weekly Sunday snapshot, BrandDesk Costs module, Apify / Higgsfield usage) are not built. Sean owes plan prices.

## Next (order)
1. Confirm the ledger (`select ve_google_ledger()`).
2. Migration: widen the `ve_venues` kind check to `theme_park`, add the `GUIDES` entry in `ve-venues`, an unpublished `ve_guides` row, the free-park flag.
3. Approve the Magic Kingdom pilot: `ve_google_approve('once:theme-park-magic-kingdom', 25, 70, ...)`; run it within `ve_google_once_room`; show Sean the pins before anything else.
4. Page: copy `guides/stadium-arena-guide.html` and `guide-scripts/stadium-arena-guide.js`; a GPS park map (new `VEParkMap`).
