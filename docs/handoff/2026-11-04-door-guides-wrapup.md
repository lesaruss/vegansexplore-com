# ve-door-guides: wrap-up of the Events Guide and one-membership work (Logan, 2026-11-04)

Playbooks touched, each its own line:
- **ve-door-guides**: canon v2 and v3, member wording, and the open question of what this playbook is for.
- **ve-event-host-path**: the first heads-up send and the claim email.
- **ve-guides**: a conflict with Sean's latest line, nothing changed.

## ve-door-guides: what is true now
- Canon `canon-ve-door-guides` is at v4 in the database. I wrote v2 (event survey 100 points; the general survey admits without the event survey; a sponsorship still needs the event survey) and v3 (Sean: **the survey door and the $11 Passport are one membership**: same access to everything a member can do, only the points and a few perks differ). Another chat wrote v4 (enrollment copy, restaurants first).
- Live on main: `ve-events-guide` from 5925816 (sha256 1c3427aa...) and `public/ve-events.js` and the Guide page now say "members", not "Passport members", on recording errors; the claim email and thank-you point a host with no account at `/survey?s=vegan-events-guide` (`ve-events` from aa86477, sha256 8e4c0b52...). The error code is still `passport_needed` on purpose.
- **The survey door now waits for a person** (ve-pathways review gate): a survey member's points are held and the account turns active on Approve in Depot > Profiles > Waiting for review, so "same membership" starts on Approve, not on the last answer.
- **Restaurant Guide V1 exists on another branch.** `claude/dazzling-archimedes-3rxgti` (f5e17b5, not on main) has the personal link, the enrollment copy (`docs/proposals/door-guides-enrollment-copy.md`, 14 KB), the survey and Liz's audio; its handoff is `docs/handoff/2026-11-04-door-guides-restaurant-v1.md` on that branch. **Correction:** earlier in this chat I told Sean the enrollment copy was not in the repo; that was wrong, I had only fetched `main`. Read that branch before touching anything about restaurants.
- Its index row and next action were set by that chat; this wrap-up did not overwrite them.

## The open question (Sean's call, he is also in a pathways conversation)
What is `ve-door-guides` for? Logan's recommendation, default if Sean does not override:
1. `ve-door-guides` keeps only the shared door-Guide rules: one membership two doors, the recording rules, the struggling-clip privacy, the measures.
2. Each Guide is its own playbook (`ve-events-guide` exists; the Restaurant Guide gets one).
3. The restaurant enrollment campaign (emails, personal link) goes under `ve-pathways`.
4. `ve-guides` is parked or retired. `canon-ve-guides-playbook` (2026-11-03) says one playbook holds every Guide, which conflicts with Sean's 2026-11-04 line; change it only on his explicit word.

## ve-event-host-path
- First send: 10:07 AM Eastern 2026-11-03, 3 hosts (Philly Vegan Social Club 8 events, Plant Powered Metro New York 8, Vegetarians of Central Florida 4), 3 sent, 0 failed. At 5:27 AM Eastern 2026-11-04: 0 claims, 0 event-survey starts.
- Sean did not remember approving the wording. The database has `approved_at` 7:39 AM Eastern 2026-11-03 but not who clicked. The wording is in `ve_outreach_templates` (program `event-heads-up`) and in Depot > Events > Heads-up.
- Sean noted the Depot is hard to monitor from the front end: a separate task for him.

## Still open
- Sean: what ve-door-guides is for; ve-guides stay or retire; OK to run a real unpaid sign-up through the survey gate; River's recordings.
- ve-door-guides, not built: This month, question of the month, your story, good news, the private struggling clip, saving the plan to an account, a Depot view of `ve_door_guide_stats`, the survey step on pages with their own join step; the Creator, Nonprofit and Vegan Restaurant door Guides after 30 days of Events Guide numbers (about Dec 3).
- ve-event-host-path: read replies, claims and survey starts; next batch as events qualify (one email per host per 14 days); step 3, per-event ticketing.

## Gotchas learned
- `git fetch origin main` shows only main. Fetch the other branches (`git fetch origin`) before saying something is not in the repo; another chat's work often sits on its own branch.
- `ve-function-deploy` from SQL: the pg_net worker stalled once (queue stuck at 14); `pg_terminate_backend` on the `pg_net%` worker freed it (CLAUDE.md, pg_net stalls).
- `stream_events` wants a brand station such as `vegans-explore` and status `completed` (not `complete`).
