# ve-feedback: Blueprint > Ideas built, stale pass done, one Blueprint next

Date: 2026-11-06 (Eastern). Playbook: `ve-feedback` (also touched: `vegans-explore-launch-playbook`, `vegans-explore-chapter-community-manager-plan`).

## Done and live
- **BrandDesk > Blueprint > Ideas** in HQ (main b63cdb3, production READY, seen as vegan@ at 1440 and 390 px, no errors). Files: `components/branddesk/IdeasView.tsx`,
  `app/api/branddesk/blueprint/ideas/route.ts`, `lib/blueprintIdeas.ts` (+ `lib/__tests__/blueprintIdeas.test.ts`, 6 pass), `supabase/migrations/082_blueprint_ideas.sql` (applied).
  Actions: add (staff or owner); send, own_playbook, park, decline, reopen (owner accounts only).
- **Ideas in it:** 10 New (each with Logan's suggestion), 13 Parked. From ve-feedback: Vegan House, the talent shop, bounty rules + /bounties as one list (Parked);
  website-issues outreach (suggest ve-outreach), partner windows phase 4 (suggest ve-member-profiles-partner-windows). From the stale pass: 16 ideas (7 New, 9 Parked).
  Another chat added two (The Guides, The Supermarket Guide).
- **Stale pass:** Launch to January 1 101 -> 15 open; Chapters and Community Managers 99 -> 36 open. Closed items sit on each Completed tab with a label; moved ones under
  "Moved to Blueprint > Ideas, Nov 6, 2026". Before-copies in table `zz_playbook_close_20261106` (drop when Sean is happy).
- **ve-feedback** is the tweak queue, titled Feedback, 4 open (Sean's header look; https outreach for Happy Zoe, The Vegan Joint, Jolo's).

## Not done
- The sort buttons are unproven (only Sean's owner accounts can sort). Sean's first sort is the test.
- Uploads on Blueprint ideas were proposed and approved, then held: Sean is merging the idea work into one chat.
- Three idea places exist: Blueprint > Ideas (`blueprint_ideas`), Depot > Ideas (`ve_ideas`, `ve-ideas`, bucket `idea-files`, only 2 test rows; handoff
  `2026-11-06-ve-idea-intake.md`, its step 3 "approve starts a build" not built), and the Blueprint build itself (branddesk-production-wing; HQ branch
  `claude/charming-goldberg-kpjmkh` has migration `081_blueprint_projects.sql` for projects per 111-day period).
- `claude/youthful-einstein-orfga1` (the consolidation slug table in CLAUDE.md) is still not merged.
- One-time function `ve-once-qa-session` is the 410 stub again; session signed out (204).
