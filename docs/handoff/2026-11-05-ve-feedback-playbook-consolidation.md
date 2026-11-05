# ve-feedback: playbook consolidation (handoff, 2026-11-05)

## Done this session (ve-theme-park-guide, then ve-feedback)
- 16 open Vegans Explore playbooks had records and a Depot index row but no BrandDesk page, so Blueprint did not list them (the Theme Park
  Guide among them). Each now has a `briefings` page (type playbook) from the active template v3 with a live Decision History, and all 9 live
  Guides link to their plan in `guide_playbooks` (Theme Park, Restaurant and Events to their own; Creator and Nutrition to `ve-guides`).
  Checked live as the QA account: 16 of 16 listed, no Guide reads No playbook yet, Work Queue tabs switch on all 16.
- CLAUDE.md (Playbooks section): every open playbook gets its BrandDesk page the day it opens. Commit 6451b27 on branch
  `claude/epic-feynman-gzmy1f`, not on main.
- The consolidation plan: `docs/proposals/playbook-consolidation.md`. Proposed only; nothing merged.

## Not done
- No merges run. Sean's three calls are in the plan.
- 23 older or finished threads with records but no page (e.g. `ve-door-guides`, `ve-dashboard-roadmap`, the Plant-Based Showcase, the Dolphins
  campaign) were left alone; the last two are `status-brief` type, so Blueprint skips them.
- ve-theme-park-guide's open picks are unchanged: prove an owner vote, the two hand pins, a River banner, the next park.

## Part 2, later Nov 5: the merges, run with Sean's answers

### Sean's answers
1. **Events:** founding tables, the Nov 13 and 14 Launch Community Night and the Palm Beach dinner are off. Instead, a New Year's Eve community night in
   several cities, built on the groups that already host, only with a sponsor ("If not, then we won't do it"). Not confirmed; in Launch to January 1.
2. **Partners:** keep them separate (Group Partners, Nonprofit Partners, Ambassadors and creators). The talent shop and the bounty rules go to the Blueprint
   as ideas. The Blueprint should also absorb feedback and be the sorter of every idea.
3. **Outreach:** Pathways becomes Outreach. One playbook for leads and bringing in new people.

### Done
- `ve_pb_merge` and helpers (migration `20261105_playbook_merge_helpers.sql`; `ve_playbook_index.goal` now defaults to `''`). Applied through the connector.
- 11 merges, in the plan's order, each checked live as the QA account (list, status, rating, Guide links, page counts, no page errors). 45 open to 28.
- New slug `ve-outreach` (Outreach), page from the active template. `ve-ambassadors-talent-shop` retitled Ambassadors and creators. `ve-feedback`
  retitled Feedback and ideas. A record in `ve-social-studio` takes the relaunch post rules.
- CLAUDE.md Playbooks section: the old-to-new slug table.
- `ve-once-qa-session` minted once, signed out (204), back to the 410 stub; key and session deleted from the scratchpad.

### Not done
- **The Blueprint as the sorter of ideas.** BrandDesk > Blueprint > Ideas still points at `ve-feedback`. This is an HQ build (`BlueprintRoom.tsx`,
  `app/api/branddesk/blueprint`); Logan brings Sean a proposal first.
- The carried items on the bigger pages (Launch to January 1: 101 pending; Chapters and Community Managers: 99) are as written, under their own labels.
  They need a pass to close out what is stale.
- `universe-report` and `ve-daily-pulse-discussion` have pages but no index row.
- HQ rewrites each playbook's Status box itself when it is opened (`lib/playbookStatusUpdate.ts`). The status line written at merge time is the page's
  context banner.
