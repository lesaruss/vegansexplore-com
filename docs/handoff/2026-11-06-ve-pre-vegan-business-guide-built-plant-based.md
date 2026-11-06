# ve-pre-vegan-business-guide: new Overview, plant-based language, 5-group member menu, built

2026-11-06. Playbook `ve-pre-vegan-business-guide`. Sean approved all three in the opening message ("approve the Overview, plant-based
language and member menu, then build").

## Done
- **Overview** (`viewOverview` in `guide-scripts/pre-vegan-business-guide.js`): the approved words from
  `docs/proposals/pre-vegan-business-guide-overview.md`, in the opening-standard order, the same story for visitors and members.
  The 5-step checklist sits under When you finish: visitors see it as a list; members tick each step (Mark done / Done, N of 5 done).
  A tick is a save on the account: `ve-cookbook` `save`, kind `fix`, key `step-1` to `step-5` (no new table; My list ignores step keys).
  Buttons: Take the survey (visitors), Start with What to add (members).
- **Plant-based language** (`canon-ve-pre-vegan-meaning`): every "Vegan options" and "add Vegan" in this Guide is now plant-based
  (or Pre-Vegan) options: tab Why add plant-based, How to say it rewritten (Plant-based, Plant-based options, Hold it to the full
  standard, Say how it is made; lines use PB = plant-based), Get found, Get in, the Coffee shop example, the meta descriptions, Maya's
  name tag. Members' text (`ve_guides.content_html`, `pb-data`) and the survey (`pb_now` prompt and option, `pb_worry`) changed in the
  database; migration `20261106_pre_vegan_business_plant_based_language.sql` (applied, checked). Stored survey answers keep their values.
  "Vegan" stays where it means people who eat Vegan, or a product label ("Bars that say Vegan on the label").
- Tasting nights on What's next now say what one is (invited members taste your dishes, honest feedback, anonymous to you), still Coming.
- **Member menu**: the Events Guide's `GROUPS`, `drawMenu`, `setDD`, `groupCrumb`: Start here, Learn it (Why add plant-based, How to say
  it), Add it (What to add, Sourcing, Buy or make), Get found (Get found, Claim your page), Your list (My list, What's next). One
  dropdown at every width for members, a group page of tiles (`#/g/<learn|addit|gofound|yours>`), crumbs name the group, Back / Next walk
  Start here then each group page and its sections. Visitors keep the flat tabs.
- **Maya's -v2 recordings** in her voice (`sM8RysETdBj1LIqLd9tl`, eleven_multilingual_v2, Vegan spoken from "Veegan"), each checked word
  for word with el-media `stt` (only capitals and commas differ): `overview-v2`, `overview-member-v2`, `why-v2`, `say-v2`, `found-v2` in
  `vegan-media/media/maya/pre-vegan-business-guide/`. The -v1 files stay. Wired in `AUDIO_V` / `AUDIO_M`.
- Checked at 1440 and 390 px beside the Restaurant Guide (same family): visitor against the live functions, member against mocked
  answers; no script errors, no sideways scroll; a tick sent the right save.

## Notes
- el-media adds `media/` to `path` itself: pass `maya/...`, not `media/maya/...`. The first two takes landed at
  `vegan-media/media/media/maya/pre-vegan-business-guide/overview-v2.mp3` and `overview-member-v2.mp3`; unused, harmless, delete in
  Storage when convenient.
- Group pages have Maya's line as text with no Play: 4 short lines (`GROUPS[].say`) are drafts for Sean to read, then record as
  `g-<group>-v1.mp3`.
- Not changed (needs Sean): the supplier label "Offers vegan options" in Sourcing (shared with the Restaurant Guide), the Directory's
  "Vegan options" listing label, the Restaurant Guide and the certification copy.
- Not proven: a real member ticking a step against the live `ve-cookbook` (mocked in the browser).

## Waiting on Sean
1. Read Maya's 4 group-page lines (in `GROUPS`), then record.
2. Launch: a banner (Higgsfield credits), noindex off, the sitemap, the catalog card. The `ve_guides` row already reads `published` true.
