# ve-feedback: playbook consolidation plan (proposed 2026-11-05, Logan; run the same day with Sean's changes)

**Done 2026-11-05.** Sean's answers changed three things:
- **#8, #9:** the founding tables, the Launch Community Night (Nov 13 and 14) and the Palm Beach dinner are off. New idea, not confirmed: a New Year's Eve
  community night in several cities, only with a sponsor. It is in Launch to January 1.
- **#10:** not merged. Group Partners, Nonprofit Partners, and Ambassadors and creators stay separate. The bounty rules and the talent shop go to the
  Blueprint as ideas (today `ve-feedback`, which the Blueprint's Ideas tab points at). Vegan House went there too.
- **#11:** not split. `ve-pathways` and `ve-outreach-buckets` merged into a new `ve-outreach` (leads, bringing in new people, the doors included).

Open playbooks: 45 before, 28 after. Every merge was checked live in BrandDesk. The old-to-new slug table is in CLAUDE.md, Playbooks section.
Next: the Blueprint absorbs feedback and becomes the sorter of ideas (Sean; not built).

---


Sean, 2026-11-05: "some of them seem to overlap... check to see which ones are the same and then scan them in the groups, see what's the
same, what is the most updated information, and then suggest a consolidation plan." Pulled into `ve-feedback` to work as its own item.

On 2026-11-05 BrandDesk > Vegans Explore > Blueprint listed 52 Vegans Explore playbooks (`briefings` type playbook), about 30 of them open.
After the merges below, about 27 are open; the finished ones go under Show done.

**How a merge works (nothing is deleted).** The playbook that stays gets its page rebuilt from the active template (v3, through the
`lesaruss-playbook` skill): the current state, the open items carried forward, and Decision History read from both slugs' records. Each merged
playbook gets a `playbook_records` row saying "Merged into <slug>", its `briefings` row is set `archived` (it leaves the Blueprint list), and its
`ve_playbook_index` row is set done with the same note. Each merged playbook keeps the highest rating any of its parts had (`blueprint_playbook_focus`).
A Guide link (`guide_playbooks`) that pointed at a merged playbook points at the one that stays. After each merge, check it live in BrandDesk.

## Merges

| # | Merge | Keep as | Why | Out of date |
|---|---|---|---|---|
| 1 | `vegans-explore-podcast` + `ve-podcast-studio` | `ve-podcast-studio` | Both are the weekly show; Studio (Nov 5) is where it is made. | Oct 31 relaunch notes |
| 2 | `podcast-network-transcript-upload` + `ve-content-index` | `podcast-network-transcript-upload` | Transcripts moved here Nov 3; Content Index is done. | Content Index's Step 1 |
| 3 | `ve-events-platform` + `ve-event-host-path` | `ve-event-host-path` | Platform's Promote packages are the host path's extras; Foodie Fest is its first case. | Platform last touched Oct 28; package pricing replaced ($149, $279, $499) |
| 4 | `vegans-explore-guides` + `vegan-dairy-guide-content` + `ve-nonprofit-guide` + `ve-venue-guides` + `ve-guide-accounts` | `ve-guides` | Rule: a Guide with active work keeps its own playbook (Restaurant, Events, Theme Park, Supermarket, Sourcing); a launched Guide rolls into `ve-guides`. Relink Dairy, Nonprofit, Stadium & Arena and Airport in `guide_playbooks`. | Oct 7 pricing (All Access, credits; credits retired Oct 25) |
| 5 | `ve-supermarket-guide` + `ve-store-scan-search` | `ve-supermarket-guide` | Both parked waiting on the same supermarket sponsor. | None |
| 6 | `ve-business-hub-ad-console` + `vegans-explore-brand-partner` + `ve-campaign-engine` + `ve-verified-tours-hunt` | `ve-business-hub-ad-console`, retitled Business offer | All four are what a business can buy; `ve-front-of-house` (BrandDesk $500 a month) stays separate. | VE Verified $250 and Anchor $500 (no members); Brand Partner "$111 a quarter" is now $111 every 111 days; Campaign Engine is Oct 4 ideas |
| 7 | `ve-directory-banners-chapters` + `ve-community-directory` | `ve-community-directory`, retitled The Directory | Both are build logs for the same Directory. | None |
| 8 | `vegans-explore-chapter-community-manager-plan` + `vegans-explore-how-to-launch-a-chapter` + `vegans-explore-onboarding-playbook` | `vegans-explore-chapter-community-manager-plan`, retitled Chapters and Community Managers | How to Launch was written under the plan; the third holds the Community Manager certification. | Palm Beach founding table Nov 13, Florida filing Oct 15, the old 6-slide onboarding; check Vegans Explore Inc. references (being dissolved) |
| 9 | `vegans-explore-launch-playbook` + `explore-season-partners-guide` + `ve-relaunch-promotion` | `vegans-explore-launch-playbook`, retitled Launch to January 1 | Three launch plans; relaunch promotion's post rules go to `ve-social-studio`. | Ron's venue (closed Oct 6), Palm Beach dinner with no venue, Launch Community Night Nov 13 and 14; Dolphins game Nov 29 still live |
| 10 | `ve-group-partners` + `ve-nonprofit-partners` + `ve-ambassadors-talent-shop` + `ve-bounties-lifecycle` | new or kept slug, Partner programs | Each built and waiting on Sean; Pathways (Oct 29) called these one engine; bounties are the Gig Board now. | Bounty Lifecycle's Oct 4 rules |
| 11 | `ve-pathways` + `ve-outreach-buckets` | split: `ve-pathways` = Membership doors (survey door, Welcome, Founding, points); `ve-outreach-buckets` = Outreach and people (people sender, tags, person page, campaign homes) | Pathways grew into two jobs. | Pathways' stage describes the Restaurant Guide, which moved out Nov 4 |

## Mark Done
`ve-content-index` (in #2), `ve-member-profiles-partner-windows`, `ve-money-in`, `ve-pricing-points-passport` (merged into pathways Nov 3), `vegan-house-series` (one idea record; to Ideas).

## Leave alone
`ve-feedback`, `ve-abuse-watch`, `ve-spend-budget`, `ve-depot-brandesk-reconcile`, `ve-universal-search`, `ve-social-studio`, `ve-front-of-house`,
`ve-daily-pulse-discussion`, `ve-restaurant-guide`, `ve-events-guide`, `ve-theme-park-guide`, `ve-vegan-sourcing-guide`,
`vegans-explore-initiative-business-certification`, `universe-report`.

## Sean's calls (defaults used if he says nothing)
1. #8 and #9: are the Palm Beach founding table, the Launch Community Night (Nov 13 and 14) and the Palm Beach dinner still on? Default: carry them forward marked "not confirmed".
2. #10: one Partner programs playbook, or keep the three? Default: one.
3. #11: the split above. Default: as written.
