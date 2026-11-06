# ve-signature-dishes: Signature dishes on claimed food listings

Locked by Sean 2026-11-06 (canon `canon-ve-signature-dishes`). Every claimed food listing can feature its signature dishes on its
Overview. A perk of claiming. It never replaces the menu.

## The rules (locked)

- **Who**: any owner of a food listing (Restaurants, Bakeries & Cafes, Food Trucks, Vendors, Catering, Meal Prep) whose claim Sean
  approved (`listings.owner_member_id`), member or Partner. Super admins can edit any.
- **Slots**: up to 5 featured. Slots 1 to 3 are free. Slots 4 and 5 are **50 points a slot for 30 days**, paid from the owner's own
  member balance, never renewing on their own; when a slot lapses its dish stays saved, just not featured. More dishes can be kept
  saved (not featured), up to 20.
- **A featured dish needs** a name, a real photo (at least 800 px on the shorter side) and one line. Optional: a price, tags, a link to
  the item on their menu. A dish with no photo can be saved, not featured.
- **The owner sets the order**. Votes never change it.
- **Votes**: Passport holders, one vote per dish, can take it back. The count shows on each dish. An owner cannot vote on their own
  dishes. Signed out, the members-only window.
- **Never replaces the menu**: the Menu tab and `ve_menu_items` are untouched; a dish can point at a menu item.

## The A-to-Z list

| | Item | Owner | Done when |
|---|---|---|---|
| A | Lock the canon | Logan | `canon-ve-signature-dishes` is in `knowledge_records` and its migration file is in the repo. |
| B | Open the playbook | Logan | `ve_playbook_index` row `ve-signature-dishes` reads Building with this list's next item, and this file is in the repo. |
| C | The data | Logan | Migration `20261106_signature_dishes.sql` is applied: `ve_signature_dishes`, `ve_dish_votes`, `ve_dish_slots` (RLS on, no policies), the ledger reason `dish_slot`, `ve_dish_slot_buy` taking 50 points from both balances once per slot period. Checked with a SELECT. |
| D | The edge function | Logan | `ve-signature-dishes` is deployed (verify_jwt off, member token checked inside, standing check on writes): public `list`, member `vote`, owner `owner_get`, `save`, `remove`, `order`, `photo_url`, `photo_done`, `slot_buy`. Source in the repo matches the deployed source. |
| E | The owner's editor | Logan | The business dashboard has **Signature dishes** (`?tab=brand&pd=dishes`, one dish per view, copied from its Menu view): add, edit, photo, feature, order up and down, remove, buy slot 4 or 5. Screenshotted beside the Menu view at 1440 and 390 px. |
| F | The Overview section | Logan | A claimed food listing's Overview shows **Signature dishes** (featured, owner's order, photo, name, line, price, tags, vote count and Vote). Screenshotted beside the page's other Overview sections at 1440 and 390 px. Shows nothing when there are none. |
| G | Proof with a test dish | Logan | On a food listing, with a [TEST] dish: added as owner, refused without a photo when featured, a fourth featured refused until slot 4 is bought (50 points taken once), voted by a member once and taken back, the owner refused voting on their own dish, a stranger refused editing; then every test row removed and the points put back. |
| H | The words | Logan | `/policies#business` names signature dishes and the 50-point slots, `ve-guide-platform-facts` and one saved answer say the same, and CLAUDE.md has the section. |
| I | Merge to main | Sean | Sean says merge, it is on `main`, and the live page is checked at 1440 and 390 px. |
| J | Slot reminder email (**un-parked 2026-11-06, built off on a branch, draft with Sean**) | Logan | A note 3 days before a paid slot ends is built **off** and shown to Sean as a draft; it sends only once he approves it. |
| K | Top Vegan dishes by chapter (**un-parked 2026-11-06, proposal with Sean**) | Logan | A ranking of the most voted featured dishes per chapter, brought to Sean as a proposal (where it shows, how ties break) before it is built. |

The playbook is closed when A through I are done and each later item (J, K and any added below them) is either done or parked by Sean.

## Status

Done 2026-11-06: A to H built and proven, I merged to `main` (Sean: "Merge to main"), J and K parked by Sean. The playbook is closed.

Un-parked 2026-11-06: J built in `ve-nurture` off and undeployed (migration `20261106_dish_slot_reminder.sql` not applied), K written up as a proposal; both in `docs/proposals/signature-dishes-j-k.md`. Waiting on Sean.
