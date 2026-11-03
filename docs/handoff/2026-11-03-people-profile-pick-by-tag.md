# Handoff 2026-11-03: ve-pathways: the person page and pick by tag

Playbook `ve-pathways` ("Three doors and campaigns on people"). Branch `claude/affectionate-cannon-8yr8ji`, merged with `main` before every push.

## Done
- **ve-pathways: profiles step 2, the person page.** Depot > People > People (`/admin/depot/people`, `#list/<tag>`, `#person/<key>`). Edge function `ve-person-profile` (v1, 8d6a5c9): list, get, tags, tag_add, tag_remove (reason required), note_add, give_points, take_points. One timeline of emails sent, opened, clicked, bounced, actions, tags, notes and points. Proven live through `ve-once-person-proof` (now the 410 stub); page checked at 1440 and 390 px beside the Watchlist.
- **ve-pathways: profiles step 3, pick by tag.** Tag chips and a tag filter in Depot > Outreach > Pick people, tags as badges on each row. Migration `20261103_pick_by_tag.sql` (applied; `ve_founding_candidates` gained `p_emails text[]`), `ve-people-outreach` v8 from 1156f14 (sha256 c3290dbd matched). Proven live with a throwaway tag, then deleted.

## Not done / Sean's
- **Campaign homes in BrandDesk** (HQ repo): waits for Sean to pick the first campaign (proposal: the Plant-Based Showcase at the Dolphins game, Nov 29).
- No tag rule is on. The first (sponsor-ad click tags Sponsor interested) waits for a real sponsor link. A rule editor in the Depot is not built.
- The two edge-function deploys for this work came from the branch, not `main`; this branch is not merged yet (no PR was asked for).
- Test Manager now holds 50 lifetime points from the proof (spendable 0).
- Sean's earlier to-dos still stand: preview and switch on Pulse subscribe, the first real Depot > Outreach batch, the Nov 10 Watchlist decision, the `next-v1` video.

## Lessons
- A Depot page opened by a signed-in super admin redirects to `/dashboard/depot/<page>`: for a local browser check set `localStorage` `ve_view_as`, and use `127.0.0.1`, not `localhost`.
- `execute_sql` with several statements shows only the last result: run one query at a time.
- Super admin accounts here are `member_class` internal, not member.
- `pg_net` responses can lag a few seconds; select by id range afterward.
