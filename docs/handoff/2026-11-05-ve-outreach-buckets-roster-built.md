# ve-outreach-buckets: the Outreach Roster is built on a branch; Sean's next direction (simpler, tiles, master profile)

Date: 2026-11-05. Playbook: `ve-outreach-buckets` (parent `ve-pathways`; the Restaurant Guide is `ve-restaurant-guide`). Everything below is on the assigned branch `claude/quirky-hawking-7xrux2` in both repos; **none of it is on `main`**.

## Done
- **Migration `supabase/migrations/20261105_outreach_roster.sql`, applied live** (this repo, branch commit "Outreach roster migration"): `ve_outreach_campaigns` (slug, name, door, guide_slug, categories, vegan_only, status), `ve_outreach_campaign_members` (many rows per person; one active row per campaign and listing), and service-role functions `ve_outreach_roster(...)` (server-side filters, counts, paging), `ve_outreach_campaign_add`, `ve_outreach_campaign_remove`. Named apart from an existing, unrelated `ve_campaigns` table (uuid id, brand_slug, title, target_date): do not touch it. Nine campaigns are seeded (one per door, plus `creator-guide`: Content Creators and YouTube, and `nonprofit-guide`: Nonprofits, Rescues, Sanctuaries; the presets are Logan's defaults). Roster statuses: Unverified, Hot lead, Member, Unsubscribed (any active `email_suppressions` row, or contact opted_out/bounced). Proven in rolled-back blocks: add, repeat add, a second campaign for one person, remove, unknown campaign, unsubscribed refused. Live counts 2026-11-05: 2,382 approved listings, 2,377 unverified, 4 members, 1 unsubscribed, 0 hot leads. No members left behind, no city on.
- **HQ (`lesaruss/lesaruss-hq`, branch `claude/quirky-hawking-7xrux2`, last commit 26d7486)**: BrandDesk > Vegans Explore > Outreach has a new first tab **Roster** (`components/branddesk/PeopleRoom.tsx` `Roster`; `lib/veOutreachRead.ts` `readRoster`, `readRosterMeta`, `rosterCampaign`; `app/api/branddesk/people/route.ts` GET `p=roster|roster_meta`, POST `campaign_add|campaign_remove`). Status chips with counts, filters (city, type, Fit for a Guide, In campaign, Email, search, 100% Vegan only), the view in the address bar, a tick column, a sticky bar to add the ticked rows, and a Choose campaign menu per row on desktop. **Phones show one tile per listing** (checkbox, letter square, name, type and city, tags, a plus top right; the plus opens a menu: add to or take out of a campaign, see email and details, open the listing; tapping the tile opens a details sheet). Adding to a campaign only records membership; nothing is emailed. Checked at 1440 and 390 px against mocked answers only (no script errors, no sideways scroll). A preview build exists for 26d7486 (Vercel branch preview, needs a share link from `get_access_to_vercel_url`).
- Earlier this session (checked, no change needed): HQ production for main 9855976 (#152) READY; `ve-outreach` v25 ACTIVE; no city on (14 city lists off; only `event-hosts` enabled).

## Not verified
- The Roster signed in on real data. Sean opened the preview and said it is "getting there" but "complicated".
- Logos (tiles show the first letter). One-email-a-day-across-campaigns guard is not built (Sean agreed the default: a second email slips to the next weekday, each message still approved by him). Roster tour and recording do not exist (V has a text-only line, `people-roster`, no `ver`).
- `ve-restaurant-guide`'s index row (2026-11-05) says the Guide is proven live through a signed-in click-through and a real `/go/bo-` link with a TEST contact. Read that row and its records before re-proving anything. Whether "What's next" and the guidance after membership are complete is **not confirmed**.
- The deployed `ve-outreach` hash: Supabase's `ezbr_sha256` for v25 is `2e4481...`, the handoff's source sha256 is `fb3250...`; they hash different things and were not compared against main's source.

## Sean's direction at wrap-up (2026-11-05), recommended answers in brackets; not built, not locked
1. **Simpler, intuitive: two tabs, Roster and Campaigns** (Send days and People fold into a campaign).
2. **Door first.** Listings arrive sorted by the door they could enter (category to door), with city as a filter. One door at a time; **restaurant first**, push it, tweak, then apply the restaurant template to the other doors.
3. **Confirm the flow of each door**: they are guided to membership and keep being guided after. Verify end to end with a [TEST] contact before staging anyone; report what is missing.
4. **Tapping a name opens a master profile in a window** (close and it goes away; the ticks stay). It shows the listing plus backend information: survey answers, emails sent, notes, campaigns, tags (the Depot's `ve-person-profile` has most of this). The details sheet already built is its seed.
5. **Search sits directly above the list**; filters behind one Filters button with a count (as the Directory does).
6. **The campaign text on a row is the picker** (tap "Creator Guide" or "None" to open the choices); the separate dropdown goes.
7. **The tour must be evergreen**: no numbers or states in V's lines (today's say "nothing has gone out" and "restaurant is the only one that's ready"). Rewrite and re-record as -v2; needs Sean's approval of the wording.
8. **Campaigns as department-style tiles**: a tile per door, then its scheduled campaigns by day, then one campaign (people, the three emails, schedule, approve). Unscheduled groups stay out of sight until scheduled. City switches and the cities table leave the front page; sending is approved inside a campaign.
- Assumption Logan stated and Sean did not contradict: a campaign is "this group gets the three-email sequence starting on a date", and may span cities.
- **Engine change needed for 8**: sending is per city list and per send day (batches are per city); campaign-based scheduling means a campaign becomes one or more city batches under the hood, and the "city on" gate needs a decision. Talk it through with Sean before building.

## Next actions
1. **Logan**: read the `ve-restaurant-guide` row and records; verify the restaurant door flow end to end (email link, Guide, survey, membership, what comes after) with a [TEST] contact; report what exists and what is missing.
2. **Logan**: rebuild Outreach as Roster plus Campaign tiles with the master profile window (items 1, 2, 4, 5, 6, 8). Show a mock or screenshot before merging.
3. **Logan**: make the tour evergreen (item 7); Sean approves the new lines first.
4. **Sean**: stage the first restaurant campaign only after the flow is verified; he reads each email and where it was found, approves each send day, and turns each city on. London and Washington D.C. still fail Find emails (`WORKER_RESOURCE_LIMIT`, not diagnosed).
5. Merging the HQ branch to HQ `main` waits for Sean's go.

## State
No email has gone to a business; no city is on. Commit author is still undecided (Claude `<noreply@anthropic.com>` used; CLAUDE.md's Deploy rule says Sean A. Russell).
