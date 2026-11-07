# ve-pricing-points-passport: survey-only door, topic Guide buy box, Dairy Guide locked (2026-11-07)

## What Sean decided

- **The survey is the only way into membership** (Explorer survey or a business Guide's survey), 250 points, no 1,100 welcome points.
  The $11 never bypasses the survey. $111 Partner plan stays. Claiming or adding a listing is free for members. Cash commissions paused
  (referral points continue). The $11 is an optional give (contribute, events, topic Guides, ads). Founding until midnight Eastern Jan 1, 2027.
- **Topic Guides are paid "like an airline"**: the public sees $11 and Member? Sign in; a signed-in member sees $11 or 1,100 points and picks.
  "Anything else other than that is complicating it."
- **The Vegan Dairy Guide is locked as the prototype** for every Guide (Maya opens and explains it; animation later, still images for now).
- Topic Guides' front pages carry no price line (the header's $11 box says it).

## What is live (main)

- c8784547: survey-only door (ve-auth.js, passport.html, nav.js, ve-votes.js, ve-partner-dashboard.js, claim.html, survey.html, policies.html),
  `ve-stripe-webhook` v67 (no welcome points on a first $11), `ve-claims` (free claim for members), migrations
  `20261107_survey_only_door.sql`, `_answers.sql`, `_facts.sql`.
- 4b649f20: the buy box in the six topic Guide scripts (Dairy, Nutrition, Airport, Stadium & Arena, Theme Park, Supermarket): signed out $11 +
  Member? Sign in; member with enough points Use 1,100 points / Pay $11 (header box too: "Or pay $11"); short of points $11 plus their balance and a
  bounties link; report gates say members join free with the survey. No "buying makes you a member" copy anywhere in them.
- ae43010d: no price line on the topic Guides' front pages; venue Guides' button reads Get the Guide; Nonprofit Guide says claiming is free for members.
- Checked live at 1440 and 390 px (Dairy, Airport) in all three states with mocked balances, no page errors.

## Decision Logan kept (Sean may override)

- `ve_guide_purchase_paid` still admits a Guide buyer. Reason: an account that is not a member reads as signed out on every page, so a
  non-member who paid $11 could not open the Guide otherwise. The copy no longer says buying makes you a member. If Sean wants the survey before
  any purchase, require it on the server.

## Open items

1. Browser check of /passport, /claim and the join window at 1440 and 390 px (not done after the survey-only change).
2. Partner Guides and the group earnings dashboard views still describe commission rates (cash commissions are paused).
3. Guides' Get access text lines (Dairy `sayPoints`, Nutrition, venue Guides) are text only, not recorded; Dairy's Maya join clip still says the old offer.
4. Merge commit c8784547 was authored by Claude, not Sean A. Russell.
5. Stadium & Arena and Theme Park buy boxes checked by code only, not in a browser.
6. Next in ve-restaurant-guide: continue Sean's walk-through at Your restaurant > Your audit.
