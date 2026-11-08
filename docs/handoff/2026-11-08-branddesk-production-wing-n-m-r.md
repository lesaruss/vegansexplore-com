# branddesk-production-wing: N one idea store, M Send to drafts, R max_tokens (2026-11-08)

## Done and live (merged by Sean: vegansexplore-com main 1bd9617, lesaruss-hq main 17c2f33)
- **N**: `ve_ideas` is the one idea store for Depot > Ideas and BrandDesk > Blueprint > Ideas. 30 Blueprint ideas moved with their ids and history; old table kept as `blueprint_ideas_retired_20261108`; `blueprint_ideas` is a view over `ve_ideas`. One status list (new, approved, building, done, sent, own_playbook, parked, declined). HQ has a Building chip. Seen signed in (QA login) at 1440 and 390 px.
- **M**: Send it to on an idea's Depot page. Daily Pulse: a draft story per chapter and date, Sean approves (only live features go in a Pulse). Podcast: a proposed Kai segment on the next episode in planning; none while this week's is Ready.
- **R**: every 5.x Claude call at 16000 tokens with cut-offs caught; 11 VE functions, 4 HQ files, 2 HQ functions deployed.

## Not proven
- Sean approving a Pulse draft with his own token in the browser (the approve path was proven in a rolled-back transaction).
- The sort buttons as an owner (J) and adding an idea from HQ (the QA login is view only).

## Next
1. Sean: J (one owner click on the Ideas sort buttons), merge 75b8223 ("Where I looked"), the 19 lookbook decisions, the chapter 5 line.
2. Logan: retire `blueprint_ideas` (the view) once nothing reads it; Send to from HQ's Blueprint too if Sean wants it there; the Depot tour video after the lookbook.
