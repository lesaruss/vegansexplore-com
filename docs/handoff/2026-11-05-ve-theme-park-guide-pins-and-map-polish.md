# Handoff 2026-11-05: ve-theme-park-guide: hand pins and map polish

Playbook `ve-theme-park-guide` (brand `vegans-explore`), owner Logan. Builds on `2026-11-04-ve-theme-park-guide-magic-kingdom-launched.md`.

## State
- Live on `main` (merge 52e0e8b): https://vegansexplore.com/guides/theme-park-guide#/venue/magic-kingdom. Public, no sign-in. 16 live spots (all pinned), 45 live items, Google ledger $31.42 of $50 left (nothing spent this session).
- Hand pins saved (migration `20261104_theme_park_magic_kingdom_hand_pins.sql`): Aloha Isle 28.41838, -81.58246; Liberty Square Market 28.41955, -81.58250. Estimates, `pin_source` `hand`, not checked against the park.
- Map polish in `public/ve-park-map.js`: overlapping pins spread apart with a true-spot dot and line, land names placed clear of pins, more frame room. Checked live at 1440 and 390 px (no errors, 16 pins in the frame).
- Sean had not seen the Guide until the end of this session; screenshots and the link were sent.

## Open (Sean picks)
1. Look at the Guide and lock the look. Logan has not yet screenshotted it beside its parent (Stadium & Arena Guide) at 1440 and 390 px, which CLAUDE.md's template gate requires before the look is locked.
2. Confirm the two hand pins against the park, or send long-press coordinates from Google Maps.
3. River-in-a-park banner (Higgsfield credits; quote first, Sean approves the spend).
4. Next park (Sean pastes its own plant-based list; Universal's terms too).
5. `ve_guide_votes` kinds for parks. Unproven: a report from inside the park, real phone GPS, a signed-in owner run, the $11 buy path.
6. Commit author: these commits are authored as Claude; CLAUDE.md says Sean A. Russell. Sean has not said which to keep.

## Paste prompt for a new chat
ve-theme-park-guide: Logan, Magic Kingdom is live (https://vegansexplore.com/guides/theme-park-guide#/venue/magic-kingdom, main 52e0e8b or later): 16 live spots all pinned, 45 live items, the two hand pins (Aloha Isle, Liberty Square Market) are estimates, the map polish is live, Google ledger $31.42 of $50 left. Read docs/handoff/2026-11-05-ve-theme-park-guide-pins-and-map-polish.md and CLAUDE.md's Vegan Theme Park Guide section, name the playbook first. First action, no spend: screenshot the Guide beside the Stadium & Arena Guide at 1440 and 390 px and show me, so I can lock the look. Then I pick: (1) fix anything I flag in the frame, (2) correct the two pins with coordinates I send, (3) a River banner (quote credits, I approve first), (4) the next park (I paste its list). Build nothing I haven't picked. At wrap-up end with a copy-and-paste prompt in a code block.
