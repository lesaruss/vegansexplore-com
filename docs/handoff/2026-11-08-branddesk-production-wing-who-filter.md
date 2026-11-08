# branddesk-production-wing: ideas live in the Depot, the Outreach Roster's Who filter

Date: 2026-11-08 (Eastern). Playbook: `branddesk-production-wing`. Logan, build mode.

## Done
- **Ideas live only in Depot > Ideas.** Sorting (Send to a playbook, Its own playbook, Park, Decline, Open again) moved into `ve-ideas` (v12, super admin token only; ops refused `sean_sorts`) and the Depot page (Sort it, Where I looked, History). HQ's Blueprint > Ideas tab, route and helpers are deleted; an old `?b=ideas` link shows a pointer. Merged by Sean: VE main bd098e1, HQ main 4333630.
- `sort_own` now refuses a slug used by a page, a `ve_playbook_index` row or a playbook record. Its first test overwrote the `branddesk-production-wing` index row; restored from the seed and the handoff (its exact earlier stage and next action are lost).
- **Outreach Roster Who filter** (Sean's "2": work the queue). BrandDesk > Vegans Explore > Outreach > Roster has a Who dropdown: Businesses plus ten people groups, read only, each person opening the Depot page that still does the work. `ve_people_who` is live (service role only). Counts on 2026-11-08: members 12, Founding 9, Ambassadors 2, leads 16, invited 2, role applications 2; the other four empty. Typecheck clean, 131 HQ tests pass, checked with mocked data at 1440 and 390 px.

## Waiting on Sean
- Say "merge" for HQ `claude/bold-feynman-esaemy` (493e100) and VE `claude/bold-feynman-esaemy` (c569e12 plus this wrap).
- The 19 lookbook decisions in Depot > Guides > Guides and tours; the chapter 5 line.
- When he approves a Daily Pulse draft from Send to: he names the chapter and date, Logan checks it lands that morning.

## Logan next
1. After merge: check the Who filter, Depot > Ideas and BrandDesk's Ideas pointer signed in at 1440 and 390 px.
2. A BrandDesk Clients room in HQ (Depot > BrandDesk clients' job: onboarding, Library, check-ins, rotation), on its own branch, shown before it goes live.
3. A read-only member list in the Depot.
