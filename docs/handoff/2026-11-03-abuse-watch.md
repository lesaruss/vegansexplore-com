# Handoff: abuse watch (2026-11-03, Logan)

Read CLAUDE.md "Abuse watch: a judge decides" first. Canon `canon-ve-abuse-watch`, playbook `ve-abuse-watch`.

## Done and live (on main)
- Migrations `20261103_abuse_watch.sql`, `20261103_abuse_watch_devices.sql` (applied through one-time functions, now 410 stubs), `20261103_abuse_watch_canon.sql` (canon and playbook rows).
- Tables, `members.standing`, daily scans (crons `ve-abuse-scan-devices` 9:09 UTC, `ve-abuse-scan` 9:11 UTC), judge functions, freeze trigger.
- `ve-auth` (v71 and e2c549c) and `ve-votes` refuse a suspended or banned account. `public/ve-auth.js` sends the browser id.
- Depot > Watchlist (`/admin/depot/watchlist`, `ve-abuse` from 7a4085a). Proven live on the Test Manager account; page checked at 1440 and 390 px.
- Mode is **log_only until 2026-11-10**. Nothing has opened a case. Sean turns opening on from the Watchlist banner.

## Not done, in order
1. **Freeze safety, one migration** (`20261103_abuse_freeze_safety.sql`, apply through a one-time function, prove in a rolled-back transaction with a suspended bidder and a suspended challenger). Found by reading the loops, nothing changed yet:
   - `ve_vault_settle` (cron every 15 min): the winner query has no standing filter. A suspended bidder with a balance would be picked, `update members set lesars_balance` raises `account_frozen`, and the whole function rolls back every run, settling nothing for anyone. Fix: add `and m.standing = 'good'` to the bid selection and wrap each card's settle in `begin ... exception when others` (account_frozen means extend that card).
   - `ve_challenge_settle(p_id)`: pays through `ve_points_grant` (raises for a frozen member), and `ve_challenge_sweep` (cron every 15 min) has no handler, so one frozen challenger stops the sweep. Fix: at the top of settle, return `{status:'held'}` when the member's standing is not good (do not expire it), and wrap each call in the sweep in an exception block.
   - Others that raise `account_frozen` for a frozen member: `ve_points_grant` itself (any caller, for example a payment's welcome points, which could fail a Stripe webhook), `universe_join_from_purchase` (a LESARUSS store order), `ve_bounty_pay`, `ve_recipe_review` (the approval rolls back, the recipe does not go live) and `ve_hunt_award`. Recommended: `ve_points_grant` returns `{granted:false, frozen:true}` instead of raising; the direct-update functions check standing first and skip; the two admin approvals return `{error:'account_frozen'}` before changing anything.
   - `ve_referral_on_admit` is safe: its exception block catches it, so the friend's payment goes through and the sharer simply is not paid (a warning is logged).
2. **One shared standing check** in the token-only edge functions (`ve-board`, `ve-checkin`, `ve-bounties`, `ve-events`, `ve-venues`, `ve-products`, `ve-cookbook`, `ve-vault`, `ve-challenge`, `ve-group`, `ve-guide-unlock`, `ve-podcast`, `ve-referrer`, `ve-mission-survey`, owner actions in `ve-claims`): after the token is verified, on every write action, refuse with 403 `account_not_in_good_standing`. Model it on `standingBlock` in `ve-auth` and the check in `ve-votes`. Large functions deploy from a commit through `ve-function-deploy` (full 40-character sha; the token is read inside SQL from `lesaruss_secrets`, never printed).
3. **`/policies#community` paragraph** on points gained by gaming the system and what follows (void, suspend, ban, and that a ban can be undone). Sean approves the wording first. It must be live before any enforcement.
4. **2026-11-10 review**: read the Watchlist's Would flag list and `select ve_abuse_scan()`; Sean decides whether to turn on opening cases. At 59 members (13 real people) any rule is noisy.

## Open for Sean
- The case threshold (40) and the 30-day watch are Logan's defaults.
- The Watchlist's decision box sits below Points on a phone; say if it should be first.
- Never suspend anyone until items 1 and 2 are done.

## Gotchas
- `apply_migration` and write queries can be held by the connector: use the one-time function route (`scripts/supabase-once/once.template.ts`).
- `pg_get_functiondef` over every function fails on aggregates: filter `prokind = 'f'`.
- A new edge function defaults to verify_jwt on: create it first with `deploy_edge_function` and `verify_jwt false`, then deploy the real source with `ve-function-deploy`.
- Test accounts: Test Manager (`d8235957-df5a-4e7f-98cd-6ea6414c25ab`, zero points) is the safe target; the judge is Sean (`72712a4a-ea0e-4ef4-a29e-d382496ef8da`).

## Update (2026-11-03, later, Logan): items 1 and 2 done
- Item 1, freeze safety: `20261103_abuse_freeze_safety.sql` applied and proven (see CLAUDE.md "Abuse watch"). Commit f08d7b1.
- Item 2, standing check: 15 edge functions deployed from 30bdda79 (commits e7d3bce, 30bdda7), source sha256 matched; proven live with a suspended Test Manager session (writes 403, reads 200). Fail closed: a new action on those functions is a write until added to its `READ_ACTIONS`.
- Item 3, `/policies#community` wording: draft written, waiting for Sean's approval; nothing is on the page yet. **Do not turn on opening cases before it is live.**
- Item 4: after 2026-11-10 read the Watchlist's Would flag tab; Sean decides whether to turn opening on.
- Still guarded only by the trigger (points frozen) and not by the edge-function check: `ve-dashboard`, `ve-affiliate`, `ve-nonprofit`, `ve-ambassador`, `ve-people-outreach` and the other functions not listed above. Direct-balance writers not changed are listed in CLAUDE.md.

## Final state (2026-11-03, Logan, wrap-up)
- **PR** lesaruss/vegansexplore-com#135 (`claude/sleepy-keller-2hf8t5` into `main`): open, mergeable, CI green, no review comments. **Merging needs Sean.** It publishes the `/policies#community` "Earning points fairly" block (wording approved by Sean) and brings `main` in line with what is live.
- **Merge with main** (6dedf455): `ve-guide-unlock` conflicted with the Door Guides reader (`readTaster`); both kept. My first deploy of `ve-guide-unlock` and `ve-referrer` (from 30bdda79) had reverted those two functions' newer `main` changes for about 10 minutes; both redeployed from 6dedf455 and their source sha256 matches the repo (`b47f8457…`, `4e903474…`). Lesson: deploy from a commit that contains `main`, and merge `main` first when other sessions are deploying.
- **pg_net worker stalled** for about 4 minutes behind my deploy requests (worker pid active, empty query, queue growing). `pg_terminate_backend` was run once; the queue drained by itself shortly after. If it stalls again, deploy through `deploy_edge_function` directly.
- **Open**: (1) Sean merges the PR; (2) after 2026-11-10 read Depot > Watchlist > Would flag and `select ve_abuse_scan()`, Sean decides whether to turn on opening cases (the policies block must be live first, which means the PR must be merged); (3) the standing check is not in `ve-dashboard`, `ve-affiliate`, `ve-nonprofit`, `ve-ambassador`, `ve-people-outreach` and others, only the points freeze covers them; (4) direct-balance writers left alone are listed in CLAUDE.md.
