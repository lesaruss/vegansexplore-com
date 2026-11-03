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
