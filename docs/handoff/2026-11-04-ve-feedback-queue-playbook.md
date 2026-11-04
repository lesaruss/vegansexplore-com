# ve-feedback: queue re-check and the visual playbook (2026-11-04)

Playbook slug `ve-feedback`, owner Logan, status Watching. Time is Eastern.

## Done this session (each checked in the database)

- **ve-feedback: Needs support re-check.** Read nine `net.http_get` answers from `net._http_response` (ids 281899 to 281907) at 5:40 AM Eastern. Macchialina (now a Framer site) and Batter & Crumbs (live) are back up, marked Done. The list had 6 open, not 4: Jolo's Vegan Kitchen and Pie in the Sky were added by the 2 to 4 AM sweep.
- **ve-feedback: Pie in the Sky website link.** Stored website changed from `http://www.pieintheskybaltimore.com/` to `https://www.pieintheskybaltimore.com/` (https www answered 200), logged in `ve_listing_edits` (field `website`, `old_value` and `new_value` are jsonb: use `to_jsonb`), marked Done. A first attempt failed on the jsonb type while a later statement in the same call had already marked it Done and written a record; fixed, and the row, the edit and the record now agree. Lesson: do not put a "done" write in the same call as a write that can fail.
- **ve-feedback: visual playbook.** `briefings` row `ve-feedback` (type playbook, brand vegans-explore, 31 KB), filled from template `f4e2d124-c418-4637-b613-2af4ddb289ba` (v3). Overview (How to use, Pick what to work on, items 1 to 7), Work Queue (Pending 9: You decide 3, Logan works 3, Recurring 1, Parked 2; Completed 8), Links, Decision History from `playbook_records`. `ve_playbook_index` row updated.

## Still open on Needs support (outreach, not done from a session)

Happy Zoe Vegan Bakery, The Vegan Joint (https certificate rejected), Jolo's Vegan Kitchen (http works, https certificate rejected).

## Waiting on Sean

1. Has he looked at the live header signed out and with an unpaid account (two fixes live since Nov 3, never checked with a pending account).
2. ve-money-in: how to move Brooke Sellers' billing to the LESARUSS Stripe account before her Nov 30 charge ($200 a month). Logan recommends moving it this week with a short note to her.
3. ve-member-profiles-partner-windows: phase 4 (one message to past guests). Logan recommends parking it until he reports how the first windows ran (opt-ins, messages sent, mutes, reports); that is a couple of minutes of reading the tables.

## Not yet proven

The playbook page has not been opened in a browser. The build session's network policy blocked `hq.lesaruss.ai` (403 on CONNECT even after Sean added the host, which does not reach a running session). The page is a signed-in page: the next session, started after the network change, should open it with the access Sean set up and check the Pending and Completed tabs switch, the groups open, and Decision History reads. Do not call it verified until that is done.

## Next

Start a fresh session, open the playbook page and check it, then work whatever Sean picks (number or "pick for me"). Default if he does not choose: item 5, transcript matching (recurring, needs a new batch dropped in Depot > Content index). Items 6 and 7 stay parked; do not build them.
