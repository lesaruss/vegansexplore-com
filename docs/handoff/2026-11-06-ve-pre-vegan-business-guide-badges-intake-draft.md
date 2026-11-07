# ve-pre-vegan-business-guide: business badges, intake questions drafted (2026-11-06)

## Where it stands
- **Built and live (on `main`)**: the Pre-Vegan Business Guide's new Overview, the plant-based language sweep, the members' 5-group menu, Maya's -v2 lines
  (migration `20261106_pre_vegan_business_plant_based_language.sql`).
- **Locked by Sean ("lock it")**: the four business badges, canon `canon-ve-business-badges` (migration `20261106_business_badges_canon.sql`, main f91065b):
  100% Vegan, 100% Plant-based, Pre-Vegan Certified, Pre-Vegan. The owner's own answers decide Vegan vs Plant-based; we never judge it; our team checks
  before 100% Vegan shows. Never name a real business as an example.
- **Drafted, not built**: the intake questions that decide the badge, `docs/proposals/business-badges-intake.md` (branch `claude/eloquent-ramanujan-phynor`,
  41b2dae, not on `main`). Shown to Sean in plain words; waiting for his answer.

## The draft in short
1. Is everything you sell plant-based? (Yes / No, also animal products / Not yet)
2. If yes: Vegan (for the animals) or Plant-based (all the food is plants). "Both are respected. There is no wrong answer."
3. If Vegan: animal products kept out of other things too (honey, bone-char sugar, some wines, leather, cleaning products)? Yes all / Mostly / Not yet
4. If not all plant-based: want help? Certify some items / Add plant-based items / Not right now

Badge: Vegan + Yes all = 100% Vegan after the team check; Plant-based = 100% Plant-based; not all plant-based = Pre-Vegan.
Pre-Vegan Certified only comes from item checks (Standard V1.2). Q1 replaces "How Vegan is what you run?" (`vegan_level`); "Mostly Vegan" goes away.

## Open for Sean (Logan's defaults)
1. Q2 wording.
2. Vegan + "Mostly" on Q3 shows 100% Plant-based for now, team follows up (default).
3. About 20 to 25 points a question, like the other intake questions (default).

## Still waiting on Sean (earlier)
- Approve the overview-member line; Maya's 4 group-page lines (to record as `g-<group>-v1`).
- Launch the Pre-Vegan Business Guide (banner, noindex off, sitemap, catalog card).
- The Directory's "Vegan options" label change (later, only with Sean).

## Housekeeping
- Stray files at `vegan-media/media/media/maya/...` (el-media prefixes `media/`; pass `maya/...`) to delete.

## Next (Logan, after Sean says approved)
Build the intake: change the shared `vegan_level` question (`e_vegan`, `r_vegan`) into Q1, add Q2 to Q4 as shared questions, a badge preview the owner sees
and can change, the team check queue for 100% Vegan, then the badges on listings. Communicate with Sean in short, plain, numbered points.
