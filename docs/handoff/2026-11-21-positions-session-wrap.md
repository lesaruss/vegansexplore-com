# Handoff 2026-11-21: wrap of the Positions session (2026-11-13), add-only

Playbook `ve-positions`. Sean, 2026-11-21: "make sure that whatever wasn't captured is captured, as long as it doesn't overwrite any new things."
This session ran 2026-11-13 (BOSS, the panel, the mock, phase 1 of the build). Later chats moved the work on; **their decisions win** and nothing
here changes them.

## What later sessions decided (they supersede this session)
- **Entity**: Vegans Explore is a DBA of LESARUSS Inc. (Sean, 2026-11-13; playbook `vegans-explore-initiative-business-certification`;
  `docs/legal/2026-11-13-entity-decision-and-checklist.md`). Dissolution consent for Vegans Explore Inc. in progress there.
- **KJ's role** is Community Manager, home city Philadelphia, with her own agreement v1 LOCKED 2026-11-19
  (`docs/plans/2026-11-19-kj-agreement.md`, canon `canon-ve-community-managers`, handoff `2026-11-19-kj-community-manager.md`), not the
  Social Media Manager agreement drafted in this session (the v1 text in `20261113_positions.sql` is the earlier draft).
- **Instagram access**: Meta Business Suite, messages and comments only, with her Facebook email; Instagram Shared Access is parked (a written
  ask to Meta Verified support). This session's Shared Access decision is superseded.
- **ve-positions** is v11 (source sha256 fa5e11d5...) from the 2026-11-19 work; this session deployed v2. Never redeploy from this session's commits.
- **Her start page** is `/positions/social-media-manager-instagram/start` (5 steps, Kai's recorded lines); her dashboard `/dashboard/position`;
  Sean's side the Reach console `?tab=team`. Directory Reach goal: 250 members by Dec 31 (KJ's share 60).

## What this session made that still stands
- The tables (`ve_positions`, `ve_position_people`, `ve_position_agreements`, `ve_member_payout_accounts`, `ve_position_payouts`,
  `ve_position_events`), the pay calendar (`ve_pay_period_start`, `ve_pay_day`: Monday to Sunday periods from Mon 2026-11-16, payday the Friday
  after, the first and last part-periods paid by the day), the real-money switch `ve_site_settings positions_pay` (**live: false**), and the
  daily run `ve-positions-daily` (8:23 AM Eastern). Checked 2026-11-21: all in place; 0 payout accounts, 0 payouts; KJ and Ron Arrindell invited.
- Outreach pause lifted 2026-11-13 (12 campaigns; CLAUDE.md records it).
- The design record: `docs/plans/2026-11-13-positions-boss.md` (BOSS, panel, follow first and the last-post spot check, the stackable ladder,
  per-position applications, the three result emails Sean approved, Social Media Manager (TikTok) and (Facebook) as next roles, an Event Captain
  later, and Sean's test for which roles we post: work AI would take longer to fix than a person takes to do, mostly one to one).
- The mock `/mocks/positions` shows the 2026-11-13 design (Social Media Manager, Shared Access). Kept as the record; the live pages above are current.

## Open, not captured anywhere else
1. **`/positions/hold` does not exist.** The pay notice's "Stop this payment" button (ve-positions v11, line ~358) links there; the page must
   post `{action:'hold_token', t, confirm:true}` after a button press. Build it before the first pay notice (two days before KJ's first payday
   once her trial starts). Same family as the newer parked note: payout and offboarding emails link to `/admin/depot/positions`, which does not exist.
2. **Stripe showed 1 connected account** on the Vegans Explore Connect overview (2026-11-13) while `ve_member_payout_accounts` and
   `ve_ambassador_door` have none. Find out whose it is (Stripe, Connect, Accounts).
3. **1099 threshold**: for payments made in 2026 the 1099-NEC threshold is $2,000 (One Big Beautiful Bill Act sec. 70433; IRS 2026
   instructions), not $600. `docs/legal/2026-11-13-entity-decision-and-checklist.md` line 94 says $600; the CPA should confirm for the
   closing-year filing.
4. Before real money: one test transfer end to end, then `positions_pay.live = true` (Logan, after the proof).
