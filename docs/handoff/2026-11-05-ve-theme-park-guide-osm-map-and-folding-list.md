# ve-theme-park-guide: OpenStreetMap park map merged, restaurant list folds with votes

2026-11-05, Logan. Playbook `ve-theme-park-guide`.

## Done and live (main)
- **Illustrated park map merged** (2dbf1e3): our own drawing of Magic Kingdom from OpenStreetMap (`ve_venues.layout.base`), OSM credit on the map and `/policies#terms`. Confirmed live at 1440 and 390 px; template-gate screenshots beside the Stadium & Arena Guide sent to Sean.
- **The restaurant list folds** (7e24b34): every card collapsed (number, name, land, distance, heart votes, +). Opening one (+, header or its map pin) moves it to the top open; opening another replaces it; minus closes. Sort: Map order / Most votes / Nearest to you (location on switches to Nearest). Clear: all closed, Map order, every land.
- **Votes** (8fda579): `ve_guide_votes` kind `park_spot` (migration `20261105_park_spot_votes.sql`, applied); `ve-cookbook` knows `theme-park-guide` and `park_spot`, deployed from 8fda5791, source sha256 matched. Counts public; voting for Guide owners and super admins; signed out opens sign-in, a non-owner is told voting comes with the Guide.
- Fixed "Invalid Date" on a source line (`monthOf`).

## Not proven
- A real owner's vote end to end (a signed-out vote returns 401 as it should; 0 votes exist).
- A report from inside the park, real phone GPS, the $11 buy path.

## Open, Sean picks
- (3) the two hand pins (Aloha Isle, Liberty Square Market): send long-press coordinates or confirm.
- (4) a River banner (Higgsfield credits; quote first).
- (5) the next park (paste its plant-based list; Universal needs its terms read first).
- Default used: everything collapsed on load (one line to open the first instead).

Link: https://vegansexplore.com/guides/theme-park-guide#/venue/magic-kingdom
