# Handoff 2026-11-04: ve-theme-park-guide: Magic Kingdom built, prelaunch, items follow Disney's list

Playbook `ve-theme-park-guide` (brand `vegans-explore`), owner Logan. Canon `canon-ve-theme-park-guide`. Builds on `2026-11-04-ve-theme-park-guide.md` (the concept).
Branch `claude/peaceful-gauss-yf6idf`, pushed to `main` (last commit 214ad632).

## State
- Magic Kingdom page live at `/guides/theme-park-guide`, `noindex`, `ve_guides` row `theme-park-guide` unpublished (reads Coming soon), not in the catalog or sitemap.
- 25 restaurants (24 pinned from Google, Aloha Isle unpinned: Google matched a place 5.9 km away), 44 live Vegan items, each with Disney's plant-based page as source (date 2026-11-04). `ve_venues.menu_url` set to Disney's Magic Kingdom dining page.
- Google ledger 2026-11-04: $15.04 spent of $50, left $33.22 (pilot $2.75 ceiling was closed at wrap-up; the Diamond Horseshoe pin cost $0.04).
- Migrations: `20261104_theme_park_guide_kind.sql`, `..._magic_kingdom_pins.sql`, `..._magic_kingdom_items.sql` (draft list, later superseded), `..._items_from_disney_list.sql` and `..._diamond_horseshoe.sql` (comment-only; SQL as run is in migration history).
- Docs: `docs/theme-park/magic-kingdom-sources.md`, `magic-kingdom-draft-list.md`. CLAUDE.md theme-park section updated.

## Decisions this session
- Disney's Terms of Use bar robots, scripts, scraping, copying and AI use: nothing is crawled, items are hand-made names only with source link and date. The same rules are now in `/policies#terms` (Last updated Nov 4, 2026). Universal's terms page would not render: unread.
- Third-party lists (VeggL, PETA, VegNews) all copy Disney's guide, so they are not independent checks. Disney's own list (pasted by Sean) is the authority; draft items it does not carry are marked `gone`.
- Outreach direction (Sean): parks as sponsors or data partners only after traction; vegan places and organizations first; big parks around January 1 once launched; exception if Sean meets someone at Disney.

## Open / next (Sean picks)
1. Launch Magic Kingdom as the free park: re-check Disney's list first (it says items change), publish the `ve_guides` row, catalog card, sitemap, `noindex` off.
2. River versus Dani as narrator (Sean's call); River's lines are text drafts.
3. Other Wave 1 parks (EPCOT, Animal Kingdom, Hollywood Studios, Universal Studios Florida, Islands of Adventure): items by hand only; Universal terms need reading (Sean can paste them).
4. Aloha Isle needs a hand pin; Liberty Square Market is on Disney's list with no spot.
5. Legal glance on hand-keyed item names. `ve_guide_votes` kinds for parks not built.
6. Unproven: a report from inside a park, real phone GPS, a signed-in owner run, the buy path.
