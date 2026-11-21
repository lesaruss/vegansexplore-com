# Handoff 2026-11-21: Nutrition Guide chat (2026-11-14 to 15), wrapped

Playbook: `ideas-intake` (decision rows 2026-11-14 to 15). Canon touched: `canon-ve-guide-roster` (`looks_locked_v1`).

## Live (all on main)
- **Ideas 111326**: full ThanksLiving menus (The Rabbit Hole, all 11 items; Joy's Green Kitchen; Not Ya Average Leaf, new listing in Birmingham;
  Da Meat Up and My Hungry Vegan restored in Riverview, FL); December events (Critter Creek Moo-ket Dec 6, Philly Vegan Social Club and Vegan Kween
  spin Dec 5, Vegans in Clermont Winter Solstice Soiree Dec 20). Migration `20261114_ideas_111326_menus_events.sql`.
- **Nutrition Guide** (`/guides/nutrition-guide`): Courses tab (11 courses read through `ve-web-reader`); the redesign onto the Welcome Guide's shapes;
  Theo's own scene on every page, drawn from his original (`ddc4b75d`); asset packs in `vegan-media/media/guides/nutrition/<name>/<shape>.jpg`;
  the signed-out blank-page fix (`offerLine`). History: `docs/history/guides-topic.md`.
- **Theo's voice on every tab**: 16 clips in `vegan-media/media/voices/nutrition-guide/`, made with el-media tts on 2026-11-15 after Sean approved
  the lines. Since 2026-11-16 Sean records every Guide line himself in BrandDesk > Voices (CLAUDE.md, Guides): these clips stay until Sean re-records
  them his way; nothing was changed for that.
- **Theo and Maya look lock**: rule in CLAUDE.md (Guide scenes recipe) and canon. Avatars `theo-v4.jpg` and `maya-v5.jpg` (Sean: "Theo's profile
  avatar... is too light... same thing with Maya"), merged in this wrap (they had stayed on the branch while canon already named them).

## Open (parked, nothing waiting on a decision)
- Drop `public.tmp_ng_stt` and `public.tmp_ng_stt_next()` (harmless leftovers of the stt checks; the connector held the drop twice for an approval
  that never showed). Migration `20261115_drop_tmp_nutrition_stt.sql`; run it through a one-time function if the connector holds it again.
- Vibe Vegan and Vegan Byy Nature menus: no city found, not listed.
- Forks Over Knives and ACLM courses: their pages did not open in the reader.
- Joy's Green Kitchen menu slides 2 and 4 were not in the screenshots.
- The ve-social-schedule chat's branches `claude/sweet-ritchie-oiq411` and `claude/optimistic-goodall-fa2j04` held other unmerged work as of 2026-11-15
  (not this chat's to merge).
