# Handoff 2026-11-04: ve-theme-park-guide: Magic Kingdom launched

Playbook `ve-theme-park-guide` (brand `vegans-explore`), owner Logan. Canon `canon-ve-theme-park-guide` (v2, key `launch_2026_11_04`). Builds on `2026-11-04-ve-theme-park-guide-magic-kingdom-items.md`.

## State
- Live on `main` at 357d43c9, confirmed on vegansexplore.com: `/guides/theme-park-guide` has no `noindex`, the sitemap lists it, the catalog card (Everyday, Theme Parks, River, Magic Kingdom free) is served. `ve_guides` row published ($11 or 1,100 points).
- 16 live spots, 45 live items, every item sourced to Disney's own plant-based list (dated 2026-11-04). Migration `20261104_theme_park_magic_kingdom_launch.sql`, applied through the connector.
- Disney's list re-checked against Sean's paste: all 44 matched. One plain fetch of Disney's page showed no items in its static HTML, so Sean's paste is the source. Nothing is crawled (Disney's terms bar it).
- Ten spots with no live item were set to `gone` (kept, not deleted). Sean was told two; it was ten.
- The catalog card wears a flat icon: a live card with no `banner` falls back to its `icon` in `ve-guide-catalog.js`.
- Google ledger about $33 of $50 left (nothing spent this session).

## Open (Sean picks)
1. A River-in-a-park banner (Higgsfield credits).
2. Next park: EPCOT, Animal Kingdom, Hollywood Studios, Universal Studios Florida, Islands of Adventure. Sean pastes each park's own list; Universal's terms need pasting too.
3. Hand pins for Aloha Isle and Liberty Square Market (both "Not pinned yet").
4. `ve_guide_votes` kinds for parks. Unproven: a report from inside the park, real phone GPS, a signed-in owner run, the $11 buy path.

## Paste prompt for a new chat
ve-theme-park-guide: Logan, Magic Kingdom is live on main (357d43c9). Read docs/handoff/2026-11-04-ve-theme-park-guide-magic-kingdom-launched.md in vegansexplore-com, name the playbook first, confirm the Guide is live, then I'll pick: a banner, the next park (I'll paste its list), or the Aloha Isle pin. Build nothing I haven't picked.
