# Handoff: abuse watch, step 1 (2026-11-03, Logan)

Read CLAUDE.md "Abuse watch: a judge decides". Migration `supabase/migrations/20261103_abuse_watch.sql` is applied (once-function now a 410 stub).

## Done and proven
- Tables, standing column, ledger reasons, scan, judge functions, freeze trigger, daily cron `ve-abuse-scan` (9:11 UTC).
- Scan run live: mode log_only, 0 signals, 0 would open (59 members, 13 real people).
- Rolled-back proof: non-judge and missing note refused, duplicate case refused, void 1,600 to 0 and restore to 1,600, second void refused,
  suspend blocks both earning and spending (`account_frozen`), ban and reinstate, six events logged. Nothing persisted.

## Not done, in order
1. Salted IP and browser hash at sign-up in `ve-auth` (new column or table), and a signal for several accounts on one device.
2. `ve-auth` sign-in and participation refuse `standing` suspended or banned, with a plain message (not the survey door's account).
3. Depot > Watchlist (`/admin/depot/watchlist`, `TABS` row in `public/depot-tabs.js`): cases list, one case per view with evidence, points
   history, linked accounts, and the judge's buttons (note required). Calls `ve-dashboard` or a new `ve-abuse` function with a super admin token.
4. `/policies#community` paragraph on points gained by gaming the system, before any enforcement.
5. Read `ve_abuse_scan()` results after 2026-11-10, then Sean decides whether to set `mode` to `on`.

## Checks before the first suspension
- `ve_vault_settle` and `ve_challenge_settle` loop over members: a frozen member would raise `account_frozen` and stop the loop. Wrap each
  member in its own exception block first.
- `member_watchlist` is a content watchlist, unrelated. `purgatory_*` and `strike_count` on members are unused and left alone.
