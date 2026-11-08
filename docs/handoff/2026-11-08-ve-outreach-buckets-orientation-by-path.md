# ve-outreach-buckets: orientation by path, test sends and cohort 1 Wednesday fill

2026-11-08, Logan. Branch `claude/elegant-mayer-2pbpg1` in vegansexplore-com (66244b0) and lesaruss-hq (0eb3187). Not merged.

## Done
- **Tests never count as the person**: ve-links skips preview clicks (`?preview=1`) and takes back a super admin's own click on a personal link (marked bot). HQ campaign tests go only to a lesaruss.com address; "Send tests to" and "Send all N" on each campaign email box.
- **Orientation by path** (migration `20261108_orientation_explorer_paths.sql`, applied live): six people campaigns, three notes from the team a week apart, first the day after: `orientation-explorer`, `-restaurant`, `-events`, `-creator`, `-nonprofit`, `-business`. `ve_orientation_sync()` (cron `ve-orientation-sync`, every 15 min) enrolls Explorer finishers with no path badge; a path badge stops the Explorer row ("moved to <slug>") and starts the path one; one path at a time; only completions after the later of start day (2026-11-09) and approval count. Each has a stopped sample member (contact@lesaruss.com) for previews and tests. All **draft**.
- HQ Outreach > Campaigns > Orientation lists the six as normal campaign pages (edit, lock, test, approve with an "always on" confirm); the People tile leaves them out.
- Proven in a rolled-back transaction: Explorer enroll, then a restaurant badge moved the person.

## Open (Sean)
1. Merge `claude/elegant-mayer-2pbpg1` in HQ and VE.
2. Read, lock and approve `orientation-explorer` first, then the path ones.
3. When `orientation-events` is approved, turn off ve-nurture `nurture.door_on` (Events Guide Day 3 and 7) so hosts are not mailed twice.
4. Lock and approve cohort 1 (`founding-cohort-1-2026-11`, start Mon Nov 9).

## Open (Logan)
- Wed Nov 11, 8:15 AM ET (scheduled reminder): deploy `scripts/supabase-once/founding-wed-fill.ts` as `ve-once-founding-wed`, run `show` then `fill`, back to the 410 stub, test-send the three follow-ups to contact@lesaruss.com.
- Unproven: the admin-click take-back with a real session; HQ test controls and the Orientation page seen signed in; any real send.
