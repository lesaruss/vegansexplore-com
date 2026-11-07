# branddesk-production-wing: Depot analytics into BrandDesk Insights, step 1 (2026-11-07)

## Done
- **BrandDesk > Vegans Explore > Insights has five new toggles** (lesaruss-hq branch `claude/adoring-fermi-3r3lbx`, 1e696a4 and bcc9f5c, **not on HQ main**): Chapters (the Depot's chapter ranking: pick columns, rank by any, kept per computer), Site sections (Directory with its most visited listings and section addresses, Events, Media, Daily Pulse, Guide tabs; `?isub=`), Members (Who joined and home chapters; What they told us = Community Insights, by chapter), Costs (the Google ledger: spent against the $50 cap, today against the daily caps, approved scans, every request by day and job), Health (Platform health). Vegans Explore only. Files: `components/branddesk/InsightsPlatform.tsx`, `lib/vePlatformInsights.ts`, wired in `InsightsRoom.tsx` and `app/api/branddesk/insights/route.ts`.
- **Data, no new edge function**: `ve_report` calls `ve-analytics` with the admin token (it already took it); `ve_members` is the deployed `ve-insights` tally ported to HQ, counting the same people; `ve_health` reads `ve_ops_snapshot(null, true)`. All three refuse anyone who is not a super admin.
- **Platform health was timing out, fixed** (migration `20261107_ops_snapshot_cron_one_pass.sql`, applied): `ve_ops_snapshot` read `cron.job_run_details` (320,306 rows, no index on job or time) once per job, 8.4 s, past the API's 8 s limit, so the Depot's Platform health and the new Health toggle both answered load_failed. Now one pass over the last 24 hours: 0.2 s, same 7 checks.
- **Checked signed in** as `vegan@` on the branch preview at 1440 and 390 px: every view loads real numbers, no script errors, no sideways scroll. The QA session came from the one-time `ve-once-qa-session` (back to the 410 stub, version 34) and was signed out (204).
- a40da58 (Depot clean-up) is still only on `claude/compassionate-newton-md1a49`: Sean has not said merge.

## Not changed
- No Depot page is retired. Analytics, Community Insights and Platform health stay until Sean says the Insights versions work.
- Depot > Analytics' Top pages, Traffic sources, Places, Campaigns and Ads are already in Insights > Web, Ads and Campaigns (Web reads the brand's own GA property; check they agree before retiring the Depot page).

## Noticed, not fixed
- Health's "Active Passports" reads 0: `ve_ops_snapshot` counts `membership_tier = 'passport'`, which the survey-only door no longer sets. Needs a new label or count (Sean's wording).
- Costs shows the ledger's list-price spend ($21.09 of $50); the Depot page showed the old free-tier estimate ($0.00).
- Chapters' table scrolls sideways inside its box when many columns are on.

## Next (in order)
1. Sean looks at the five toggles; on his word, merge the HQ branch and retire Depot > Analytics, Community Insights and Platform health (trash bin, kept by address).
2. Outreach Roster "who" filter; commission payouts to Insights.
3. BrandDesk Clients room.
4. Read-only member list in the Depot.
